<!-- source: langchain-ai/docs  src/snippets/code-samples/smithdb-migration/runs-retrieve-basic-after-js.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```ts After
import { Client } from "langsmith";

const client = new Client();
let runId = "<run-id>";
let startTime = "2026-06-01T12:00:00Z";
let projectId = "<project-id>";
const retrievedRun = await client.runs.retrieve(runId, {
  project_id: projectId,
  start_time: startTime,
  selects: ["NAME", "STATUS", "TOTAL_TOKENS"],
});
console.log(retrievedRun.name, retrievedRun.status, retrievedRun.total_tokens);
```
