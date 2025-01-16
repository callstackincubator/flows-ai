# Dead Simple AI Orchestrator

A lightweight, type-safe AI workflow orchestrator inspired by Anthropic's agent patterns. Built on top of Vercel AI SDK.

## Installation

```bash
npm install workflows-ai
```

## Motivation

Last year, we built Fabrice - an AI agent framework designed to break down complex tasks into smaller steps. We realized that AI agent systems today are essentially modern workflows where each node is an LLM call instead of a traditional function. The key difference lies not in the framework, but in the nature of these nodes: they have flexible input/output contracts.

This insight led us to redefine our approach and focus on an orchestration, so you can connect different (often incompatible input/outputs) together. This library provides a simple, more deterministic way to build AI workflows. You can either explicitly define your workflow with loops and conditionals, or use an orchestrator agent to dynamically break down complex tasks. 

On top of that, we keep our library simple and functional, without any classes or state.

## Defining a workflow

First, you need to define your agents.

```typescript
const translationAgent = agent({
  model: openai('gpt-4'),
  system: 'You are a translation agent...',
})

const summaryAgent = agent({
  model: openai('gpt-4'),
  system: 'You are a summary agent...',
})
```

Then, you can define and run your workflow.

```ts
const translateFlow = flow({
  agent: 'sequenceAgent',
  input: [
    {
      agent: 'translationAgent',
      input: 'Translate this text to English',
    },
    {
      agent: 'summaryAgent',
      input: 'Now summarize the translated text',
    }
  ]
})

execute(translateFlow, {
  agents: {
    translationAgent,
    summaryAgent
  }
})
```

In this example, we will first translate the text to English and then summarize it.

> [!CAUTION]
> This library is in early stages and the API is not stable. We are building a higher-level API for defining workflows. For now, you need to work with a bit more verbose JSON representation of flows.

Jump to [next section](#available-workflow-patterns) to see other available composition patterns, such as parallelism or conditional execution.

## Design

The core architecture is built around the concept of a **Flow** - a simple, composable structure that can be infinitely nested.

In the examples below, you'll see flows defined as JSON-like objects. Each flow has an `agent` (what to execute), `input` (what to process), and optional properties specific to that agent. 

The `input` can be a string with instructions (if the agent is a simple LLM call), another flow or an array of flows (if agent is a workflow).

This flexibility allows for infinite composition. When a flow is executed, each agent receives its complete configuration as a payload and can decide how to handle it.

## Available Workflow Patterns

The patterns are inspired by Anthropic's agent patterns. You can learn more about them [here](https://www.anthropic.com/research/building-effective-agents).

### 1. Prompt Chaining (Sequential Processing)

Use the `sequenceAgent` to chain multiple steps where output of one step becomes input for the next.

```typescript
const translateAndSummarizeFlow = flow({
  agent: 'sequenceAgent',
  name: 'translateAndSummarize',
  input: [
    {
      agent: 'translationAgent',
      input: 'Translate this text to English',
    },
    {
      agent: 'summaryAgent',
      input: 'Now summarize the translated text',
    }
  ]
})

execute(translateAndSummarizeFlow, {
  agents: {
    translationAgent,
    summaryAgent
  }
})
```

### 2. Routing (Conditional Execution)

Use the `oneOfAgent` to dynamically route to different execution paths based on conditions.

```typescript
const routingFlow = flow({
  agent: 'oneOfAgent',
  name: 'routeBasedOnSentiment',
  input: [
    {
      agent: 'positiveResponseAgent',
      input: 'Generate positive response',
      when: 'The sentiment is positive'
    },
    {
      agent: 'negativeResponseAgent',
      input: 'Generate constructive feedback',
      when: 'The sentiment is negative'
    }
  ]
})

execute(routingFlow, {
  agents: {
    positiveResponseAgent,
    negativeResponseAgent
  }
})
```

### 3. Parallelization (Concurrent Execution)

Use the `parallelAgent` to run multiple steps concurrently and aggregate results.

```typescript
const parallelAnalysisFlow = flow({
  agent: 'parallelAgent',
  name: 'analyzeFromMultipleAngles',
  input: [
    {
      agent: 'sentimentAnalysisAgent',
      input: 'Analyze sentiment of the text'
    },
    {
      agent: 'topicExtractionAgent',
      input: 'Extract main topics from the text'
    },
    {
      agent: 'keywordExtractionAgent',
      input: 'Extract key phrases from the text'
    }
  ]
})

execute(parallelAnalysisFlow, {
  agents: {
    sentimentAnalysisAgent,
    topicExtractionAgent,
    keywordExtractionAgent
  }
})
```

### 4. Evaluator-Optimizer (Feedback Loop)

Use the `optimizeAgent` to iteratively improve results based on specific criteria.

```typescript
const optimizeFlow = flow({
  agent: 'optimizeAgent',
  name: 'improveWriting',
  input: {
    agent: 'writingAgent',
    input: 'Write a compelling story'
  },
  criteria: 'The story should be engaging, have a clear plot, and be free of grammar errors',
  max_iterations: 3
})

execute(optimizeFlow, {
  agents: {
    writingAgent
  }
})
```

### 5. Best of N (Multiple Attempts)

Use the `bestOfAllAgent` to generate multiple alternatives and pick the best one.

```typescript
const bestOfFlow = flow({
  agent: 'bestOfAllAgent',
  name: 'generateBestResponse',
  input: [
    {
      agent: 'responseAgent',
      input: 'Generate response version 1'
    },
    {
      agent: 'responseAgent',
      input: 'Generate response version 2'
    }
  ],
  criteria: 'Pick the response that is most helpful and concise'
})

execute(bestOfFlow, {
  agents: {
    responseAgent
  }
})
```

### 6. Iteration (ForEach Processing)

Use the `forEachAgent` to process a collection of items.

```typescript
const processGithubIssuesFlow = flow({
  agent: 'sequenceAgent',
  input: [
    {
      agent: 'githubAgent',
      name: 'getIssues',
      input: 'Go to Github and get the top 3 most popular issues and number of open issues.',
    },
    {
      agent: 'forEachAgent',
      name: 'iterateOverIssues',
      forEach: 'Github issue and total number of open issues',
      input: {
        agent: 'responseAgent',
        input: 'Send an email to the maintainer.',
      },
    }
  ]
})

execute(processGithubIssues, {
  agents: {
    githubAgent,
    responseAgent
  }
})
```

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

