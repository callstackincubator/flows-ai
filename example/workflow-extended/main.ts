// main.ts (przykład bez JSX)

import {
  AggregatorStep,
  AsyncStep,
  EvaluatorStep,
  GateStep,
  RouterStep,
  SynthesiserStep,
} from './extended-steps.js'
import { WorkflowContext } from './steps.js'
import { LoopStep, ParallelStep, SequenceStep, SimpleStep } from './steps.js'
import { Workflow } from './workflow.js'

// ====== 1) Funkcje asynchroniczne ======
async function asyncTaskA(ctx: WorkflowContext) {
  console.log('TaskA start')
  await new Promise((r) => setTimeout(r, 500))
  ctx['resultA'] = 'A done'
  ctx['score'] = (ctx['score'] ?? 0) + 10
}

async function asyncTaskB(ctx: WorkflowContext) {
  console.log('TaskB start')
  await new Promise((r) => setTimeout(r, 800))
  ctx['resultB'] = 'B done'
  ctx['score'] = (ctx['score'] ?? 0) + 5
}

async function asyncTaskC(ctx: WorkflowContext) {
  console.log('TaskC in loop')
  await new Promise((r) => setTimeout(r, 300))
  const cCount = (ctx['cCount'] ?? 0) + 1
  ctx['cCount'] = cCount
  ctx['score'] = (ctx['score'] ?? 0) + 2
}

async function asyncTaskD(ctx: WorkflowContext) {
  console.log('TaskD for aggregator/synth')
  await new Promise((r) => setTimeout(r, 400))
  if (!ctx['collectedData']) {
    ctx['collectedData'] = []
  }
  ctx['collectedData'].push('D output')
  ctx['score'] = (ctx['score'] ?? 0) + 1
}

async function asyncTaskE(ctx: WorkflowContext) {
  console.log('TaskE for aggregator/synth')
  await new Promise((r) => setTimeout(r, 400))
  if (!ctx['collectedData']) {
    ctx['collectedData'] = []
  }
  ctx['collectedData'].push('E output')
  ctx['score'] = (ctx['score'] ?? 0) + 3
}

// ====== 2) Budowanie kroków ======

// GateStep -> ifTrue / ifFalse
const gateIfTrue = new SimpleStep(async (ctx) => {
  console.log('Gate ifTrue triggered.')
  ctx['gateTrue'] = true
})

const gateIfFalse = new SimpleStep(async (ctx) => {
  console.log('Gate ifFalse triggered.')
  ctx['gateFalse'] = true
})

// condition = "ctx.x > 10"
const gateStep = new GateStep('ctx.x > 10', gateIfTrue, gateIfFalse)

// ParallelStep -> TaskA i TaskB równolegle
const parallelStep = new ParallelStep([new SimpleStep(asyncTaskA), new SimpleStep(asyncTaskB)])

// RouterStep -> decyduje, który route uruchomić
//  W "RouterStep" jest logika, że jeśli ctx["useRoute"] = 1 -> index=1, inaczej 0
const route0 = new SimpleStep(async (ctx) => {
  console.log('Router route #0')
  ctx['routerChoice'] = 0
})
const route1 = new SimpleStep(async (ctx) => {
  console.log('Router route #1')
  ctx['routerChoice'] = 1
})

const routerStep = new RouterStep('Decide which route to go', [route0, route1])

// LoopStep -> TaskC powtarzany 3 razy
const loopStep = new LoopStep(new SimpleStep(asyncTaskC), 3)

// AggregatorStep -> odpala D i E równolegle i agreguje
const aggregatorStep = new AggregatorStep('Sum results of D and E', [
  new SimpleStep(asyncTaskD),
  new SimpleStep(asyncTaskE),
])

// SynthesiserStep -> ponownie D i E równolegle, a na końcu tworzy "syntheticResult"
const synthesiserStep = new SynthesiserStep(
  [new SimpleStep(asyncTaskD), new SimpleStep(asyncTaskE)],
  'Make one summary out of D and E'
)

// EvaluatorStep -> odpalamy 2 fazy (childStep losowo zwiększa score)
const evaluatorChild = new SimpleStep(async (ctx) => {
  console.log('Evaluator child step')
  await new Promise((r) => setTimeout(r, 200))
  const randomGain = Math.floor(Math.random() * 10)
  ctx['score'] = (ctx['score'] ?? 0) + randomGain
  console.log(`Evaluator child gave +${randomGain}`)
})

const evaluatorStep = new EvaluatorStep(evaluatorChild, 2)

// AsyncStep -> czeka na event "customEvent" i potem odpala child
const asyncChild = new SimpleStep(async (ctx) => {
  console.log('Async step triggered by event customEvent')
  ctx['asyncResult'] = 'Event-based step done!'
})

const asyncStep = new AsyncStep('customEvent', asyncChild)

// ====== 3) Składamy wszystko w jedną sekwencję ======
const mainSequence = new SequenceStep([
  gateStep,
  parallelStep,
  routerStep,
  loopStep,
  aggregatorStep,
  synthesiserStep,
  evaluatorStep,
  asyncStep,
])

// ====== 4) Tworzymy Workflow i odpalamy ======
const workflow = new Workflow(mainSequence)

workflow.on('start', ({ context }) => {
  console.log('[WORKFLOW] start', context)
})
workflow.on('finish', ({ context }) => {
  console.log('[WORKFLOW] finish', context)
})
workflow.on('error', ({ context, error }) => {
  console.error('[WORKFLOW] error', { context, error })
})
;(async () => {
  try {
    // Przykładowy kontekst startowy
    const initialContext = { x: 5, useRoute: 0 }
    await workflow.start(initialContext)

    // Emitujemy event "customEvent" po 2s,
    // dzięki czemu "AsyncStep" może się uruchomić (o ile workflow jeszcze nie "skończył").
    setTimeout(() => {
      console.log('>>> Emitting customEvent!')
      workflow.emit('customEvent')
    }, 2000)
  } catch (error) {
    console.error('[MAIN] Critical error in workflow:', error)
  }
})()
