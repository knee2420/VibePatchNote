<!-- source: langchain-ai/docs  src/snippets/code-samples/skills-create-agent-js.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```ts
import { createDeepAgent, FilesystemBackend } from "deepagents";

const backend = new FilesystemBackend({ rootDir: process.cwd() });

const agent = await createDeepAgent({
  model: "anthropic:claude-sonnet-4-6",
  backend,
  skills: ["/skills/"],
});
```
