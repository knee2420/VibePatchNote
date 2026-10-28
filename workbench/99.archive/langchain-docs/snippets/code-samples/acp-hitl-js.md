<!-- source: langchain-ai/docs  src/snippets/code-samples/acp-hitl-js.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```ts
import { DeepAgentsServer } from "deepagents-acp";

const server = new DeepAgentsServer({
  agents: {
    name: "careful-agent",
    interruptOn: {
      execute: { allowedDecisions: ["approve", "edit", "reject"] },
      write_file: true,
    },
  },
});
```
