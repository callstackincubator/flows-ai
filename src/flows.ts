/**
 * Helpers to create flow definitions for various flow types.
 */

import { FlowDefinition } from './index.js'

export function sequence(input: FlowDefinition[]) {
  return { input, agent: 'sequenceAgent' }
}

export function parallel(input: FlowDefinition[]) {
  return { input, agent: 'parallelAgent' }
}

type RouterProps = {
  when: string
  input: FlowDefinition
}[]

export function oneOf(input: RouterProps) {
  return {
    input: input.map((value) => value.input),
    conditions: input.map((value) => value.when),
    agent: 'oneOfAgent',
  }
}

type EvaluatorProps = {
  input: FlowDefinition
  criteria: string
  max_iterations?: number
}

export function evaluator(props: EvaluatorProps) {
  return { ...props, agent: 'optimizeAgent' }
}

type ForEachProps = {
  input: FlowDefinition
  item: string
}

export function forEach(props: ForEachProps) {
  return { ...props, agent: 'forEachAgent' }
}

type BestOfFlowProps = {
  criteria: string
  input: FlowDefinition[]
}

export function bestOfAll(props: BestOfFlowProps) {
  return { ...props, agent: 'bestOfAllAgent' }
}

/**
 * Flow definitions that are returned by the flow helpers.
 */
export type ParallelFlowDefinition = ReturnType<typeof parallel>
export type OneOfFlowDefinition = ReturnType<typeof oneOf>
export type EvaluatorFlowDefinition = ReturnType<typeof evaluator>
export type ForEachFlowDefinition = ReturnType<typeof forEach>
export type BestOfFlowDefinition = ReturnType<typeof bestOfAll>
export type SequenceFlowDefinition = ReturnType<typeof sequence>
