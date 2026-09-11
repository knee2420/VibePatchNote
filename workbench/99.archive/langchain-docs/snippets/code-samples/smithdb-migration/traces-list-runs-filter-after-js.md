<!-- source: langchain-ai/docs  src/snippets/code-samples/smithdb-migration/traces-list-runs-filter-after-js.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```ts After
import { Client } from "langsmith";

const client = new Client();
const project = await client.readProject({ projectName: "default" });
let traceId = "<trace-id>";
const response = await client.traces.listRuns(traceId, {
  project_id: project.id,
  filter: 'eq(run_type, "llm")',
  selects: ["NAME", "STATUS"],
});
const llmRuns = response.items ?? [];
```
