import '@xyflow/react/dist/style.css'

import Dagre from '@dagrejs/dagre'
import {
  Background,
  Edge,
  Node,
  Panel,
  ReactFlow,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from '@xyflow/react'
import { FlowDefinition } from 'flows-ai'
import { useCallback, useMemo } from 'react'

// tbd: let's keep it during testing phase
// going forward, we will have to do something such as drag&drop or loader
import { githubProjectHealthAnalysisFlow } from '../../../example/github.ts'

const getLayoutedElements = (nodes: Node[], edges: Edge[], direction: string) => {
  const g = new Dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}))
  g.setGraph({ rankdir: direction })

  edges.forEach((edge) => g.setEdge(edge.source, edge.target))
  nodes.forEach((node) =>
    g.setNode(node.id, {
      ...node,
      width: node.measured?.width ?? 0,
      height: node.measured?.height ?? 0,
    })
  )

  Dagre.layout(g)

  return {
    nodes: nodes.map((node) => {
      const position = g.node(node.id)
      // We are shifting the dagre node position (anchor=center center) to the top left
      // so it matches the React Flow node anchor point (top left).
      const x = position.x - (node.measured?.width ?? 0) / 2
      const y = position.y - (node.measured?.height ?? 0) / 2

      return { ...node, position: { x, y } }
    }),
    edges,
  }
}

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

  const currentNode: Node = {
    id: `${nodes.length}-${flow.agent}`,
    data: {
      label: flow.agent,
      agent: flow.agent,
    },
    position: {
      x: 0,
      y: 0,
    },
  }

  nodes.push(currentNode)

  if (parentId) {
    edges.push({
      id: `${currentNode.id}-${parentId}`,
      source: parentId,
      target: currentNode.id,
      animated: true,
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
  const { fitView } = useReactFlow()

  const { nodes: initialNodes, edges: initialEdges } = useMemo(
    () => generateNodesAndEdges(githubProjectHealthAnalysisFlow),
    []
  )

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  const onLayout = useCallback(
    (direction: string) => {
      console.log(nodes)
      const layouted = getLayoutedElements(nodes, edges, direction)

      setNodes([...layouted.nodes])
      setEdges([...layouted.edges])

      window.requestAnimationFrame(() => {
        fitView()
      })
    },
    [nodes, edges]
  )

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      fitView
    >
      <Panel position="top-right">
        <button onClick={() => onLayout('TB')}>vertical layout</button>
        <button onClick={() => onLayout('LR')}>horizontal layout</button>
      </Panel>
      <Background />
    </ReactFlow>
  )
}

export default Flow
