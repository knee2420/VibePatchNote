<!-- source: langchain-ai/docs  src/snippets/code-samples/smithdb-migration/runs-retrieve-child-runs-before-js.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```ts Before
import { Client } from "langsmith";

const client = new Client();
let runId = "<run-id>";

const run = await client.readRun(runId, { loadChildRuns: true });

// `child_runs` holds the direct children, each with its own nested `child_runs`.
// `child_run_ids` holds every descendant, at any depth.
for (const child of run.child_runs ?? []) {
  console.log(child.name, child.run_type, (child.child_runs ?? []).length);
}
console.log((run.child_run_ids ?? []).length, "descendants");
```
