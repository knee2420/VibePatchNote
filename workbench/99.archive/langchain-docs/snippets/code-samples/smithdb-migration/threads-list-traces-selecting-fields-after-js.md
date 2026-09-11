<!-- source: langchain-ai/docs  src/snippets/code-samples/smithdb-migration/threads-list-traces-selecting-fields-after-js.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```ts After
import { Client } from "langsmith";

const client = new Client();
const project = await client.readProject({ projectName: "default" });
let threadId = "<thread-id>";
for await (const trace of client.threads.listTraces(threadId, {
  project_id: project.id,
  selects: ["TRACE_ID", "TOTAL_TOKENS", "TOTAL_COST"],
})) {
  console.log(trace.trace_id, trace.total_tokens, trace.total_cost);
}
```
