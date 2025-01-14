import { openai } from '@ai-sdk/openai'
import { generateText, tool } from 'ai'
import { CoreTool } from 'ai'
import { z } from 'zod'

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

/**
 * Agent is a `generateText` wrapped inside a `tool` for compatibility with Vercel AI SDK.
 *
 * Differences:
 * - It sets `maxSteps` to 10 by default to give space for processing tool results
 * - It allows to pass `input` as a string
 * - It also converts response to string
 */
export function agent({
  input,
  maxSteps = 10,
  ...rest
}: {
  input: z.ZodString | z.ZodObject<any>
} & Parameters<typeof generateText>[0]) {
  return tool({
    parameters:
      input instanceof z.ZodString
        ? z.object({
            input,
          })
        : input,
    execute: async (prompt) => {
      const response = await generateText({
        ...rest,
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

      You must prepare tool arguments based on the instruction and context.
      Only call the tool if the condition is met.
    `,
    prompt,
    // tbd: maxSteps
    maxSteps: 10,
    tools: {
      [nodeId]: node,
      // tbd: error tool - avoid hallucinations if can't complete request (e.g. missing data in context)
      // tbd: tool choice required then?
    },
  })

  console.log(`Result for node ${nodeId}:`, result.text)

  // tbd: do not continue further if the condition was not met
  const edges = graph.edges.filter((edge) => edge.from === nodeId)

  // Recursively execute all children
  await Promise.all(
    edges.map((edge) =>
      executeNode(
        graph,
        edge.to,
        `Here is result: ${result.text}. Here is the instruction: ${edge.instruction}. Here is the condition: ${edge.condition}`
      )
    )
  )
}

export async function run(graph: Graph, prompt: string) {
  // Start execution from the root node
  await executeNode(graph, graph.root, prompt)
}
