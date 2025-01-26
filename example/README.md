# Examples

This directory contains examples of using flows-ai in practice.

## Prerequisites

These examples use OpenAI and FireCrawl APIs. You need to have the following environment variables set:
- `OPENAI_API_KEY` - Your OpenAI API key
- `FIRECRAWL_API_KEY` - Your FireCrawl API key for GitHub and NPM data access

In order to run Slack example, you need to have `SLACK_API_TOKEN` and `SLACK_CHANNEL_ID` environment variables set.

> [!NOTE]
> FireCrawl requests are throttled to 10 requests per minute, as per the Free Plan, to avoid rate limiting.

## Structure

- `flows.ts` - All flows are defined here
- `agents.ts` - All agents are defined here

> [!NOTE]
> We're using [`Agentic`](https://github.com/agentic/agentic) to create agents.

## Running the examples

- `bun run-organization-analysis.ts callstackincubator` - Analyzing an entire GitHub organization
- `bun run-project-analysis.ts facebook/react-native` - Analyzing a single GitHub project
- `bun run-organization-analysis-with-slack-message.ts callstackincubator` - Analyzing an entire GitHub organization and sending the report to Slack
- `bun run-newsletter-analysis.ts` - Summarizing the "This Week in React" newsletter content and sending it to Slack

## Cloudflare Worker

We also provide a Cloudflare Worker example.

To run it, you need to have the `wrangler` CLI installed.

```bash
bun dev
```

This will start the worker and you can see the logs in the console.
