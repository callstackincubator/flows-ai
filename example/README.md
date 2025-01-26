# Examples

This directory contains examples of using flows-ai in practice.

## Prerequisites

These examples use OpenAI and FireCrawl APIs. You need to have the following environment variables set:
- `OPENAI_API_KEY` - Your OpenAI API key
- `FIRECRAWL_API_KEY` - Your FireCrawl API key for GitHub and NPM data access

## Structure

- `flows.ts` - All flows are defined here
- `agents.ts` - All agents are defined here

## Running the examples

- `bun run-organization-analysis.ts callstackincubator` - Analyzing an entire GitHub organization
- `bun run-project-analysis.ts facebook/react-native` - Analyzing a single GitHub project
