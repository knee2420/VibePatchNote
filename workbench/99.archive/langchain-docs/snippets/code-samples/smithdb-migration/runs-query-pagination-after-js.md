<!-- source: langchain-ai/docs  src/snippets/code-samples/smithdb-migration/runs-query-pagination-after-js.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```ts After
import { Client } from "langsmith";

const client = new Client();
const project = await client.readProject({ projectName: "default" });
const runs: unknown[] = [];
for await (const run of client.runs.query({
  project_ids: [project.id],
})) {
  runs.push(run);
  if (runs.length >= 150) break;
}
```
