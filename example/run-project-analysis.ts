import { execute } from 'flows-ai'

import { githubAgent } from './agents'
import { githubProjectHealthAnalysisFlow } from './flows'

const projectName = process.argv[2]

if (!projectName) {
  console.error(
    'Please provide a project name, e.g.: bun run-project-analysis.ts facebook/react-native'
  )
  process.exit(1)
}

/**
 * Example of running a project health analysis
 */
const response = await execute(githubProjectHealthAnalysisFlow, {
  agents: {
    githubAgent,
  },
  input: projectName,
  onFlowStart: (flow) => {
    console.log('Executing', flow.agent.name)
  },
})

console.log(response)
