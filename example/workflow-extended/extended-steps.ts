// extended-steps.ts
import { WorkflowContext, WorkflowStep } from './steps.js'

/**
 * GateStep:
 * - Ma warunek w postaci stringa (np. "ctx.value > 10")
 * - Jeśli warunek jest prawdziwy, uruchamiamy ifTrue
 * - Jeśli fałszywy, opcjonalnie uruchamiamy ifFalse (jeśli jest)
 *
 * UWAGA: Poniżej używam `eval(condition)` z kontekstem w postaci `ctx`, co jest
 * bardzo niebezpieczne w realnej aplikacji. Tutaj pokazuje jedynie koncepcję.
 */
export class GateStep implements WorkflowStep {
  constructor(
    private condition: string,
    private ifTrue: WorkflowStep,
    private ifFalse?: WorkflowStep
  ) {}

  public async run(context: WorkflowContext): Promise<void> {
    const isTrue = this.evaluateCondition(context)
    if (isTrue) {
      await this.ifTrue.run(context)
    } else if (this.ifFalse) {
      await this.ifFalse.run(context)
    }
  }

  private evaluateCondition(context: WorkflowContext): boolean {
    // BARDZO NIEBEZPIECZNE (eval)! W realnym kodzie unikaj lub używaj sandboxów
    return !!Function('ctx', `return (${this.condition});`)(context)
  }
}

/**
 * RouterStep:
 * - Parametr `instruction` (string) opisuje co chcemy osiągnąć.
 * - Mamy wiele możliwych ścieżek (kroków). RouterStep wybiera jedną z nich
 *   na bazie "logiki" (tutaj symulujemy to pseudo-wywołaniem jakiejś metody).
 */
export class RouterStep implements WorkflowStep {
  constructor(
    private instruction: string,
    private routes: WorkflowStep[] // lub np. Record<string, WorkflowStep>
  ) {}

  public async run(context: WorkflowContext): Promise<void> {
    // Tu moglibyśmy wywołać LLM (np. GPT) i na podstawie `instruction` oraz `context`
    // zadecydować, który route wykonać. Poniżej symulujemy wybór 0-lub-inny.
    const chosenIndex = this.simulateChooseRoute(context)

    console.log(`RouterStep: wybieram route[${chosenIndex}] (instruction="${this.instruction}")`)
    await this.routes[chosenIndex].run(context)
  }

  private simulateChooseRoute(context: WorkflowContext): number {
    // Dla przykładu: jeśli w kontekście jest "useRoute=1" to wybierz 1,
    // w przeciwnym razie 0.
    return context['useRoute'] === 1 ? 1 : 0
  }
}

/**
 * AggregatorStep:
 * - Odpala podzadania równolegle i "agreguje" wyniki w kontekście.
 * - Parametr `instruction` może np. zawierać opis, jak je łączyć.
 *   (Tutaj jedynie składamy wyniki w tablicę "aggregatedResults".)
 */
export class AggregatorStep implements WorkflowStep {
  constructor(
    private instruction: string,
    private steps: WorkflowStep[]
  ) {}

  public async run(context: WorkflowContext): Promise<void> {
    console.log(`AggregatorStep: start (instruction="${this.instruction}")`)
    // Możemy skopiować context przed odpaleniem zadań równolegle,
    // albo pozwolić im współdzielić. Na potrzeby przykładu współdzielimy.
    await Promise.all(this.steps.map((step) => step.run(context)))

    // Na koniec "agregujemy" - w tym przykładzie bierzemy np. "collectedData"
    // z kontekstu i składamy w jedną tablicę
    if (!context['aggregatedResults']) {
      context['aggregatedResults'] = []
    }
    context['aggregatedResults'].push(`Wynik z aggregator: ${this.instruction}`)
  }
}

/**
 * SynthesiserStep:
 * - Odpala podzadania równolegle, a na końcu tworzy "jedną wartość".
 *   Dla przykładu łączymy dane w 1 string i zapisujemy w `context["syntheticResult"]`.
 */
export class SynthesiserStep implements WorkflowStep {
  constructor(
    private steps: WorkflowStep[],
    private instruction: string
  ) {}

  public async run(context: WorkflowContext): Promise<void> {
    console.log(`SynthesiserStep: start (instruction="${this.instruction}")`)
    await Promise.all(this.steps.map((step) => step.run(context)))

    // Przykładowa "synteza" - łączymy stringi, klucze, cokolwiek
    const now = new Date().toISOString()
    context['syntheticResult'] = `Synthesised at ${now} with note: "${this.instruction}"`
  }
}

/**
 * EvaluatorStep:
 * - Ma `phases` (liczba powtórzeń).
 * - Posiada dokładnie jeden child, który odpalamy wielokrotnie.
 * - Po każdej iteracji "oceniamy" wynik i przechowujemy najlepszy w kontekście.
 *
 * Tu można użyć dowolnej metody "oceny"; dla przykładu zapiszę do `context["bestResult"]`.
 */
export class EvaluatorStep implements WorkflowStep {
  private bestScore = -Infinity
  private bestData: any = null

  constructor(
    private childStep: WorkflowStep,
    private phases: number
  ) {}

  public async run(context: WorkflowContext): Promise<void> {
    for (let i = 0; i < this.phases; i++) {
      console.log(`EvaluatorStep: faza ${i + 1} / ${this.phases}`)
      // Tymczasowo sklonujemy context, by zbadać wynik tej fazy
      const tempContext = { ...context }
      await this.childStep.run(tempContext)

      // Przykład oceny: jeżeli tempContext ma "score" i jest lepszy, to zapamiętujemy
      const score = tempContext['score'] ?? 0
      if (score > this.bestScore) {
        this.bestScore = score
        this.bestData = { ...tempContext }
      }
    }
    context['bestResult'] = this.bestData
    context['bestScore'] = this.bestScore
  }
}

/**
 * AsyncStep:
 * - Uruchamia się dopiero, gdy w workflow zostanie wyemitowany event o danej nazwie.
 * - Możemy to osiągnąć np. zakładając, że w `context["__workflow__"]` jest referencja
 *   do obiektu Workflow (EventEmitter). W metodzie `run` rejestrujemy listener
 *   i czekamy, aż zdarzenie nastąpi.
 *
 * - Dodatkowo, gdy event nastąpi, odpalamy nasz `childStep`.
 */
export class AsyncStep implements WorkflowStep {
  constructor(
    private eventName: string,
    private childStep: WorkflowStep
  ) {}

  public async run(context: WorkflowContext): Promise<void> {
    // Zakładamy, że twórca Workflow wstrzyknął `__workflow__` do context
    const workflowEmitter = context['__workflow__']
    if (!workflowEmitter || typeof workflowEmitter.on !== 'function') {
      console.warn('AsyncStep: Brak workflowEmitter w context. Uruchamiam childStep od razu.')
      await this.childStep.run(context)
      return
    }

    console.log(`AsyncStep: czekam na event "${this.eventName}"...`)
    await new Promise<void>((resolve, reject) => {
      const onEvent = async () => {
        workflowEmitter.off(this.eventName, onEvent) // Jednorazowe
        try {
          console.log(`AsyncStep: event "${this.eventName}" otrzymany, odpalam childStep.`)
          await this.childStep.run(context)
          resolve()
        } catch (err) {
          reject(err)
        }
      }
      workflowEmitter.on(this.eventName, onEvent)
    })
  }
}
