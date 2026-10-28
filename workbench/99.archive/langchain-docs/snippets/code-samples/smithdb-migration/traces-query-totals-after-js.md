<!-- source: langchain-ai/docs  src/snippets/code-samples/smithdb-migration/traces-query-totals-after-js.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```ts After
import { Client } from "langsmith";

const client = new Client();
const project = await client.readProject({ projectName: "default" });
let count = 0;
for await (const trace of client.traces.query({
  project_id: project.id,
  min_start_time: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  max_start_time: new Date().toISOString(),
  selects: ["NAME", "TOTAL_TOKENS", "TOTAL_COST"],
})) {
  count += 1;
  if (trace.trace_aggregates) {
    console.log(trace.root_run?.name, trace.trace_aggregates.total_tokens, trace.trace_aggregates.total_cost);
  }
  if (count >= 5) break;
}
```
