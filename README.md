# Flows AI

A lightweight, type-safe AI workflow orchestrator inspired by Anthropic's agent patterns. Built on top of Vercel AI SDK.

## Installation

```bash
npm install flows-ai
```

## Motivation

Last year, we built Fabrice - an AI agent framework designed to break down complex tasks into smaller steps. We realized that AI agent systems today are essentially modern workflows where each node is an LLM call instead of a traditional function. The key difference lies not in the framework, but in the nature of these nodes: they have flexible input/output contracts.

This insight led us to redefine our approach and focus on an orchestration, so you can connect different (often incompatible input/outputs) together. This library provides a simple, more deterministic way to build AI workflows. You can either explicitly define your workflow with loops and conditionals, or use an orchestrator agent to dynamically break down complex tasks. 

On top of that, we keep our library simple and functional, without any classes or state.

## Defining a workflow

First, you need to define your agents.

```typescript
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

In this example, we will first translate the text to English and then summarize it.

Jump to [next section](#available-workflow-patterns) to see other available composition patterns, such as parallelism or conditional execution.

## Design

The core architecture is built around the concept of a **Flow** - a simple, composable structure that can be infinitely nested.

In the examples below, you'll see flows defined as JSON-like objects. Each flow has an `agent` (what to execute), `input` (what to process), and optional properties specific to that agent. 

The `input` can be a string with instructions (if the agent is a simple LLM call), another flow or an array of flows (if agent is a workflow).

This flexibility allows for infinite composition. When a flow is executed, each agent receives its complete configuration as a payload and can decide how to handle it.

## Available Workflow Patterns

The patterns are inspired by Anthropic's agent patterns. You can learn more about them [here](https://www.anthropic.com/research/building-effective-agents).

## Running Workflows

Use the `execute` function to run a workflow:

```typescript
const response = await execute(flow, {
  agents: {
    // Your custom agents
    translationAgent,
    summaryAgent,
    // etc...
  },
  onFlowStart: (flow) => {
    console.log('Starting flow:', flow.name)
  }
})
```

## License

MIT

