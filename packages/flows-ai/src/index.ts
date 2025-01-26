import { openai } from '@ai-sdk/openai'
import { generateObject, generateText, type LanguageModel } from 'ai'
import s from 'dedent'
import { z, type ZodTypeAny } from 'zod'

import {
  type BestOfFlowDefinition,
  type EvaluatorFlowDefinition,
  type ForEachFlowDefinition,
  type OneOfFlowDefinition,
  type ParallelFlowDefinition,
  type SequenceFlowDefinition,
} from './flows.js'

/**
 * Helper type to hydrate the flow definition.
 * This is what is done when we call `hydrate`.
 */
type Hydrated<T> = T extends object
  ? {
      [K in keyof T]: K extends 'agent' ? Agent<T> & { name: string } : Hydrated<T[K]>
    }
  : T

/**
 * On a high-level, Flow is a very simple structure.
 *
 * It is an object with two properties:
 * - agent
 * - input
 */
export type FlowDefinition = {
  [key: string]: any
  /**
   * Name of the agent that should be executed.
   */
  agent: string
  /**
   * Input for the agent.
   *
   * For agents define with `agent` helper, input is a string.
   *
   * For other agents, input must be an object (nested flow definition)
   * or an array of objects (nested flow definitions).
   */
  input: FlowDefinition | FlowDefinition[] | string
  /**
   * Structured output for the flow.
   */
  /**
   * Optional name of the flow.
   */
  name?: string
}

/**
 * Flow is a hydrated version of FlowDefinition.
 *
 * The difference here is that `agent` is now a function, instead of a string.
 * In the future, we will perform validation here.
 */
export type Flow = Hydrated<FlowDefinition>

/**
 * Array of messages that are in the context of the flow.
 * For nested contexts, this may include messages from parent flows.
 *
 * In the future, we will extend this shape to include more complex data.
 */
type Context = string[]

/**
 * Agent is a function that will be executed in the flow.
 */
export type Agent<P = FlowDefinition> = (flow: Hydrated<P>, context: Context) => Promise<any>

type AgentFactory<T = FlowDefinition> = (opts: { model: LanguageModel }) => Agent<T>

/**
 * Use this function to hydrate a flow definition.
 */
function hydrate(definition: FlowDefinition, agents: Record<string, Agent>): Flow {
  const agent = agents[definition.agent]
  if (!agent) {
    throw new Error(`Agent ${definition.agent} not found`)
  }
  /**
   * We set the name of the agent to its name from the definition.
   */
  Object.defineProperty(agent, 'name', { value: definition.agent })
  if (typeof definition.input === 'string') {
    return {
      ...definition,
      agent,
      input: definition.input,
    }
  }
  if (Array.isArray(definition.input)) {
    return {
      ...definition,
      agent,
      input: definition.input.map((flow) => hydrate(flow, agents)),
    }
  }
  return {
    ...definition,
    agent,
    input: hydrate(definition.input, agents),
  }
}

/**
 * Helper function to create a user-defined agent that can then be referneced in a flow.
 * Like `generateText` in Vercel AI SDK, but we're taking care of `prompt`.
 */
export function agent({ maxSteps = 10, ...rest }: Parameters<typeof generateText>[0]): Agent {
  return async ({ input }, context) => {
    const response = await generateText({
      ...rest,
      maxSteps,
      prompt: s`
        Here is the context: ${JSON.stringify(context)}
        Here is the instruction: ${JSON.stringify(input)}
      `,
    })
    return response.text
  }
}

/**
 * Use this agent to implement workflow where output of each step
 * is used as input for the next step.
 */
const sequenceAgent: Agent<SequenceFlowDefinition> = async ({ input }, context) => {
  let lastResult: string | undefined
  for (const step of input) {
    lastResult = await step.agent(step, lastResult ? [...context, lastResult] : context)
  }
  return lastResult
}

/**
 * Use this agent to implement workflow where each step is executed in parallel.
 */
const parallelAgent: Agent<ParallelFlowDefinition> = async ({ input }, context) => {
  return Promise.all(input.map((step) => step.agent(step, context)))
}

/**
 * Use this agent to implement workflow where you need to route execution based on a condition.
 */
export const makeOneOfAgent: AgentFactory<OneOfFlowDefinition> =
  (opts) =>
  async ({ input, conditions }, context) => {
    const condition = await generateObject({
      ...opts,
      system: s`
        You are a condition evaluator. You will be given an array of conditions and a context.
        You will need to evaluate each condition and return the index of the condition that is true.
      `,
      prompt: s`
        Here is the context: ${JSON.stringify(context)}
        Here is the array of conditions: ${JSON.stringify(conditions)}
      `,
      schema: z.object({
        index: z
          .number()
          .describe('The index of the condition that is met, or -1 if no condition was met.'),
      }),
    })
    console.log(s`
      Here is the context: ${JSON.stringify(context)}
      Here is the array of conditions: ${JSON.stringify(conditions)}
    `)
    console.log(condition.object)
    const index = condition.object.index
    if (index === -1) {
      throw new Error('No condition was satisfied')
    }
    return input[index].agent(input[index], context)
  }

