import { afterEach, describe, expect, it, mock } from 'bun:test'
import { z } from 'zod'

import { evaluator, forEach, parallel, sequence } from './flows.js'
import { type Agent, execute } from './index.js'

const agent = mock<Agent>(async ({ input }) => input)

afterEach(() => {
  agent.mockClear()
})

describe('parallel', () => {
  it('should run sub-flows in parallel and return the results', async () => {
    const flow = parallel([
      {
        input: 'foo',
        agent: 'agent',
      },
      {
        input: 'bar',
        agent: 'agent',
      },
    ])

    const result = await execute(flow, {
      agents: {
        agent,
      },
    })

    expect(result).toEqual(['foo', 'bar'])
  })
})

describe('sequence', () => {
  it('should run sub-flows in sequence and return last result', async () => {
    const flow = sequence([
      {
        input: 'foo',
        agent: 'agent',
      },
      {
        input: 'bar',
        agent: 'agent',
      },
    ])

    const result = await execute(flow, {
      agents: {
        agent,
      },
    })

    expect(result).toEqual('bar')
  })

  it('should pass context from previous agent to next agent', async () => {
    const flow = sequence([
      {
        input: 'foo',
        agent: 'agent',
      },
      {
        input: 'bar',
        agent: 'agent',
      },
    ])

    await execute(flow, {
      agents: {
        agent,
      },
    })

    expect(agent.mock.calls[0][1]).toEqual([])
    expect(agent.mock.calls[1][1]).toEqual(['foo'])
  })

  it('should pass output from previous agents in the parent flow', async () => {
    const flow = sequence([
      {
        input: 'foo',
        agent: 'agent',
      },
      sequence([
        {
          input: 'bar',
          agent: 'agent',
        },
        {
          input: 'baz',
          agent: 'agent',
        },
      ]),
    ])

    await execute(flow, {
      agents: {
        agent,
      },
    })

    expect(agent.mock.calls[2][1]).toEqual(['foo', 'bar'])
  })
})

describe('forEach', () => {
  it('should run sub-flows in parallel for each item in the list', async () => {
    const flow = sequence([
      {
        input: `
          Here are all projects I found:
          - callstackincubator/foo
          - callstackincubator/bar
          - callstackincubator/baz
        `,
        agent: 'agent',
      },
      forEach({
        item: 'The project name',
        input: {
          agent: 'item',
          input: '',
        },
      }),
    ])

    const item = mock<Agent>(async ({ input }) => input)

    await execute(flow, {
      agents: {
        agent,
        item,
      },
    })

    expect(item).toHaveBeenCalledTimes(3)

    expect(item.mock.calls[0][1]).toEqual(['callstackincubator/foo'])
    expect(item.mock.calls[1][1]).toEqual(['callstackincubator/bar'])
    expect(item.mock.calls[2][1]).toEqual(['callstackincubator/baz'])
  })
  it('should break the list into items that satisfy the given schema', async () => {
    const flow = sequence([
      {
        input: `
          Here are all the github projects I found:
          - callstackincubator/foo, stars 1000
          - callstackincubator/bar, stars 2000
          - callstackincubator/baz, stars 3000
        `,
        agent: 'agent',
      },
      forEach({
        item: z
          .object({
            organization: z.string().describe('The organization name'),
            project: z.string().describe('The project name'),
            stars: z.number().describe('The number of stars'),
          })
          .describe('Single github project'),
        input: {
          agent: 'item',
          input: '',
        },
      }),
    ])

    const item = mock<Agent>(async ({ input }) => input)

    await execute(flow, {
      agents: {
        agent,
        item,
      },
    })

    expect(item).toHaveBeenCalledTimes(3)

    expect(item.mock.calls.map((call) => call[1])).toMatchInlineSnapshot(`
[
  [
    {
      "organization": "callstackincubator",
      "project": "foo",
      "stars": 1000,
    },
  ],
  [
    {
      "organization": "callstackincubator",
      "project": "bar",
      "stars": 2000,
    },
  ],
  [
    {
      "organization": "callstackincubator",
      "project": "baz",
      "stars": 3000,
    },
  ],
]
`)
  })
})

describe('evaluator', () => {
  it('should throw an error if the criteria is not met', async () => {
    const flow = evaluator({
      input: {
        agent: 'agent',
        input: 'Quick brown fox jumped over lazy dog',
      },
      criteria: 'Must be at least 100 words',
      max_iterations: 2,
    })

    expect(() =>
      execute(flow, {
        agents: {
          agent,
        },
      })
    ).toThrowError()
  })
  it('should re-run sub-flow until criteria is met', async () => {
    const flow = evaluator({
      input: {
        agent: 'agent',
        input: 'Write a short story about a cat',
      },
      criteria: 'The story must be about a cat named Fluffy',
      max_iterations: 2,
    })

    agent.mockImplementation(async (_, context) => {
      if (context.find((message) => message.includes('Fluffy'))) {
        return 'This is a story about a cat named Fluffy'
      }
      return 'This is a story about a cat without a name'
    })

    const result = await execute(flow, {
      agents: {
        agent,
      },
    })

    expect(result).toContain('Fluffy')
  })
})
