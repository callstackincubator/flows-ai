import { forEach, oneOf, parallel, sequence } from 'flows-ai/flows'

export const githubProjectHealthAnalysisFlow = sequence([
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
  forEach({
    item: 'Github issue and total number of open issues',
    input: parallel([
      oneOf([
        {
          when: 'There are more than 500 open issues',
          input: {
            agent: 'communicationAgent',
            input: 'Write an email to the maintainer saying he is behind schedule.',
          },
        },
        {
          when: 'There are less than 500 open issues',
          input: {
            agent: 'communicationAgent',
            input: 'Inform the maintainer that he is doing good job.',
          },
        },
      ]),
      {
        agent: 'communicationAgent',
        name: 'informMaintainer',
        input: 'Inform the maintainer about open issue.',
      },
    ]),
  }),
])
