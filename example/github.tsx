import { execute } from '../src/index.js'
import { createElement } from '../src/jsx.js'
import { communicationAgent, githubAgent, userInputAgent } from './github/agents.js'

/**
 * Minimal agent "components."
 * We don't return React elements; we just define them as placeholders
 * so TS sees <SequenceAgent> as a valid JSX tag.
 */
function SequenceAgent(props: any) {
  return props
}
function UserInputAgent(props: any) {
  return props
}
function GithubAgent(props: any) {
  return props
}
function ForEachAgent(props: any) {
  return props
}
function ParallelAgent(props: any) {
  return props
}
function OneOfAgent(props: any) {
  return props
}
function CommunicationAgent(props: any) {
  return props
}

const githubWorkflow = (
  <SequenceAgent name="githubProjectHealthAnalysisFlow">
    <UserInputAgent
      name="getProjectName"
      input='Get a valid Github project name in format "organization/project"'
    />

    <GithubAgent
      name="getIssues"
      input="Go to Github and get the top 3 most popular issues and number of open issues."
    />

    <ForEachAgent name="iterateOverIssues" forEach="Github issue and total number of open issues">
      <ParallelAgent>
        <OneOfAgent name="analyzeIssues">
          <CommunicationAgent
            input="Write an email to the maintainer saying he is behind schedule."
            when="There are more than 500 open issues"
          />
          <CommunicationAgent
            input="Inform the maintainer that he is doing good job."
            when="There are less than 500 open issues"
          />
        </OneOfAgent>

        <CommunicationAgent
          name="informMaintainer"
          input="Inform the maintainer about open issue."
        />
      </ParallelAgent>
    </ForEachAgent>
  </SequenceAgent>
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
