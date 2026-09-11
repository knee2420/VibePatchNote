<!-- source: langchain-ai/docs  src/snippets/code-samples/smithdb-migration/runs-query-filter-time-range-after-js.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```ts After
import { Client } from "langsmith";

const client = new Client();
const project = await client.readProject({ projectName: "default" });
const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
const runs = client.runs.query({
  project_ids: [project.id],
  min_start_time: oneDayAgo.toISOString(),
  run_type: "LLM",
});
```