/**
 * Use this agent to implement workflow where you need to evaluate a condition
 * and optimize the flow based on the result.
 */
export const makeOptimizeAgent: AgentFactory<EvaluatorFlowDefinition> =
  (opts) =>
  async ({ input, criteria, max_iterations = 3 }, context) => {
    let rejection_reason: string | undefined
    for (let i = 0; i < max_iterations; i++) {
      const result = await input.agent(
        input,
        rejection_reason
          ? [
              ...context,
              s`
                When generating the response, make sure to address the following:
                ${JSON.stringify(rejection_reason)}
              `,
            ]
          : context
      )
      const evaluation = await generateObject({
        ...opts,
        system: s`
          You are a criteria validator.
          Your only task is to check if the result matches the given criteria.
          Do not analyze or describe what the result is.
          Simply check if it satisfies the specified criteria.
        `,
        prompt: s`
          Criteria to validate: ${JSON.stringify(criteria)}
          Does this satisfy the criteria? ${JSON.stringify(result)}
        `,
        schema: z.object({
          pass: z.boolean().describe('Whether the value satisfies the criteria.'),
          reason: z
            .string()
            .optional()
            .describe('If failed, provide a brief reason why the criteria was not met.'),
        }),
      })
      if (evaluation.object.pass) {
        return result
      }
      rejection_reason = evaluation.object.reason
    }
    throw new Error(rejection_reason)
  }

/**
 * Use this agent to implement workflow where you need to pick the best result
 * from a list of results.
 */
export const makeBestOfAllAgent: AgentFactory<BestOfFlowDefinition> =
  (opts) =>
  async ({ input, criteria }, context) => {
    const results = await Promise.all(input.map((flow) => flow.agent(flow, context)))
    const best = await generateObject({
      ...opts,
      system: s`
        You are a best of all evaluator. You will be given a list of results and a condition.
        You will need to evaluate the results and return the index of the best result.
      `,
      prompt: s`
        Here is the list of results: ${JSON.stringify(results)}
        Here is the condition: ${JSON.stringify(criteria)}
      `,
      schema: z.object({
        index: z.number().describe('The index of the best result.'),
      }),
    })
    return results[best.object.index]
  }

/**
 * Use this agent to implement workflow where you need to loop over a list of steps.
 */
export const makeForEachAgent: AgentFactory<ForEachFlowDefinition> =
  (opts) =>
  async ({ input, item }, context) => {
    const itemSchema = typeof item === 'string' ? z.string().describe(item) : (item as ZodTypeAny)
    const response = await generateObject({
      ...opts,
      system: s`
        You will be given a list of items.
        You will need to break the provided list into an array of items.
      `,
      prompt: s`
        Here is the list of items: ${JSON.stringify(context.at(-1))}
      `,
      schema: z.object({
        items: z.array(itemSchema),
      }),
    })
    const results = []
    for await (const item of response.object.items) {
      results.push(await input.agent(input, [...context.slice(0, -1), item]))
    }
    return results
  }

type ExecuteOptions = {
  /**
   * A map of agents to be used in the flow.
   */
  agents: Record<string, Agent>
  /**
   * Called before each agent is executed.
   */
  onFlowStart?: (flow: Flow, context: Context) => void
  /**
   * Called after each agent is executed.
   * For complex flows, this will be called when all nested flows are executed.
   */
  onFlowFinish?: (flow: Flow, result: any) => void
  /**
   * Initial input for the flow
   */
  input?: string
  /**
   * Default model to use for all built-in agents.
   */
  model?: LanguageModel
}

export async function execute(definition: FlowDefinition, opts: ExecuteOptions) {
  const agentOptions = {
    model: opts.model ?? openai('gpt-4o'),
  }

  /**
   * Built-in agents.
   * While the type-casting isn't ideal, we need to unify the type of agents.
   */
  const builtInAgents = {
    sequenceAgent,
    parallelAgent,
    oneOfAgent: makeOneOfAgent(agentOptions),
    bestOfAllAgent: makeBestOfAllAgent(agentOptions),
    optimizeAgent: makeOptimizeAgent(agentOptions),
    forEachAgent: makeForEachAgent(agentOptions),
  } as any as Record<string, Agent>

  let agents = {
    ...builtInAgents,
    ...opts.agents,
  }

  /**
   * When provided, we annotate each agent with a function that will call the
   * onFlowStart callback before it gets executed.
   */
  if (opts.onFlowStart || opts.onFlowFinish) {
    agents = Object.fromEntries(
      Object.entries(agents).map(([key, agent]) => [
        key,
        async (flow, context) => {
          opts.onFlowStart?.(flow, context)
          const result = await agent(flow, context)
          opts.onFlowFinish?.(flow, result)
          return result
        },
      ])
    )
  }

  /**
   * Hydrate the flow definition.
   */
  const flow = hydrate(definition, agents)

  /**
   * Execute the flow.
   */
  return flow.agent(flow, opts.input ? [opts.input] : [])
}
