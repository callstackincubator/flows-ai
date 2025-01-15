// steps.ts
export interface WorkflowContext {
  [key: string]: any
}

export interface WorkflowStep {
  run(context: WorkflowContext): Promise<void>
}

export class SimpleStep implements WorkflowStep {
  constructor(private fn: (ctx: WorkflowContext) => Promise<void>) {}

  public async run(context: WorkflowContext): Promise<void> {
    await this.fn(context)
  }
}

export class SequenceStep implements WorkflowStep {
  constructor(private steps: WorkflowStep[]) {}

  public async run(context: WorkflowContext): Promise<void> {
    for (const step of this.steps) {
      await step.run(context)
    }
  }
}

export class ParallelStep implements WorkflowStep {
  constructor(private steps: WorkflowStep[]) {}

  public async run(context: WorkflowContext): Promise<void> {
    await Promise.all(this.steps.map((step) => step.run(context)))
  }
}

export class LoopStep implements WorkflowStep {
  constructor(
    private step: WorkflowStep,
    private iterations: number
  ) {}

  public async run(context: WorkflowContext): Promise<void> {
    for (let i = 0; i < this.iterations; i++) {
      await this.step.run(context)
    }
  }
}
