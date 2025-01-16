import { execute } from '../src/index.js'

const githubProjectHealthAnalysisFlow = {
  agent: 'sequenceAgent',
  name: 'githubProjectHealthAnalysisFlow',
  input: [
    {
      agent: 'userInputAgent',
      name: 'getProjectName',
      input: 'Get a valid Github project name in format "organization/project"',
    },
    {
      agent: 'githubAgent',
      name: 'getIssues',
      input: 'Go to Github and get the top 3 most popular issues and number of open issues.',
    },
    {
      agent: 'forEachAgent',
      name: 'iterateOverIssues',
      forEach: 'Github issue and total number of open issues',
      input: {
        agent: 'parallelAgent',
        input: [
          {
            agent: 'oneOfAgent',
            name: 'analyzeIssues',
            input: [
              {
                agent: 'communicationAgent',
                input: 'Write an email to the maintainer saying he is behind schedule.',
                when: 'There are more than 500 open issues',
              },
              {
                agent: 'communicationAgent',
                input: 'Inform the maintainer that he is doing good job.',
                when: 'There are less than 500 open issues',
              },
            ],
          },
          {
            agent: 'communicationAgent',
            name: 'informMaintainer',
            input: 'Inform the maintainer about open issue.',
          },
        ],
      },
    },
  ],
}

const response = await execute(githubProjectHealthAnalysisFlow, {
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
