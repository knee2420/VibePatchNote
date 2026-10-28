<!-- source: langchain-ai/docs  src/snippets/code-samples/smithdb-migration/traces-list-runs-filter-before-js.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```ts Before
import { Client } from "langsmith";

const client = new Client();
const project = await client.readProject({ projectName: "default" });
let traceId = "<trace-id>";
const llmRuns = [];
for await (const run of client.listRuns({
  projectId: project.id,
  traceId,
  filter: 'eq(run_type, "llm")',
})) {
  llmRuns.push(run);
}
```
