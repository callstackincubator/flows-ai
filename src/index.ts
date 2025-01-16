import { openai } from '@ai-sdk/openai'
import { generateObject, generateText } from 'ai'
import { z } from 'zod'

// tbd: return type
type Agent<T = any> = (prompt: T, context: string) => Promise<any>

/**
 * On a high-level, Flow is a very simple structure.
 *
 * It is an object with two properties:
 * - agent
 * - input
 *
 * It can also contain some other agent-specific properties.
 * Together, they form an agent payload.
 */
type FlowDefinition<T = string> = {
  [key: string]: unknown
  /**
   * Name of the agent that should be executed.
   */
  agent: T
  /**
   * input for the agent.
   *
   * For agents define with `agent` helper, input is a string.
   *
   * For other agents, input must be an object (nested flow definition)
   * or an array of objects (nested flow definitions).
   */
  input: FlowDefinition<T> | FlowDefinition<T>[] | string
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
type Flow = FlowDefinition<Agent>

/**
 * Use this function to hydrate a flow definition.
 */
function hydrate(definition: FlowDefinition<string>, agents: Record<string, Agent>): Flow {
  const agent = agents[definition.agent]
  if (!agent) {
    throw new Error(`Agent ${definition.agent} not found`)
  }
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

function run({ agent, ...input }: Flow, context: string) {
  return agent(input, context)
}

type UserDefinedAgentPayload = {
  input: any
}

/**
 * Helper function to create a user-defined agent that can then be referneced in a flow.
 * Like `generateText` in Vercel AI SDK, but we're taking care of `prompt`.
 */
export function agent({
  maxSteps = 10,
  ...rest
}: Parameters<typeof generateText>[0]): Agent<UserDefinedAgentPayload> {
  return async ({ input }, context) => {
    const response = await generateText({
      ...rest,
      maxSteps,
      prompt: `
        ${JSON.stringify(context)}
        Here is the instruction: ${JSON.stringify(input)}
      `,
    })
    return response.text
  }
}

type BaseAgentPayload = {
  input: Flow[]
}

/**
 * Use this agent to implement workflow where output of each step
 * is used as input for the next step.
 */
const sequenceAgent: Agent<BaseAgentPayload> = async ({ input }, context) => {
  let lastResult: string | undefined
  for (const step of input) {
    lastResult = await run(
      step,
      `
        Here is the result of previous step: ${JSON.stringify(lastResult)}
        Here is the context: ${JSON.stringify(context)}
      `
    )
  }
  return lastResult
}

/**
 * Use this agent to implement workflow where each step is executed in parallel.
 */
const parallelAgent: Agent<BaseAgentPayload> = async ({ input }, context) => {
  return Promise.all(input.map((step) => run(step, context)))
}

type OneOfAgentPayload = {
  input: (Flow & { when: string })[]
}

/**
 * Use this agent to implement workflow where you need to route execution based on a condition.
 */
const oneOfAgent: Agent<OneOfAgentPayload> = async ({ input }, context) => {
  const condition = await generateObject({
    model: openai('gpt-4o-mini'),
    system: `
      You are a condition evaluator. You will be given an array of conditions and a context.
      You will need to evaluate each condition and return the index of the condition that is true.
    `,
    prompt: `
      Here is the context: ${JSON.stringify(context)}
      Here is the array of conditions: ${JSON.stringify(input.map((p) => p.when))}
    `,
    schema: z.object({
      index: z
        .number()
        .describe('The index of the condition that is true, or -1 if no condition is true.'),
    }),
  })
  const index = condition.object.index
  if (index === -1) {
    throw new Error('No condition was satisfied')
  }
  return run(input[index], context)
}

type OptimizeAgentPayload = {
  input: Flow
  criteria: string
  max_iterations?: number
}

/**
 * Use this agent to implement workflow where you need to evaluate a condition
 * and optimize the flow based on the result.
 */
export const optimizeAgent: Agent<OptimizeAgentPayload> = async (
  { input, criteria, max_iterations = 3 },
  context: string
) => {
  let rejection_reason: string | undefined
  for (let i = 0; i < max_iterations; i++) {
    const result = await run(
      input,
      rejection_reason
        ? `
          ${JSON.stringify(context)}

          When generating the response, make sure to address the following:
          ${JSON.stringify(rejection_reason)}
        `
        : context
    )
    const evaluation = await generateObject({
      model: openai('gpt-4o-mini'),
      system: `
        You are a criteria evaluator. You will be given a result and a criteria.
        You will need to evaluate the result and return a boolean value.
      `,
      prompt: `
        Here is the result: ${JSON.stringify(result)}
        Here is the criteria: ${JSON.stringify(criteria)}
      `,
      schema: z.discriminatedUnion('type', [
        z.object({ type: z.literal('pass') }),
        z.object({
          type: z.literal('fail'),
          reason: z.string().describe('The reason why the result is not good.'),
        }),
      ]),
    })
    if (evaluation.object.type === 'pass') {
      return result
    }
    rejection_reason = evaluation.object.reason
  }
  throw new Error('Max iterations reached')
}

type BestOfAllAgentPayload = {
  input: Flow[]
  criteria: string
}

/**
 * Use this agent to implement workflow where you need to pick the best result
 * from a list of results.
 */
const bestOfAllAgent: Agent<BestOfAllAgentPayload> = async (
  { input, criteria },
  context: string
) => {
  const results = await Promise.all(input.map((flow) => run(flow, context)))
  const best = await generateObject({
    model: openai('gpt-4o-mini'),
    system: `
      You are a best of all evaluator. You will be given a list of results and a condition.
      You will need to evaluate the results and return the index of the best result.
    `,
    prompt: `
      Here is the list of results: ${JSON.stringify(results)}
      Here is the condition: ${JSON.stringify(criteria)}
    `,
    schema: z.object({
      index: z.number().describe('The index of the best result.'),
    }),
  })
  return results[best.object.index]
}

type ForEachAgentPayload = {
  input: Flow
  forEach: string
}

/**
 * Use this agent to implement workflow where you need to loop over a list of steps.
 */
const forEachAgent: Agent<ForEachAgentPayload> = async ({ input, forEach }, context) => {
  const response = await generateObject({
    model: openai('gpt-4o-mini'),
    system: `
      You are a loop agent. You will be given a list of steps and a condition.
      You will need to break the provided list of steps into smaller chunks.
      Each step must satisfy provided description.
    `,
    prompt: `
      Here is the context: ${JSON.stringify(context)}
      Here is the step description: ${forEach}
    `,
    schema: z.object({
      steps: z.array(z.string()).describe('The steps to be executed.'),
    }),
  })
  return await Promise.all(response.object.steps.map((step) => run(input, step)))
}

const builtInAgents: Record<string, Agent> = {
  sequenceAgent,
  parallelAgent,
  oneOfAgent,
  bestOfAllAgent,
  optimizeAgent,
  forEachAgent,
}

type ExecuteOptions = {
  /**
   * A map of agents to be used in the flow.
   */
  agents: Record<string, Agent>
  /**
   * Called before each agent is executed.
   */
  onFlowStart?: (flow: Flow, context: string) => void
  /**
   * Called after each agent is executed.
   * For complex flows, this will be called when all nested flows are executed.
   */
  onFlowFinish?: (flow: Flow, result: any) => void
}

export async function execute(definition: FlowDefinition<string>, opts: ExecuteOptions) {
  let agents = {
    ...builtInAgents,
    ...opts.agents,
  }
  /**
   * When provided, we annotate each agent with a function that will call the
   * onFlowStart callback before it gets executed.
   */
  if (opts.onFlowStart) {
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
  return run(hydrate(definition, agents), '')
}
