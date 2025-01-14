import { CoreTool } from 'ai'

type Edge = {
  from: CoreTool
  to: CoreTool
  instruction: string
  condition?: string
}

type Graph = {
  nodes: CoreTool[]
  edges: Edge[]
  root: CoreTool
}

// Runner should execute prompt on root, then traverse edges
// It should take the output from previous node, check for condition and pass parameters to the agent based on the instruction.
export function run(graph: Graph, prompt: string) {
  console.log(graph, prompt)
}
