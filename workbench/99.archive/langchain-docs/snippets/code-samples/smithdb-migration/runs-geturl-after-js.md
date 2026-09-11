<!-- source: langchain-ai/docs  src/snippets/code-samples/smithdb-migration/runs-geturl-after-js.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```ts After
import { Client } from "langsmith";

const client = new Client();
let runId = "<run-id>";
const run = await client.readRun(runId);
const response = await client.runs.getURL(run.id, {
  project_id: run.session_id!,
  trace_id: run.trace_id!,
  start_time: String(run.start_time!), // Optional, but speeds up retrieval
});
console.log(response.url);
```
