/**
 * Helpers to create flow definitions for various flow types.
 */

import type { ZodTypeAny } from 'zod'

import { type FlowDefinition } from './index.js'

export function sequence(input: FlowDefinition[], name?: string) {
  return { input, agent: 'sequenceAgent', name }
}

export function parallel(input: FlowDefinition[], name?: string) {
  return { input, agent: 'parallelAgent', name }
}

type RouterProps = {
  when: string
  input: FlowDefinition
}[]

export function oneOf(input: RouterProps, name?: string) {
  return {
    input: input.map((value) => value.input),
    conditions: input.map((value) => value.when),
    agent: 'oneOfAgent',
    name,
  }
}

type EvaluatorProps = {
  input: FlowDefinition
  criteria: string
  max_iterations?: number
}

export function evaluator(props: EvaluatorProps, name?: string) {
  return { ...props, agent: 'optimizeAgent', name }
}

type ForEachProps = {
  input: FlowDefinition
  item: string | ZodTypeAny
}

export function forEach(props: ForEachProps, name?: string) {
  return { ...props, agent: 'forEachAgent', name }
}

type BestOfFlowProps = {
  criteria: string
  input: FlowDefinition[]
}

export function bestOfAll(props: BestOfFlowProps, name?: string) {
  return { ...props, agent: 'bestOfAllAgent', name }
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
