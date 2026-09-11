<!-- source: langchain-ai/docs  src/snippets/code-samples/smithdb-migration/runs-query-scoped-filters-before-js.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```ts Before
import { Client } from "langsmith";

const client = new Client();
const runs = client.listRuns({
  projectName: "default",
  filter: 'eq(name, "RetrieveDocs")',
  traceFilter: 'and(eq(feedback_key, "user_score"), eq(feedback_score, 1))',
  treeFilter: 'eq(name, "ExpandQuery")',
});
```
