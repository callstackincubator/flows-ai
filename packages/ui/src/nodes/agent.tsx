import { Handle, type Node, type NodeProps, Position } from '@xyflow/react'
import type { FlowDefinition } from 'flows-ai'

/**
 * Custom generic node for all types of agents.
 * In the future, we will have to add more nodes for each type of agent.
 */
export default function AgentNode({ data }: NodeProps<Node<FlowDefinition>>) {
  return (
    <div>
      <Handle type="target" position={Position.Top} />
      <strong>{data.agent}</strong>
      <div>{data.name}</div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  )
}
