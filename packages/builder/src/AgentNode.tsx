import { Handle, Position } from '@xyflow/react'
import { memo } from 'react'

export default memo(({ data, isConnectable }: any) => {
  return (
    <div>
      <Handle
        type="target"
        position={Position.Top}
        onConnect={(params) => console.log('handle onConnect', params)}
        isConnectable={isConnectable}
      />
      <strong>{data.agent}</strong>
      <div>{data.name}</div>
      <Handle type="source" position={Position.Bottom} id="a" isConnectable={isConnectable} />
      {/* <Handle type="source" position={Position.Bottom} id="b" isConnectable={isConnectable} /> */}
    </div>
  )
})
