# Dead Simple AI Orchestrator

A lightweight, type-safe AI workflow orchestrator inspired by Anthropic's agent patterns. Built on top of Vercel AI SDK.

## Core Concepts

- Each agent is a simple async function that can:
  - Call LLMs
  - Use tools
  - Control flow
  - Call other agents
- Workflows are defined declaratively using a simple object structure
- Built-in agents for common patterns
- Type-safe with TypeScript

## Installation

```bash
npm install dead-simple-ai-orchestrator
```

## Creating Agents

Create custom agents using the `agent` helper:

```typescript
const translationAgent = agent({
  model: openai('gpt-4'),
  system: 'You are a translation agent...',
  tools: {
    // Optional tools the agent can use
  }
})
```

Note: This is exact same API as Vercel AI SDK `generateText`. The only difference is that we pass `prompt` for you during execution.

## Available Workflow Patterns

The patterns are inspired by Anthropic's agent patterns. You can learn more about them [here](https://www.anthropic.com/research/building-effective-agents).

### 1. Prompt Chaining (Sequential Processing)

Use the `sequenceAgent` to chain multiple steps where output of one step becomes input for the next.

```typescript
const translateAndSummarizeFlow = {
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
}
```

### 2. Routing (Conditional Execution)

Use the `oneOfAgent` to dynamically route to different execution paths based on conditions.

```typescript
const routingFlow = {
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
}
```

### 3. Parallelization (Concurrent Execution)

Use the `parallelAgent` to run multiple steps concurrently and aggregate results.

```typescript
const parallelAnalysisFlow = {
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
}
```

### 4. Evaluator-Optimizer (Feedback Loop)

Use the `optimizeAgent` to iteratively improve results based on specific criteria.

```typescript
const optimizeFlow = {
  agent: 'optimizeAgent',
  name: 'improveWriting',
  input: {
    agent: 'writingAgent',
    input: 'Write a compelling story'
  },
  criteria: 'The story should be engaging, have a clear plot, and be free of grammar errors',
  max_iterations: 3
}
```

### 5. Best of N (Multiple Attempts)

Use the `bestOfAllAgent` to generate multiple alternatives and pick the best one.

```typescript
const bestOfFlow = {
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
}
```

### 6. Iteration (ForEach Processing)

Use the `forEachAgent` to process a collection of items.

```typescript
const processGithubIssues = {
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
}
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

