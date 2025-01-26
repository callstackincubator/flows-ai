// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference types="@cloudflare/workers-types" />

import type { ExportedHandler } from '@cloudflare/workers-types'
import { execute } from 'flows-ai'
import * as process from 'process'

/**
 * You must define the environment variables in the worker.
 * You must also create a .dev.vars file in the root of the project with them,
 * if you want to run this locally.
 */
type Worker = ExportedHandler<{
  OPENAI_API_KEY: string
  SLACK_API_KEY: string
  SLACK_CHANNEL_ID: string
  FIRECRAWL_API_KEY: string
}>

/**
 * Cloudflare Worker example
 */
export default {
  async fetch() {
    return new Response('This worker does not handle fetch events.', { status: 200 })
  },
  async scheduled(_req, env) {
    /**
     * For simplicity, we run worker in nodejs_compat mode.
     * This means we can use process.env to set the environment variables.
     */
    process.env['OPENAI_API_KEY'] = env.OPENAI_API_KEY
    process.env['SLACK_API_KEY'] = env.SLACK_API_KEY
    process.env['SLACK_CHANNEL_ID'] = env.SLACK_CHANNEL_ID
    process.env['FIRECRAWL_API_KEY'] = env.FIRECRAWL_API_KEY

    /**
     * Import the agents and flows after setting the environment variables.
     */
    const { githubAgent, slackAgent, analysisAgent, npmAgent } = await import('./agents')
    const { organizationAnalysisWithSlackMessageFlow } = await import('./flows')

    /**
     * Execute the flow and log the response (for debugging purposes in Cloudflare Dashboard)
     */
    try {
      const response = await execute(organizationAnalysisWithSlackMessageFlow, {
        agents: {
          githubAgent,
          slackAgent,
          npmAgent,
          analysisAgent,
        },
        input: 'callstackincubator',
        onFlowStart: (flow) => {
          console.log({ agent: flow.agent.name, input: flow.input })
        },
        onFlowFinish: (flow, response) => {
          console.log({ agent: flow.agent.name, response })
        },
      })
      console.log({ response })
    } catch (err) {
      console.error(err)
    }
  },
} satisfies Worker
