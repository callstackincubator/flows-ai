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
 */
type Flow = FlowDefinition<Agent>

/**
 * We should really build a Zod schema here to parse and validate everything.
 */
export function hydrate(
  flowDefinition: FlowDefinition<string>,
  agents: Record<string, Agent>
): Flow {
  const agent = agents[flowDefinition.agent]
  if (!agent) {
    throw new Error(`Agent ${flowDefinition.agent} not found`)
  }
  if (typeof flowDefinition.payload === 'string') {
    return {
      ...flowDefinition,
      agent,
      payload: flowDefinition.payload,
    }
  }
  if (Array.isArray(flowDefinition.payload)) {
    return {
      ...flowDefinition,
      agent,
      payload: flowDefinition.payload.map((flow) => hydrate(flow, agents)),
    }
  }
  return {
    ...flowDefinition,
    agent,
    payload: hydrate(flowDefinition.payload, agents),
  }
}

/**
 * User-defined agent. It takes a prompt and returns a text. May call `tools` to get additional information.
 */
export function agent({ maxSteps = 10, ...rest }: Parameters<typeof generateText>[0]): Agent {
  return async (prompt: any, context: string) => {
    const response = await generateText({
      ...rest,
      maxSteps,
      prompt: `
        Here is the knowledge: ${JSON.stringify(context)}
        Here is the instruction: ${JSON.stringify(prompt)}
      `,
    })
    return response.text
  }
}

/**
 * Internal agent. It will execute flows in a sequence.
 */
const sequenceAgent = async (payload: any, context: string) => {
  let lastResult = context
  for (const step of payload) {
    lastResult = await step.agent(step.payload, lastResult)
  }
  return lastResult
}

/**
 * Internal agent. It will execute flows in parallel.
 */
const parallelAgent = async (payload: any, context: string) => {
  return Promise.all(payload.map((step: any) => step.agent(step.payload, context)))
}

/**
 * Internal agent. It will evaluate a condition and execute a flow based on the result.
 */
const oneOfAgent = async (payload: any, context: string) => {
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
  return payload[index].agent(payload[index].payload, context)
}

const builtInAgents: Record<string, Agent> = {
  sequenceAgent,
  parallelAgent,
  oneOfAgent,
}

export async function run(flowDefinition: FlowDefinition, userAgents: Record<string, Agent>) {
  const flow = hydrate(flowDefinition, { ...builtInAgents, ...userAgents })
  return await flow.agent(flow.payload, '')
}
