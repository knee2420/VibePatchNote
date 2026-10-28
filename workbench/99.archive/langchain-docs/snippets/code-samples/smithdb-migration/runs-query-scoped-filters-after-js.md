<!-- source: langchain-ai/docs  src/snippets/code-samples/smithdb-migration/runs-query-scoped-filters-after-js.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```ts After
import { Client } from "langsmith";

const client = new Client();
const project = await client.readProject({ projectName: "default" });
const runs = client.runs.query({
  project_ids: [project.id],
  filter: 'eq(name, "RetrieveDocs")',
  trace_filter: 'and(eq(feedback_key, "user_score"), eq(feedback_score, 1))',
  tree_filter: 'eq(name, "ExpandQuery")',
});
```
