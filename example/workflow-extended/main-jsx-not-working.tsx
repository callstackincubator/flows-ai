// main.tsx
import React from 'react'

import { WorkflowContext } from './steps.js'
import {
  Aggregator,
  Async,
  Evaluator,
  Gate,
  Loop,
  Parallel,
  Router,
  Sequence,
  Simple,
  Synthesiser,
  WorkflowRoot,
} from './workflow-jsx.js'

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

const myWorkflow = (
  <WorkflowRoot
    onStart={({ context }) => {
      console.log('[WORKFLOW] start', context)
    }}
    onFinish={({ context }) => {
      console.log('[WORKFLOW] finish', context)
    }}
    onError={({ context, error }) => {
      console.error('[WORKFLOW] error', { context, error })
    }}
  >
    <Sequence>
      {/*
        1) Gate – sprawdzamy warunek (np. "ctx.x > 10").
           ifFalse -> prosty SimpleStep
      */}
      <Gate
        condition="ctx.x > 10"
        ifFalse={
          <Simple
            fn={async (ctx) => {
              console.log('Gate ifFalse triggered.')
              await new Promise((r) => setTimeout(r, 100))
              ctx['gateFalse'] = true
            }}
          />
        }
      >
        <Simple
          fn={async (ctx) => {
            console.log('Gate ifTrue triggered.')
            await new Promise((r) => setTimeout(r, 100))
            ctx['gateTrue'] = true
          }}
        />
      </Gate>

      {/*
        2) Parallel – TaskA i TaskB równolegle
      */}
      <Parallel>
        <Simple fn={asyncTaskA} />
        <Simple fn={asyncTaskB} />
      </Parallel>

      {/*
        3) Router – wybiera jedną z dwóch ścieżek na bazie "instruction" i kontekstu.
           Na sztywno w "simulateChooseRoute" dałem logikę, 
           że jeśli ctx["useRoute"] === 1 to bierzemy index=1, inaczej 0.
      */}
      <Router instruction="Decide which route to go">
        <Simple
          fn={async (ctx) => {
            console.log('Router route #0')
            ctx['routerChoice'] = 0
          }}
        />
        <Simple
          fn={async (ctx) => {
            console.log('Router route #1')
            ctx['routerChoice'] = 1
          }}
        />
      </Router>

      {/*
        4) Loop – TaskC powtarzany 3 razy
      */}
      <Loop times={3}>
        <Simple fn={asyncTaskC} />
      </Loop>

      {/*
        5) Aggregator – odpala D i E równolegle, 
           potem wrzuca do context["aggregatedResults"] adnotację
      */}
      <Aggregator instruction="Sum results of D and E">
        <Simple fn={asyncTaskD} />
        <Simple fn={asyncTaskE} />
      </Aggregator>

      {/*
        6) Synthesiser – np. ponownie D i E, 
           a na końcu context["syntheticResult"]
      */}
      <Synthesiser instruction="Make one summary out of D and E">
        <Simple fn={asyncTaskD} />
        <Simple fn={asyncTaskE} />
      </Synthesiser>

      {/*
        7) Evaluator – odpalamy 2 fazy, 
           child = prosty step (np. A z modyfikacją score)
      */}
      <Evaluator phases={2}>
        <Simple
          fn={async (ctx) => {
            console.log('Evaluator child step')
            await new Promise((r) => setTimeout(r, 200))
            // losowe +score
            const randomGain = Math.floor(Math.random() * 10)
            ctx['score'] = (ctx['score'] ?? 0) + randomGain
            console.log(`Evaluator child gave +${randomGain}`)
          }}
        />
      </Evaluator>

      {/*
        8) Async – czeka na event "customEvent", 
           potem odpala swój child
      */}
      <Async eventName="customEvent">
        <Simple
          fn={async (ctx) => {
            console.log('Async step triggered by event customEvent')
            ctx['asyncResult'] = 'Event-based step done!'
          }}
        />
      </Async>
    </Sequence>
  </WorkflowRoot>
)

// Uruchamiamy workflow
;(async () => {
  try {
    // <WorkflowRoot> zwraca instancję Workflow
    // Możemy przekazać initialContext jak chcemy
    const context = { x: 5, useRoute: 0 }
    await myWorkflow.start(context)

    // Po pewnym czasie (np. 2s) emitujemy event "customEvent",
    // co powinno uruchomić AsyncStep (o ile workflow jeszcze "żyje").
    // W realnym scenariuszu event mógłby być wyemitowany skądinąd.
    setTimeout(() => {
      console.log('>>> Emitting customEvent!')
      myWorkflow.emit('customEvent')
    }, 2000)

    // Zwróć uwagę, że jeśli workflow już się zakończył,
    // to AsyncStep i tak może się nie wykonać w tym modelu.
    // Zależy jak długo nasz flow jest "aktywny".
    // Możesz np. czekać dłużej lub wprowadzić inny mechanizm.
  } catch (error) {
    console.error('[MAIN] Critical error in workflow:', error)
  }
})()
