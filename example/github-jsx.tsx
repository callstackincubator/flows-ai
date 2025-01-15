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

function step({ agent, instruction }: { agent: string; instruction: string }) {
  return {
    agent,
    instruction,
  }
}

// TODO: agents should be JSX components, stateProvider - for state management between agent calls
// if, loop, switch and other control flow statements should be JSX components
// execution is done programmatically - onle SOME of the JSX components are using LLM (for example "if")
const flow = () => {
  return (
    <stateProvider>
      <userInputAgent instruction="Get a valid Github project name in format 'organization/project'">
        <githubAgent instruction="Go to Github and get the top 3 most popular issues and number of open issues.">
          <if when="There are more than 10001 open issues">
            <communicationAgent instruction="Inform the maintainer of the project about the issue with the project." />
          </if>
          <if when="There are less than 10001 open issues">
            <communicationAgent instruction="Inform the maintainer that he is doing good job." />
          </if>
        </githubAgent>
      </userInputAgent>
    </stateProvider>
  )
}
