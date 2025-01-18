import '@xyflow/react/dist/style.css'

import { Background, Edge, Node, ReactFlow } from '@xyflow/react'
import { FlowDefinition } from 'flows-ai'
import { useMemo } from 'react'

// tbd: let's keep it during testing phase
// going forward, we will have to do something such as drag&drop or loader
import { githubProjectHealthAnalysisFlow } from '../../../example/github.ts'

/**
 * Recursively generates nodes and edges for a flow visualization.
 */
function generateNodesAndEdges(
  flow: FlowDefinition,
  nodes: Node[] = [],
  edges: Edge[] = [],
  parent?: Node
): { nodes: Node[]; edges: Edge[] } {
  const parentId = parent?.id || nodes.at(-1)?.id

  const sameParentCount = nodes.filter((node) => node.parentId === parentId).length

  const currentNode: Node = {
    id: `${nodes.length}-${flow.agent}`,
    data: {
      label: flow.agent,
      agent: flow.agent,
    },
    parentId,
    position: {
      x: sameParentCount ? sameParentCount * 70 + 100 : 0,
      y: parentId ? 70 : 0,
    },
  }

  nodes.push(currentNode)

  if (parentId) {
    edges.push({
      id: `${currentNode.id}-${parentId}`,
      source: parentId,
      target: currentNode.id,
    })
  }

  // Last node, stop generating
  if (typeof flow.input === 'string') {
    return {
      nodes,
      edges,
    }
  }

  // Handle arrays of workflows
  if (Array.isArray(flow.input)) {
    // Put nodes in sequence
    if (currentNode.data['agent'] === 'sequenceAgent') {
      for (const innerFlow of flow.input) {
        generateNodesAndEdges(innerFlow, nodes, edges)
      }
    } else {
      // Put nodes parallel
      for (const innerFlow of flow.input) {
        generateNodesAndEdges(innerFlow, nodes, edges, currentNode)
      }
    }
  }

  // Handle inner workflow
  if (!Array.isArray(flow.input)) {
    generateNodesAndEdges(flow.input, nodes, edges, currentNode)
  }

  // Failsafe
  return {
    nodes,
    edges,
  }
}

function Flow() {
  const { nodes, edges } = useMemo(() => generateNodesAndEdges(githubProjectHealthAnalysisFlow), [])

  return (
    <div style={{ height: '100vh', width: '100vw' }}>
      <ReactFlow nodes={nodes} edges={edges}>
        <Background />
      </ReactFlow>
    </div>
  )
}

export default Flow
