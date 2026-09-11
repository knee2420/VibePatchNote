<!-- source: langchain-ai/docs  src/snippets/code-samples/smithdb-migration/runs-query-boolean-filters-before-js.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```ts Before
import { Client } from "langsmith";

const client = new Client();
const filterStr =
  'and(gt(start_time, "2023-07-15T12:34:56Z"),' +
  ' or(neq(status, "error"),' +
  '    and(eq(feedback_key, "Correctness"), eq(feedback_score, 0.0))))';
const runs = client.listRuns({ projectName: "default", filter: filterStr });
```
