import { createAISDKTools } from '@agentic/ai-sdk'
import { throttleKy } from '@agentic/core'
import { FirecrawlClient } from '@agentic/firecrawl'
import { SlackClient } from '@agentic/slack'
import { openai } from '@ai-sdk/openai'
import { agent } from 'flows-ai'
import ky from 'ky'
import pThrottle from 'p-throttle'

/**
 * Let's throttle the Firecrawl client to 10 requests per minute,
 * as per the Firecrawl Free Plan.
 */
const firecrawl = new FirecrawlClient({
  ky: throttleKy(
    ky,
    pThrottle({
      limit: 1,
      interval: 6000,
      strict: true,
    })
  ),
})

const slack = new SlackClient()

export const githubAgent = agent({
  model: openai('gpt-4o'),
  system: `
    You are a Github analysis agent.
    You can access Github repositories and extract meaningful insights about projects.
    Focus on providing clear, structured data about repositories, issues, and project health.
  `,
  tools: createAISDKTools(firecrawl),
})

export const npmAgent = agent({
  model: openai('gpt-4o'),
  system: `
    You are an NPM registry analysis agent.
    You can access NPM registry data and provide package statistics.
    Focus on download counts and package popularity metrics.
  `,
  tools: createAISDKTools(firecrawl),
})

export const slackAgent = agent({
  model: openai('gpt-4o'),
  system: `
    You are a Slack agent.
    You can send messages to Slack.
    You always start with a friendly greeting in a casual, developer-friendly tone.
  `,
  tools: createAISDKTools(slack),
})

export const analysisAgent = agent({
  model: openai('gpt-4o'),
  system: `
    You are a data analysis agent.
    You combine and analyze data from multiple sources to create meaningful summaries.
    Focus on identifying patterns, trends, and key insights.
  `,
})

export const contentAgent = agent({
  model: openai('gpt-4o'),
  system: `
    You are a content analysis agent.
    You can analyze web content and extract information from it.
    Your summaries are clear, focused, and highlight what's most relevant for developers.
  `,
  tools: createAISDKTools(firecrawl),
})
