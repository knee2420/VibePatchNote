<!-- source: langchain-ai/docs  src/snippets/code-samples/smithdb-migration/runs-query-list-root-as-traces-before-js.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```ts Before
import { Client } from "langsmith";

const client = new Client();
const project = await client.readProject({ projectName: "default" });

for await (const run of client.listRuns({ projectId: project.id, isRoot: true, limit: 5 })) {
  console.log(run.trace_id, run.name);
}
```
