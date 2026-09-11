<!-- source: langchain-ai/docs  src/snippets/code-samples/deep-research-agent-claude-js.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```ts
import { createDeepAgent } from "deepagents";
import { ChatAnthropic } from "@langchain/anthropic";
import { todoListMiddleware } from "langchain";

const maxConcurrentResearchUnits = 3;
const maxResearcherIterations = 3;

const currentDate = new Date().toISOString().split("T")[0];

const INSTRUCTIONS =
  RESEARCH_WORKFLOW_INSTRUCTIONS +
  "\n\n" +
  "=".repeat(80) +
  "\n\n" +
  SUBAGENT_DELEGATION_INSTRUCTIONS.replace(
    "{maxConcurrentResearchUnits}",
    String(maxConcurrentResearchUnits),
  ).replace("{maxResearcherIterations}", String(maxResearcherIterations));

const researchSubAgent = {
  name: "research-agent",
  description: "Delegate research to the sub-agent. Give one topic at a time.",
  systemPrompt: RESEARCHER_INSTRUCTIONS.replace("{date}", currentDate),
  tools: [tavilySearch],
};

const model = new ChatAnthropic({
  model: "claude-sonnet-4-5-20250929",
  temperature: 0,
});

const agent = await createDeepAgent({
  model,
  tools: [tavilySearch],
  systemPrompt: INSTRUCTIONS,
  subagents: [researchSubAgent],
  middleware: [todoListMiddleware()],
});
```
