import { openai } from '@ai-sdk/openai'
import { select, text } from '@clack/prompts'
import { generateText, tool } from 'ai'
import z from 'zod'

import { run } from '../index.js'

// https://sdk.vercel.ai/docs/ai-sdk-core/agents
// We're using `tool-as-agent` per Vercel AI SDK

const communicationAgent = tool({
  parameters: z.object({
    receipient: z.discriminatedUnion('type', [
      z.object({
        type: z.literal('email'),
        email: z.string().describe('The email address to send the message to'),
      }),
      z.object({
        type: z.literal('slack'),
        slack_channel: z.string().describe('The Slack channel to send the message to'),
      }),
    ]),
    message: z.string().describe('The message to send'),
  }),
  execute: async (input) => {
    return generateText({
      model: openai('gpt-4o-mini'),
      system: `
        You are a communication agent.
        You need to send a message to the given receipient.
        You can send an email or a Slack message.
      `,
      prompt: JSON.stringify(input),
    })
  },
})

/**
 * This agent takes a Github project name as input and task to perform.
 */
const githubAgent = tool({
  parameters: z.object({
    github_project_name: z.string().describe('The name of the Github project'),
    instruction: z.string().describe('The instruction to perform'),
  }),
  execute: async (input: { github_project_name: string; instruction: string }) => {
    return generateText({
      model: openai('gpt-4o-mini'),
      system: `
        You are a Github agent.
        You are given a Github project name and an instruction to perform.
        You need to perform the instruction and return the result.
      `,
      prompt: JSON.stringify(input),
      // tools: [githubApi]
    })
  },
})

/**
 * This agent takes simple text as input
 */
const userInputAgent = tool({
  parameters: z.string().describe('The question to ask the user'),
  execute: async (input: string) => {
    return generateText({
      model: openai('gpt-4o-mini'),
      system:
        'You are a user input agent. You are given a prompt and you need to return the user input.',
      prompt: input,
      tools: {
        askQuestion: tool({
          parameters: z.string().describe('The question to ask the user'),
          execute: async (message) => {
            return text({
              message,
            })
          },
        }),
        selectFromOption: tool({
          parameters: z.object({
            options: z.array(z.string()).describe('The options to select from'),
            message: z.string().describe('The question to ask the user'),
          }),
          execute: async ({ options, message }) => {
            return select({
              message,
              options: options.map((option) => ({
                value: option,
                label: option,
              })),
            })
          },
        }),
      },
    })
  },
})

// Alternative name:
// flow, agents, pipeline
const graph = {
  nodes: [githubAgent, communicationAgent, userInputAgent],
  edges: [
    {
      from: userInputAgent,
      to: githubAgent,
      instruction:
        'Go to Github and get the top 3 most popular issues. Return the top 3 most popular issues.',
    },
    {
      from: githubAgent,
      to: communicationAgent,
      condition: 'There are more than 1000 issues',
      instruction:
        'Inform the maintainer of the project about the issue with the project, highlight top 3 most popular issues. Return confirmation that the message was sent.',
    },
  ],
  root: userInputAgent,
}

run(
  graph,
  'Ask user what project they want to check. User must provide a valid Github project name and organization'
)
