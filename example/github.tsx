import { execute } from '../src/index.js'
import { communicationAgent, githubAgent, userInputAgent } from './github/agents.js'

const githubWorkflow = (
  <sequence name="githubProjectHealthAnalysisFlow">
    <userInputAgent
      name="getProjectName"
      input='Get a valid Github project name in format "organization/project"'
    />

    <githubAgent
      name="getIssues"
      input="Go to Github and get the top 3 most popular issues and number of open issues."
    />

    <forEach name="iterateOverIssues" forEach="Github issue and total number of open issues">
      <parallel>
        <routing name="analyzeIssues">
          <communicationAgent
            input="Write an email to the maintainer saying he is behind schedule."
            when="There are more than 500 open issues"
          />
          <communicationAgent
            input="Inform the maintainer that he is doing good job."
            when="There are less than 500 open issues"
          />
        </routing>

        <communicationAgent
          name="informMaintainer"
          input="Inform the maintainer about open issue."
        />
      </parallel>
    </forEach>
  </sequence>
)

console.log(githubWorkflow)

const response = await execute(githubWorkflow, {
  agents: {
    userInputAgent,
    githubAgent,
    communicationAgent,
  },
  onFlowStart: (flow) => {
    console.log('Executing', flow.name)
  },
})

console.log('Received response', response)
