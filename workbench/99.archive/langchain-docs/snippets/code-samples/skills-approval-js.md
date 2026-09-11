<!-- source: langchain-ai/docs  src/snippets/code-samples/skills-approval-js.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```ts
import { MemorySaver } from "@langchain/langgraph";
import { createDeepAgent } from "deepagents";

const agent = await createDeepAgent({
  model: "anthropic:claude-sonnet-4-6",
  skills: ["/skills/personal/"],
  permissions: [
    {
      operations: ["write"],
      paths: ["/skills/**"],
      mode: "interrupt",
    },
  ],
  checkpointer: new MemorySaver(), // Required to pause and resume
});
```
