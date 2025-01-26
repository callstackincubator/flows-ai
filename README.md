# Flows AI

A lightweight, type-safe AI workflow orchestrator inspired by Anthropic's agent patterns. Built on top of Vercel AI SDK.

## Installation

```bash
npm install flows-ai
```

What to do next?

- Read our [docs](https://flows-ai.callstack.com) for more information.
- Check our [examples](./example/README.md) to see how you can use Flows AI.

## Motivation

Last year, we built Fabrice - an AI agent framework designed to break down complex tasks into smaller steps. We realized that AI agent systems today are essentially modern workflows where each node is an LLM call instead of a traditional function. The key difference lies not in the framework, but in the nature of these nodes: they have flexible input/output contracts.

This insight led us to redefine our approach and focus on an orchestration, so you can connect different (often incompatible input/outputs) together. 

This library provides a simple, more deterministic way to build AI workflows. You can either explicitly define your workflow with loops and conditionals, or use an orchestrator agent to dynamically break down complex tasks. 

On top of that, we keep our library simple and functional, without any classes or state.

## Defining a workflow

First, you need to define your agents.

```ts
const translationAgent = agent({
  model: openai('gpt-4o'),
  system: 'You are a translation agent...',
})

const summaryAgent = agent({
  model: openai('gpt-4o'),
  system: 'You are a summary agent...',
})
```

Then, you can define and run your workflow.

```ts
const translateFlow = sequence([
  {
    agent: 'translationAgent',
    input: 'Translate this text to English',
  },
  {
    agent: 'summaryAgent',
    input: 'Now summarize the translated text',
  }
])

execute(translateFlow, {
  agents: {
    translationAgent,
    summaryAgent
  }
})
```

Learn more about this and other flows in our [docs](https://flows-ai.callstack.com).

## License

MIT

