import { afterEach, describe, expect, it, mock } from 'bun:test'

import { parallel, sequence } from './flows.js'
import { Agent, execute } from './index.js'

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
})
