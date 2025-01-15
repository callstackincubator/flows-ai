// workflow.ts
import { EventEmitter } from 'events'

import { WorkflowContext, WorkflowStep } from './steps.js'

/**
 * Workflow - korzysta z wbudowanego EventEmitter z Node.js
 */
export class Workflow extends EventEmitter {
  constructor(private rootStep: WorkflowStep) {
    super()
  }

  public async start(context: WorkflowContext = {}): Promise<void> {
    // Wstrzykujemy referencję do samego siebie, by AsyncStep mógł subskrybować eventy
    context['__workflow__'] = this

    this.emit('start', { context })
    try {
      await this.rootStep.run(context)
      this.emit('finish', { context })
    } catch (error) {
      this.emit('error', { context, error })
      throw error
    }
  }
}
