import { forEach, parallel, sequence } from 'flows-ai/flows'
import { z } from 'zod'

/**
 * Flow for analyzing a single GitHub project's health
 */
export const githubProjectHealthAnalysisFlow = sequence([
  {
    agent: 'githubAgent',
    name: 'getIssues',
    input:
      'Get top 10 open issues with most "thumbs down" reactions. Each issue should have a title and a URL.',
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

/**
 * Flow for analyzing an entire GitHub organization
 */
export const organizationAnalysisFlow = sequence([
  {
    agent: 'githubAgent',
    input:
      'Get the top 5 repositories by stars from this organization. Return array of objects with repository URL.',
  },
  forEach({
    item: z.object({
      url: z.string().describe('The repository URL'),
    }),
    input: sequence([
      parallel([
        {
          agent: 'githubAgent',
          input:
            'Analyze open issues and provide a summary including: total count, most common labels, and top 3 most discussed issues.',
        },
        {
          agent: 'npmAgent',
          input: 'Get weekly download count for this package from NPM registry.',
        },
      ]),
      {
        agent: 'analysisAgent',
        input: 'Create a summary combining GitHub stats and NPM data for this project.',
      },
    ]),
  }),
  {
    agent: 'analysisAgent',
    input:
      'Create an organization-wide summary analyzing patterns and insights across all projects.',
  },
])
