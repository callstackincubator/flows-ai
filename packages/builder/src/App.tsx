import '@xyflow/react/dist/style.css'

import Dagre from '@dagrejs/dagre'
import {
  Background,
  Edge,
  Node,
  ReactFlow,
  useEdgesState,
  useNodesInitialized,
  useNodesState,
  useReactFlow,
} from '@xyflow/react'
import { FlowDefinition } from 'flows-ai'
import { useEffect, useMemo } from 'react'

// tbd: let's keep it during testing phase
// going forward, we will have to do something such as drag&drop or loader
import { githubProjectHealthAnalysisFlow } from '../../../example/github.ts'
import AgentNode from './AgentNode.tsx'

const nodeTypes = {
  agent: AgentNode,
}

/**
 * Calculate layout for nodes and edges.
 *
 * Taken from: https://reactflow.dev/learn/layouting/layouting#dagre
 */
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

      /**
       * We are shifting the dagre node position (anchor=center center) to the top left
       * so it matches the React Flow node anchor point (top left).
       */
      const x = position.x - (node.measured?.width ?? 0) / 2
      const y = position.y - (node.measured?.height ?? 0) / 2

      return { ...node, position: { x, y } }
    }),
    edges,
  }
}

/**
 * Recursively generates nodes and edges for a flow visualization.
 * Each node is of custom type, see `AgentNode.tsx` for details.
 */
function generateNodesAndEdges(
  flow: FlowDefinition,
  nodes: Node[] = [],
  edges: Edge[] = [],
  parent?: Node
): { nodes: Node[]; edges: Edge[] } {
  const parentId = parent?.id || nodes.at(-1)?.id

  const currentNode: Node = {
    id: crypto.randomUUID(),
    data: flow,
    type: 'agent',
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
    })
  }

  if (typeof flow.input === 'string') {
    return {
      nodes,
      edges,
    }
  }

  const subflows = Array.isArray(flow.input) ? flow.input : [flow.input]

  for (const subflow of subflows) {
    generateNodesAndEdges(
      subflow,
      nodes,
      edges,
      flow.agent === 'sequenceAgent' ? undefined : currentNode
    )
  }

  return { nodes, edges }
}

function Flow() {
  const { fitView, getNodes, getEdges } = useReactFlow()
  const nodesInitialized = useNodesInitialized()

  const { nodes: initialNodes, edges: initialEdges } = useMemo(
    () => generateNodesAndEdges(githubProjectHealthAnalysisFlow),
    []
  )

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  useEffect(() => {
    if (nodesInitialized) {
      const layouted = getLayoutedElements(getNodes(), getEdges(), 'TB')

      setNodes([...layouted.nodes])
      setEdges([...layouted.edges])

      window.requestAnimationFrame(() => {
        fitView()
      })
    }
  }, [nodesInitialized])

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      fitView
      nodeTypes={nodeTypes}
    >
      <Background />
    </ReactFlow>
  )
}

export default Flow
