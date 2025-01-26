import { execute } from 'flows-ai'

import { contentAgent, slackAgent } from './agents'
import { newsletterSummaryFlow } from './flows'

/**
 * Summarize the newsletter content and send it to Slack
 */
const response = await execute(newsletterSummaryFlow, {
  agents: {
    contentAgent,
    slackAgent,
  },
  input: 'https://thisweekinreact.com/newsletter/218',
  onFlowStart: (flow) => {
    console.log('Executing', flow.agent.name)
  },
  onFlowFinish(flow, result) {
    console.log('Finished', flow.agent.name, result)
  },
})

console.log(response)
