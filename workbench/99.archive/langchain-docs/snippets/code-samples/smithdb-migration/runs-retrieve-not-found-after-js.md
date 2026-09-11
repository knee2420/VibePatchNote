<!-- source: langchain-ai/docs  src/snippets/code-samples/smithdb-migration/runs-retrieve-not-found-after-js.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```ts After
import { Client, NotFoundError } from "langsmith";

const client = new Client();
const project = await client.readProject({ projectName: "default" });
let runId = "<run-id>";
const startTime = "2026-06-01T12:00:00Z";

try {
  await client.runs.retrieve(runId, {
    project_id: project.id,
    start_time: startTime,
  });
} catch (e) {
  if (e instanceof NotFoundError) {
    console.log(`Run ${runId} not found`);
  }
}
```
