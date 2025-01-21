import '@xyflow/react/dist/style.css'

import { Background, ReactFlow } from '@xyflow/react'
import { type FlowDefinition } from 'flows-ai'

// tbd: let's keep it during testing phase
// going forward, we will have to do something such as drag&drop or loader
import { githubProjectHealthAnalysisFlow } from '../../../example/github.ts'

type Node = {
  id: string
  data: { label: string }
  type?: 'input'
}

type Edge = {
  id: `${string}-${string}`
  source: string
  target: string
}

/**
 * Recursively generates nodes and edges for a flow visualization.
 */
function generateNodesAndEdges(
  flow: FlowDefinition,
  parentId?: string
): { nodes: Node[]; edges: Edge[] } {
  /**
   * Create current node
   */
  const currentNode = {
    id: flow.name || `node-${Math.random()}`,
    data: { label: flow.name || flow.agent },
    type: parentId ? undefined : 'input',
  } satisfies Node

  /**
   * If input is a string, this is a leaf node.
   */
  if (typeof flow.input === 'string') {
    return { nodes: [currentNode], edges: [] }
  }

  const inputs = Array.isArray(flow.input) ? flow.input : [flow.input]

  /**
   * We do not need to display the following agents in the UI.
   * Instead, we will connect their nodes directly with whatever is preceding them.
   */
  if (['sequenceAgent', 'parallelAgent'].includes(flow.agent)) {
    let parentNodes = [currentNode.id]

    const nodes: Node[] = [currentNode]
    const edges: Edge[] = []

    for (const subFlow of inputs) {
      const subGraph = generateNodesAndEdges(subFlow, currentNode.id)

      nodes.push(...subGraph.nodes)
      edges.push(...subGraph.edges)

      for (const parentNode of parentNodes) {
        edges.push({
          id: `${parentNode}-${subGraph.nodes[0].id}`,
          source: parentNode,
          target: subGraph.nodes[0].id,
        })
      }

      if (flow.agent === 'sequenceAgent') {
        parentNodes = [subGraph.nodes[subGraph.nodes.length - 1].id]
      }

      if (flow.agent === 'parallelAgent') {
        parentNodes = subGraph.nodes.map((node) => node.id)
      }
    }

    return {
      nodes,
      edges,
    }
  }

  const nodes: Node[] = [currentNode]
  const edges: Edge[] = []

  for (const subFlow of inputs) {
    const subGraph = generateNodesAndEdges(subFlow, currentNode.id)

    nodes.push(...subGraph.nodes)
    edges.push(...subGraph.edges)

    edges.push({
      id: `${currentNode.id}-${subGraph.nodes[0].id}`,
      source: currentNode.id,
      target: subGraph.nodes[0].id,
    })
  }

  return {
    nodes,
    edges,
  }
}

function Flow() {
  const { nodes, edges } = generateNodesAndEdges(githubProjectHealthAnalysisFlow)

  return (
    <div style={{ height: '100vh', width: '100vw' }}>
      {/* @ts-ignore */}
      <ReactFlow nodes={nodes} edges={edges}>
        <Background />
      </ReactFlow>
    </div>
  )
}

export default Flow
