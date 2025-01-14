# dead-simple-ai-orchestrator

Assumptions:

- Do not introduce new abstraction / framework 
- Use Vercel AI SDK
- Use Vercel AI SDK `tool` as a base abstraction 
- Organize tools on a graph (easier to visualize with 3rd party tools too)

Design:

- Each node is a tool (tool can be a function, or a tool from Vercel AI SDK, or LLM call etc.)
- Nodes are connected by edges
- Each edge has a condition (when to run), and an instruction (what to run)
- We provide `agent` function that combines `generateText` and `tool` from Vercel AI SDK

Runtime:

- Each edge is evaluated by an LLM to determine if it should be run
- If an edge is run, the tool associated with it gets executed
- Edge condition and input is determined by the LLM based on past execution

tbd:
- parallel execution
- wait for all 
