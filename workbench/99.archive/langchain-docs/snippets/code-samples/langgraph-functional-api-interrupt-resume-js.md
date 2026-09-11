<!-- source: langchain-ai/docs  src/snippets/code-samples/langgraph-functional-api-interrupt-resume-js.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```ts
import { Command } from "@langchain/langgraph";

// Get review from a user (e.g., via a UI)
// In this case, we're using a bool, but this can be any json-serializable value.
const humanReview = true;

const resumedStream = await workflow.streamEvents(
  new Command({ resume: humanReview }),
  { ...config, version: "v2" },
);
const resumedChunks: Record<string, unknown>[] = [];
for await (const event of resumedStream) {
  const chunk = event.data?.chunk;
  if (chunk && typeof chunk === "object") {
    console.log(chunk);
    resumedChunks.push(chunk as Record<string, unknown>);
  }
}
// { essay: "An essay about topic: cat", isApproved: true }
```
