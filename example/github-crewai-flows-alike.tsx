import { openai } from '@ai-sdk/openai'
import { CoreTool, generateText, tool } from 'ai'
import z from 'zod'

import { agent, run } from '../index.js'

// https://sdk.vercel.ai/docs/ai-sdk-core/agents
// We're using `tool-as-agent` per Vercel AI SDK

const communicationAgent = agent({
  model: openai('gpt-4o'),
  input: z.string().describe('The email address to send the message to'),
  system: `
    You are a communication agent.
    You need to send a message to the given receipient.

    For project maintainers, you send emails to: "opensource@callstack.com".
  `,
  tools: {
    sendEmail: tool({
      parameters: z.object({
        message: z.string().describe('The message to send'),
        to: z.string().describe('The email address to send the message to'),
      }),
      execute: async ({ message, to }) => {
        return `Email sent: ${message} to ${to}`
      },
    }),
  },
})

/**
 * This agent takes a Github project name as input and task to perform.
 */
const githubAgent = agent({
  model: openai('gpt-4o-mini'),
  input: z.object({
    github_project_name: z.string().describe('The name of the Github project'),
    instruction: z.string().describe('The instruction to perform'),
  }),
  system: `
    You are a Github agent.
    You are given a Github project name and an instruction to perform.
    You will scrape the data from Github and return the result.
  `,
  tools: {
    scrapeTool: tool({
      parameters: z.object({
        url: z.string().describe('The url to scrape'),
      }),
      execute: async () => {
        return `<html><div>Open issues: 10000</div>, Top 3 issues: <ul><li>Issue 1</li><li>Issue 2</li><li>Issue 3</li></ul></html>`
      },
    }),
  },
})

/**
 * This agent takes simple text as input
 */
const userInputAgent = agent({
  model: openai('gpt-4o-mini'),
  input: z.string().describe('The question to ask the user'),
  system: 'You are given a prompt and you need to return the user input.',
  tools: {
    askQuestion: tool({
      parameters: z.object({
        message: z.string().describe('The question to ask the user'),
      }),
      execute: async ({ message }) => {
        const { text } = await import('@clack/prompts')
        return text({
          message,
        })
      },
    }),
  },
})

type FlowCallback = (...args: any[]) => any

class Flow {
  private listeners: Map<string, FlowCallback[]> = new Map()

  start(method: FlowCallback): FlowCallback {
    const methodName = method.name
    if (!this.listeners.has(methodName)) {
      this.listeners.set(methodName, [])
    }
    return method
  }

  listen(sourceMethod: FlowCallback, listener: FlowCallback): void {
    const sourceName = sourceMethod.name
    if (!this.listeners.has(sourceName)) {
      this.listeners.set(sourceName, [])
    }
    this.listeners.get(sourceName)?.push(listener)
  }

  kickoff(startMethod: FlowCallback): any {
    const startOutput = startMethod()
    const listeners = this.listeners.get(startMethod.name) || []
    let finalOutput = startOutput

    for (const listener of listeners) {
      finalOutput = listener(finalOutput)
    }

    return finalOutput
  }
}

// very similar to what you Mike implemented in github.ts the difference is it's more programmatic with good and bad parts
class GithubExampleFlow extends Flow {
  getProjectname(): string {
    return userInputAgent.execute('What is the Github project name?');
  }

  checkGithub(projectName: string): string {
    return githubProjectAgent.execute('Check the Github project', { github_project_name: projectName });
  }

  moreThan100Issues(noIssues: number): string {
    if(noIssues > 100) {
      return communicationAgent.execute('Inform the maintainer of the project about the issue with the project.', '
    }
    
  }

  lessThan1000Issues(noIssues: number): string {
    if (noIssues < 1000) {
      return communicationAgent.execute('Inform the maintainer that he is doing good job.');
    }
  }

}

// Instantiate and define the flow
const flow = new GithubExampleFlow()

const getProjectname = flow.start(flow.getProjectname.bind(flow))
flow.listen(getProjectname, flow.checkGithub.bind(flow))
flow.listen(flow.checkGithub.bind(flow), flow.moreThan100Issues.bind(flow))
flow.listen(flow.checkGithub.bind(flow), flow.lessThan1000Issues.bind(flow))

const finalOutput = flow.kickoff(firstMethod)

console.log('---- Final Output ----')
console.log(finalOutput)
