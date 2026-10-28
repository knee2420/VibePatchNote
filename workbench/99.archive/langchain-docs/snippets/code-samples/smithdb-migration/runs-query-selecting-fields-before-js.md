<!-- source: langchain-ai/docs  src/snippets/code-samples/smithdb-migration/runs-query-selecting-fields-before-js.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```ts Before
import { Client } from "langsmith";

const client = new Client();
// returns a default set of fields; no explicit selection needed
const runs = client.listRuns({ projectName: "default" });
for await (const run of runs) {
  console.log(run.id, run.name, run.run_type, run.status, run.start_time, run.inputs, run.error);
}
```
