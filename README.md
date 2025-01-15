# dead-simple-ai-orchestrator

- Do not introduce new abstraction / framework 
- Use Vercel AI SDK

- Each agent is a simple async function. Can call LLM, other agents, use tools, or simply control flow.
- Each agent defines "payload" it needs at each level to execute.

- You can use built-in control flow agents, or bring your own.
