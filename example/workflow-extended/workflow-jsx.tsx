// workflow-jsx.tsx
import React from 'react'

// Rozszerzone
import {
  AggregatorStep,
  AsyncStep,
  EvaluatorStep,
  GateStep,
  RouterStep,
  SynthesiserStep,
} from './extended-steps.js'
// Podstawowe
import {
  LoopStep,
  ParallelStep,
  SequenceStep,
  SimpleStep,
  WorkflowContext,
  WorkflowStep,
} from './steps.js'
// Klasa Workflow
import { Workflow } from './workflow.js'

// ----------------------------------------------------
//  Definicje propsów + komponenty (JSX) -> WorkflowStep
// ----------------------------------------------------

// 1) Simple
interface SimpleProps {
  fn: (ctx: WorkflowContext) => Promise<void>
}
export function Simple(props: SimpleProps): WorkflowStep {
  return new SimpleStep(props.fn)
}

// 2) Sequence
interface SequenceProps {
  children?: React.ReactNode
}
export function Sequence(props: SequenceProps): WorkflowStep {
  const children = React.Children.toArray(props.children) as WorkflowStep[]
  return new SequenceStep(children)
}

// 3) Parallel
interface ParallelProps {
  children?: React.ReactNode
}
export function Parallel(props: ParallelProps): WorkflowStep {
  const children = React.Children.toArray(props.children) as WorkflowStep[]
  return new ParallelStep(children)
}

// 4) Loop
interface LoopProps {
  times: number
  children?: React.ReactNode
}
export function Loop(props: LoopProps): WorkflowStep {
  const children = React.Children.toArray(props.children)
  if (children.length !== 1) {
    throw new Error('<Loop> expects exactly one child step!')
  }
  return new LoopStep(children[0] as WorkflowStep, props.times)
}

// ----------------------------------------------------
// NOWE KOMPONENTY
// ----------------------------------------------------

// Gate
interface GateProps {
  condition: string
  ifFalse?: React.ReactNode // opcjonalnie
  children?: React.ReactNode // domyślnie ifTrue
}
export function Gate(props: GateProps): WorkflowStep {
  // children -> ifTrue (może być 1 lub kilka?), ifFalse -> oddzielny prop
  const ifTrueSteps = React.Children.toArray(props.children) as WorkflowStep[]
  let ifTrue: WorkflowStep
  if (ifTrueSteps.length === 1) {
    ifTrue = ifTrueSteps[0]
  } else if (ifTrueSteps.length > 1) {
    // jeśli ktoś wstawi kilka children, to zróbmy z nich Sequence
    ifTrue = new SequenceStep(ifTrueSteps)
  } else {
    // brak children = brak kroku ifTrue
    ifTrue = new SimpleStep(async () => {})
  }

  let ifFalse: WorkflowStep | undefined
  if (props.ifFalse) {
    const falseSteps = React.Children.toArray(props.ifFalse) as WorkflowStep[]
    if (falseSteps.length === 1) {
      ifFalse = falseSteps[0]
    } else {
      ifFalse = new SequenceStep(falseSteps)
    }
  }

  return new GateStep(props.condition, ifTrue, ifFalse)
}

// Router
interface RouterProps {
  instruction: string
  children?: React.ReactNode // sub-routes
}
export function Router(props: RouterProps): WorkflowStep {
  // potraktujmy children jako listę sub-stepów (równoważnych)
  const routes = React.Children.toArray(props.children) as WorkflowStep[]
  return new RouterStep(props.instruction, routes)
}

// Aggregator
interface AggregatorProps {
  instruction: string
  children?: React.ReactNode
}
export function Aggregator(props: AggregatorProps): WorkflowStep {
  const subSteps = React.Children.toArray(props.children) as WorkflowStep[]
  return new AggregatorStep(props.instruction, subSteps)
}

// Synthesiser
interface SynthesiserProps {
  instruction: string
  children?: React.ReactNode
}
export function Synthesiser(props: SynthesiserProps): WorkflowStep {
  const subSteps = React.Children.toArray(props.children) as WorkflowStep[]
  return new SynthesiserStep(subSteps, props.instruction)
}

// Evaluator
interface EvaluatorProps {
  phases: number
  children?: React.ReactNode // tylko 1 child
}
export function Evaluator(props: EvaluatorProps): WorkflowStep {
  const childrenArray = React.Children.toArray(props.children)
  if (childrenArray.length !== 1) {
    throw new Error('<Evaluator> expects exactly one child step!')
  }
  const child = childrenArray[0] as WorkflowStep
  return new EvaluatorStep(child, props.phases)
}

// Async
interface AsyncProps {
  eventName: string
  children?: React.ReactNode // 1 child
}
export function Async(props: AsyncProps): WorkflowStep {
  const childrenArray = React.Children.toArray(props.children)
  if (childrenArray.length !== 1) {
    throw new Error('<Async> expects exactly one child step!')
  }
  const child = childrenArray[0] as WorkflowStep
  return new AsyncStep(props.eventName, child)
}

// ----------------------------------------------------
// WorkflowRoot
// ----------------------------------------------------
interface WorkflowRootProps {
  children?: React.ReactNode
  onStart?: (payload: any) => void
  onFinish?: (payload: any) => void
  onError?: (payload: any) => void
}

export function WorkflowRoot(props: WorkflowRootProps): Workflow {
  const childrenArray = React.Children.toArray(props.children)
  if (childrenArray.length !== 1) {
    throw new Error('<WorkflowRoot> expects exactly one child (a WorkflowStep).')
  }

  const rootStep = childrenArray[0] as WorkflowStep
  const workflow = new Workflow(rootStep)

  if (props.onStart) {
    workflow.on('start', props.onStart)
  }
  if (props.onFinish) {
    workflow.on('finish', props.onFinish)
  }
  if (props.onError) {
    workflow.on('error', props.onError)
  }

  return workflow
}
