import { openai } from '@ai-sdk/openai'
import { generateObject, generateText } from 'ai'
import { z } from 'zod'

type Agent = (prompt: any, context: string) => Promise<any>

/**
 * On a high-level, Flow is a very simple structure.
 *
 * It is an object with two properties:
 * - agent
 * - payload
 */
type FlowDefinition<T = string> = {
  [key: string]: any

  /**
   * Name of the agent that should be executed.
   */
  agent: T
  /**
   * Payload for the agent.
   *
   * For user-defined agents, payload can be anything. Handling the payload will be up to the user.
   * By default, we expect payload to be string most of the time (aka instruction).
   *
   * For routing agents, payload carries additional data for the agent.
   */
  payload: FlowDefinition<T> | FlowDefinition<T>[] | string
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
  if (typeof definition.payload === 'string') {
    return {
      ...definition,
      agent,
      payload: definition.payload,
    }
  }
  if (Array.isArray(definition.payload)) {
    return {
      ...definition,
      agent,
      payload: definition.payload.map((flow) => hydrate(flow, agents)),
    }
  }
  return {
    ...definition,
    agent,
    payload: hydrate(definition.payload, agents),
  }
}

type UserDefinedAgentInput = {
  payload: any
}

/**
 * Helper function to create a user-defined agent that can then be referneced in a flow.
 */
export function agent({ maxSteps = 10, ...rest }: Parameters<typeof generateText>[0]): Agent {
  return async ({ payload }: UserDefinedAgentInput, context: string) => {
    const response = await generateText({
      ...rest,
      maxSteps,
      prompt: `
        ${JSON.stringify(context)}
        Here is the instruction: ${JSON.stringify(payload)}
      `,
    })
    return response.text
  }
}

type SequenceAgentInput = {
  payload: Flow[]
}

/**
 * Use this agent to implement workflow where output of each step
 * is used as input for the next step.
 */
const sequenceAgent = async ({ payload }: SequenceAgentInput, context: string) => {
  let lastResult: string | undefined
  for (const step of payload) {
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

type ParallelAgentInput = {
  payload: Flow[]
}

/**
 * Use this agent to implement workflow where each step is executed in parallel.
 */
const parallelAgent = async ({ payload }: ParallelAgentInput, context: string) => {
  return Promise.all(payload.map((step: any) => run(step, context)))
}

type OneOfAgentInput = {
  payload: Flow[]
}

/**
 * Use this agent to implement workflow where you need to route execution based on a condition.
 */
const oneOfAgent = async ({ payload }: OneOfAgentInput, context: string) => {
  const condition = await generateObject({
    model: openai('gpt-4o-mini'),
    system: `
      You are a condition evaluator. You will be given an array of conditions and a context.
      You will need to evaluate each condition and return the index of the condition that is true.
    `,
    prompt: `
      Here is the context: ${JSON.stringify(context)}
      Here is the array of conditions: ${JSON.stringify(payload.map((p) => p.when))}
    `,
    schema: z.object({
      index: z.number().describe('The index of the condition that is true.'),
    }),
  })
  const index = condition.object.index
  if (index === -1) {
    throw new Error('No condition was satisfied')
  }
  return run(payload[index], context)
}

type OptimizeAgentInput = {
  payload: Flow
  criteria: string
  max_iterations?: number
}

/**
 * Use this agent to implement workflow where you need to evaluate a condition
 * and optimize the flow based on the result.
 */
export const optimizeAgent = async (
  { payload, criteria, max_iterations = 3 }: OptimizeAgentInput,
  context: string
) => {
  let rejection_reason: string | undefined
  for (let i = 0; i < max_iterations; i++) {
    const result = await run(
      payload,
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

type BestOfAllAgentInput = {
  payload: Flow[]
  criteria: string
}

/**
 * Use this agent to implement workflow where you need to pick the best result
 * from a list of results.
 */
const bestOfAllAgent = async ({ payload, criteria }: BestOfAllAgentInput, context: string) => {
  const results = await Promise.all(payload.map((flow: any) => run(flow, context)))
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

type ForEachAgentInput = {
  payload: Flow
  forEach: string
}

/**
 * Use this agent to implement workflow where you need to loop over a list of steps.
 */
const forEachAgent = async ({ payload, forEach }: ForEachAgentInput, context: string) => {
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
  return await Promise.all(response.object.steps.map((step) => run(payload, step)))
}

const builtInAgents: Record<string, Agent> = {
  sequenceAgent,
  parallelAgent,
  oneOfAgent,
  bestOfAllAgent,
  optimizeAgent,
  forEachAgent,
}

export function flow(definition: FlowDefinition<string>, agents: Record<string, Agent>) {
  return hydrate(definition, {
    ...builtInAgents,
    ...agents,
  })
}

export function run({ agent, ...payload }: Flow, context: string) {
  return agent(payload, context)
}
