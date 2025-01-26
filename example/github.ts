/**
 * Example of a very simple flow that analyzes the health of a Github project.
 *
 * To run this example, you will need to have `FIRECRAWL_API_KEY` configured in your environment.
 */

import { createAISDKTools } from '@agentic/ai-sdk'
import { FirecrawlClient } from '@agentic/firecrawl'
import { openai } from '@ai-sdk/openai'
import { agent, execute } from 'flows-ai'
import { forEach, sequence } from 'flows-ai/flows'
import { z } from 'zod'

/**
 * First, we define the flow.
 */
const githubProjectHealthAnalysisFlow = sequence([
  {
    agent: 'githubAgent',
    name: 'getIssues',
    input: 'Get top 10 open issues with most "thumbs down" reactions',
  },
  forEach({
    item: z.object({
      title: z.string().describe('The issue title'),
      url: z.string().describe('The URL of the issue'),
    }),
    input: sequence([
      {
        agent: 'githubAgent',
        input: 'Analyze the issue carefuly and extract the root cause',
      },
    ]),
  }),
  {
    agent: 'githubAgent',
    input: 'Extract common patterns (if any) amongst all open issues, based on provided summaries.',
  },
])

const firecrawl = new FirecrawlClient()

/**
 * Next, we define the agent. It's a simple agent that has access to the Github via Firecrawl.
 */
const githubAgent = agent({
  model: openai('gpt-4o-mini'),
  system: `
    You are a Github agent.
    You are given a Github project name and an instruction to perform.
    You can scrape the data from Github and return the result.
  `,
  tools: createAISDKTools(firecrawl),
})

/**
 * Finally, we execute the flow for "facebook/react-native" project.
 */
const response = await execute(githubProjectHealthAnalysisFlow, {
  agents: {
    githubAgent,
  },
  input: 'facebook/react-native',
  onFlowStart: (flow) => {
    console.log('Executing', flow.agent.name)
  },
})

console.log(response)
