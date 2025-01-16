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

import { Agent } from './index.js'

export type FlowDefinition<T = string> = {
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
export type Flow = FlowDefinition<Agent>

type BasicFlowDefinition = {
  [key: string]: unknown
  input: FlowDefinition<string> | FlowDefinition<string>[] | string
  /**
   * Optional name of the flow.
   */
  name?: string
}

export function chainFlow(definition: BasicFlowDefinition): FlowDefinition<string> {
  return flow({
    agent: 'sequenceAgent',
    ...definition,
  })
}

export function parallelFlow(definition: BasicFlowDefinition) {
  return flow({ agent: 'parallelAgent', name: definition.name, input: definition.input })
}

type RoutingFlowDefinition = BasicFlowDefinition & {
  input: (FlowDefinition<string> & { when: string })[]
}

export function routingFlow(definition: RoutingFlowDefinition) {
  return flow({
    agent: 'oneOfAgent',
    ...definition,
  })
}

type EvaluatorFlowDefinition = BasicFlowDefinition & {
  criteria: string
  max_iterations?: number
}

export function evaluatorFlow(definition: EvaluatorFlowDefinition) {
  return flow({
    ...definition,
    agent: 'optimizeAgent',
  })
}

type ForEachFlowDefinition = BasicFlowDefinition & {
  forEach: string
}

export function forEachFlow(definition: ForEachFlowDefinition) {
  return flow({
    agent: 'forEachAgent',
    ...definition,
  })
}

type BestOfFlowDefinition = BasicFlowDefinition & {
  criteria: string
}

export function bestOfAllFlow(definition: BestOfFlowDefinition) {
  return flow({
    agent: 'bestOfAllAgent',
    ...definition,
  })
}

function flow(definition: FlowDefinition): FlowDefinition<string> {
  return definition
}
