<!-- source: langchain-ai/docs  src/snippets/code-samples/smithdb-migration/feedback-create-before-js.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```ts Before
import { Client } from "langsmith";

const client = new Client();
let runId = "<run-id>";
await client.createFeedback(runId, "user_feedback", {
  score: 1,
});
```
