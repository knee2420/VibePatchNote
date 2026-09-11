<!-- source: langchain-ai/docs  src/snippets/code-samples/api/frontend-sandbox-utils-js.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```ts
// src/api/utils.ts
import { Client } from "@langchain/langgraph-sdk";
import { LangSmithSandbox } from "deepagents";
import { SandboxClient } from "langsmith/sandbox";

export async function getOrCreateSandboxForThread(threadId: string) {
  const client = new Client({ apiUrl: "http://localhost:2024" });
  const thread = await client.threads.get(threadId);
  const sandboxId = thread.metadata?.sandbox_id;

  if (sandboxId) {
    const existing = await new SandboxClient().getSandbox(sandboxId);
    if (existing.status === "ready") {
      return new LangSmithSandbox({ sandbox: existing });
    }
  }

  const sandbox = await LangSmithSandbox.create({ templateName: "my-template" });
  await seedSandbox(sandbox);
  await client.threads.update(threadId, { metadata: { sandbox_id: sandbox.id } });
  return sandbox;
}
```
