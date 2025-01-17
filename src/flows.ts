import { FlowDefinition } from './index.js'

type BasicFlowDefinition = {
  [key: string]: unknown
  input: FlowDefinition<string> | FlowDefinition<string>[] | string
  /**
   * Optional name of the flow.
   */
  name?: string
}

export function sequence(definition: BasicFlowDefinition): FlowDefinition<string> {
  return {
    agent: 'sequenceAgent',
    ...definition,
  }
}

export function parallel(definition: BasicFlowDefinition): FlowDefinition<string> {
  return { agent: 'parallelAgent', ...definition }
}

type RoutingFlowDefinition = BasicFlowDefinition & {
  input: (FlowDefinition<string> & { when: string })[]
}

export function routing(definition: RoutingFlowDefinition): FlowDefinition<string> {
  return {
    agent: 'oneOfAgent',
    ...definition,
  }
}

type EvaluatorFlowDefinition = BasicFlowDefinition & {
  criteria: string
  max_iterations?: number
}

export function evaluator(definition: EvaluatorFlowDefinition): FlowDefinition<string> {
  return {
    ...definition,
    agent: 'optimizeAgent',
  }
}

type ForEachFlowDefinition = BasicFlowDefinition & {
  forEach: string
}

export function forEach(definition: ForEachFlowDefinition): FlowDefinition<string> {
  return {
    agent: 'forEachAgent',
    ...definition,
  }
}

type BestOfFlowDefinition = BasicFlowDefinition & {
  criteria: string
}

export function bestOfAll(definition: BestOfFlowDefinition): FlowDefinition<string> {
  return {
    agent: 'bestOfAllAgent',
    ...definition,
  }
}
