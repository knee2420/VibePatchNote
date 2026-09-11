<!-- source: langchain-ai/docs  src/snippets/code-samples/smithdb-migration/runs-add-to-queue-after-js.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```ts After
import { Client } from "langsmith";

const client = new Client();
let queueId = "<queue-id>";
const runs = [];
for await (const run of client.listRuns({ projectName: "default", limit: 5 })) {
  runs.push(run);
}
await client.addRunsToAnnotationQueue(
  queueId,
  runs.map((run) => ({
    runId: run.id,
    sessionId: run.session_id!,
    startTime: run.start_time!,
  })),
);
```
