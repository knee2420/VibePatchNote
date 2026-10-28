<!-- source: langchain-ai/docs  src/snippets/code-samples/smithdb-migration/experiment-runs-query-pagination-after-js.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```ts After
import { Client } from "langsmith";

const client = new Client();
const experimentId = (await client.readProject({ projectName: experimentName })).id;
const runs: unknown[] = [];
for await (const run of client.datasets.experimentRuns.query(datasetId, {
  experiment_ids: [experimentId],
  page_size: 1,
})) {
  runs.push(run);
  if (runs.length >= 100) break;
}
```
