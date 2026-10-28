<!-- source: langchain-ai/docs  src/snippets/code-samples/profiles-harness-register-js.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```ts
import { registerHarnessProfile } from "deepagents";

registerHarnessProfile("openai:gpt-5.5", {
  systemPromptSuffix: "Respond in under 100 words.",
  excludedTools: ["execute"],
  excludedMiddleware: ["SummarizationMiddleware"],
  generalPurposeSubagent: { enabled: false },
});
```
