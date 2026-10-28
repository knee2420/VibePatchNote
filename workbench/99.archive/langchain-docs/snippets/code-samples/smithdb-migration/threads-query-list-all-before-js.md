<!-- source: langchain-ai/docs  src/snippets/code-samples/smithdb-migration/threads-query-list-all-before-js.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```ts Before
import { Client } from "langsmith";

const client = new Client();
const threads = await client.listThreads({ projectName: "default" });
for (const thread of threads) {
  console.log(thread.thread_id, thread.count);
}
```
