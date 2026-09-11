<!-- source: langchain-ai/docs  src/snippets/code-samples/smithdb-migration/runs-query-selecting-fields-after-js.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```ts After
import { Client } from "langsmith";

const client = new Client();
const project = await client.readProject({ projectName: "default" });
// must explicitly list every field needed; default returns only id
for await (const run of client.runs.query({
  project_ids: [project.id],
  selects: ["ID", "NAME", "RUN_TYPE", "STATUS", "START_TIME", "INPUTS", "ERROR"],
})) {
  console.log(run.id, run.name, run.run_type, run.status, run.start_time, run.inputs, run.error);
}
```
