<!-- source: langchain-ai/docs  src/snippets/code-samples/acp-custom-backend-js.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```ts
import { DeepAgentsServer } from "deepagents-acp";
import { CompositeBackend, FilesystemBackend, StateBackend } from "deepagents";

const server = new DeepAgentsServer({
  agents: {
    name: "custom-agent",
    backend: new CompositeBackend(new StateBackend(), {
      "/workspace/": new FilesystemBackend({ rootDir: "./workspace" }),
    }),
  },
});
```
