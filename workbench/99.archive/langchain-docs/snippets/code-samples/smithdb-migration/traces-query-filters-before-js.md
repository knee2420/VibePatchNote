<!-- source: langchain-ai/docs  src/snippets/code-samples/smithdb-migration/traces-query-filters-before-js.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```ts Before
import { Client } from "langsmith";

const client = new Client();
const project = await client.readProject({ projectName: "default" });

// v1 has no root-run-only filter concept — isRoot plus a regular filter is
// the closest equivalent, still scanning every run to match.
for await (const run of client.listRuns({
  projectId: project.id,
  isRoot: true,
  filter: 'eq(status, "error")',
  limit: 5,
})) {
  console.log(run.trace_id);
}
```
