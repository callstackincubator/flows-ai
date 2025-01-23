import { afterEach, describe, expect, it, mock } from 'bun:test'

import { forEach, parallel, sequence } from './flows.js'
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
        item: 'project',
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
})
