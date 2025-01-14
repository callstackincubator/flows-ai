import { openai } from '@ai-sdk/openai'
import { generateText } from 'ai'
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

export async function run(graph: Graph, prompt: string) {
  /**
   * Execute the root node
   */
  const result = await generateText({
    model: openai('gpt-4o-mini'),
    prompt,
    tools: {
      [graph.root]: graph.nodes[graph.root],
    },
    // toolChoice: 'required',
  })

  console.log(result)

  const visited = new Set<CoreTool>()
  const queue: CoreTool[] = []

  while (queue.length > 0) {
    const currentNode = queue.shift()
    if (!currentNode || visited.has(currentNode)) {
      continue
    }

    // // Generate text using the edge's instruction
    // const generatedPrompt = await generateText({
    //   model: openai('gpt-4o-mini'),
    //   prompt,
    //   tools: [currentNode],
    // })
    console.log(currentNode)

    visited.add(currentNode)
  }
}
