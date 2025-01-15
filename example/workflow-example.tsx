type TaskFunction = (...args: any[]) => Promise<any> | any

interface TaskOptions {
  id: string
  execute: TaskFunction
  condition?: (context: Record<string, any>) => boolean
  parallel?: boolean
  nextTasks?: TaskOptions[]
  repeatWhile?: (context: Record<string, any>) => boolean
}

class Workflow {
  private context: Record<string, any> = {}
  private tasks: TaskOptions[] = []

  constructor(initialContext: Record<string, any> = {}) {
    this.context = { ...initialContext }
  }

  addTask(task: TaskOptions): Workflow {
    this.tasks.push(task)
    return this
  }

  private async executeTask(task: TaskOptions): Promise<void> {
    if (task.condition && !task.condition(this.context)) {
      return // Skip if condition is not met
    }

    const output = await task.execute(this.context)
    if (output !== undefined) {
      this.context[task.id] = output
    }

    if (task.repeatWhile) {
      while (task.repeatWhile(this.context)) {
        await task.execute(this.context)
      }
    }

    if (task.nextTasks) {
      if (task.parallel) {
        await Promise.all(task.nextTasks.map((nextTask) => this.executeTask(nextTask)))
      } else {
        for (const nextTask of task.nextTasks) {
          await this.executeTask(nextTask)
        }
      }
    }
  }

  async run(): Promise<Record<string, any>> {
    for (const task of this.tasks) {
      await this.executeTask(task)
    }
    return this.context
  }
}

const workflow = new Workflow({ initialValue: 0 })

workflow
  .addTask({
    id: 'start',
    execute: async (context) => {
      console.log('Starting workflow')
      return 'started'
    },
    nextTasks: [
      {
        id: 'increment',
        execute: async (context) => {
          context.counter = (context.counter || 0) + 1
          console.log(`Counter incremented to: ${context.counter}`)
          return context.counter
        },
        repeatWhile: (context) => context.counter < 3,
        nextTasks: [
          {
            id: 'conditionalStep',
            execute: async (context) => {
              console.log('Conditionally executing task')
              return 'conditional task executed'
            },
            condition: (context) => context.counter === 3,
          },
        ],
      },
    ],
  })
  .addTask({
    id: 'parallelTask',
    execute: async (context) => {
      console.log('Executing parallel tasks')
    },
    parallel: true,
    nextTasks: [
      {
        id: 'taskA',
        execute: async () => {
          console.log('Task A executed')
        },
      },
      {
        id: 'taskB',
        execute: async () => {
          console.log('Task B executed')
        },
      },
    ],
  })

workflow.run().then((context) => {
  console.log('Workflow finished with context:', context)
})
