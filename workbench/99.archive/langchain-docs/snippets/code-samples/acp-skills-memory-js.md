<!-- source: langchain-ai/docs  src/snippets/code-samples/acp-skills-memory-js.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```ts
import { startServer } from "deepagents-acp";

await startServer({
  agents: {
    name: "project-agent",
    description: "Agent with project-specific knowledge",
    skills: ["./skills/", "~/.deepagents/skills/"],
    memory: ["./.deepagents/AGENTS.md"],
  },
  workspaceRoot: process.cwd(),
});
```
