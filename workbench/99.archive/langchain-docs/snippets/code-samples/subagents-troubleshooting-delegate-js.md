<!-- source: langchain-ai/docs  src/snippets/code-samples/subagents-troubleshooting-delegate-js.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```ts
import { createDeepAgent } from "deepagents";

const agent = createDeepAgent({
  systemPrompt: `...your instructions...

  IMPORTANT: For complex tasks, delegate to your subagents using the task() tool.
  This keeps your context clean and improves results.`,
  subagents: [
    {
      name: "research-agent",
      description: "Conducts research",
      systemPrompt: "You are a researcher.",
    },
  ],
});
```
