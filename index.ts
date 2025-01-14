import { openai } from '@ai-sdk/openai'
import { generateText, tool } from 'ai'
import { CoreTool } from 'ai'

type Edge = {
  from: string
  to: string
  instruction: string
  condition?: string
}

type Graph = {
  nodes: Record<string, CoreTool>
  edges: Edge[]
  root: string
}

export function agent({ parameters, model = openai('gpt-4o-mini'), maxSteps = 10, ...rest }: any) {
  return tool({
    parameters,
    execute: async (prompt) => {
      const response = await generateText({
        ...rest,
        model,
        maxSteps,
        prompt: JSON.stringify(prompt),
      })
      return response.text
    },
  })
}

// DO NOT USE THIS IN PRODUCTION
// BROKEN AND VERY EXPERIMENTAL NODE TRAVERSAL

async function executeNode(graph: Graph, nodeId: string, prompt: string): Promise<void> {
  const node = graph.nodes[nodeId]
  const result = await generateText({
    model: openai('gpt-4o-mini'),
    system: `
      You are an agent scheduler and executor.
      You are given an instruction, context, condition and a tool.

      You must call the tool only if the condition is met.
      You must prepare tool arguments based on the instruction and context.
    `,
    prompt,
    // tbd: maxSteps
    maxSteps: 10,
    tools: {
      // tbd: use `node` description field as `condition` when to call the tool,
      // do it once for all nodes to maximize parallelism
      [nodeId]: node,
      // tbd: error tool - avoid hallucinations if can't complete request (e.g. missing data in context)
      // tbd: tool choice required then?
    },
  })

  console.log(`Result for node ${nodeId}:`, result.text)

  const edges = graph.edges.filter((edge) => edge.from === nodeId)

  // Recursively execute all children
  await Promise.all(
    edges.map((edge) => executeNode(graph, edge.to, `${result.text} ${edge.instruction}`))
  )
}

export async function run(graph: Graph, prompt: string) {
  // Start execution from the root node
  await executeNode(graph, graph.root, prompt)
}
