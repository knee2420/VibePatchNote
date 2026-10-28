<!-- source: langchain-ai/docs  src/snippets/code-samples/acp-custom-tools-js.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```ts
import { DeepAgentsServer } from "deepagents-acp";
import { tool } from "@langchain/core/tools";
import { z } from "zod";

const searchTool = tool(
  async ({ query }) => {
    return `Results for: ${query}`;
  },
  {
    name: "search",
    description: "Search the codebase",
    schema: z.object({ query: z.string() }),
  },
);

const server = new DeepAgentsServer({
  agents: {
    name: "search-agent",
    tools: [searchTool],
  },
});


await server.start();
```
