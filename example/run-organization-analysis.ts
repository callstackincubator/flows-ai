import { execute } from 'flows-ai'

import { analysisAgent, githubAgent, npmAgent } from './agents'
import { organizationAnalysisFlow } from './flows'

const orgName = process.argv[2]

if (!orgName) {
  throw new Error(
    'Please provide an organization name, e.g.: bun run-organization-analysis.ts callstackincubator'
  )
}

/**
 * Example of running an organization analysis
 */
const response = await execute(organizationAnalysisFlow, {
  agents: {
    githubAgent,
    npmAgent,
    analysisAgent,
  },
  input: orgName,
  onFlowStart: (flow) => {
    console.log('Executing', flow.agent.name)
  },
  onFlowFinish: (flow, response) => {
    console.log('Flow finished', flow.agent.name, response)
  },
})

console.log(response)
