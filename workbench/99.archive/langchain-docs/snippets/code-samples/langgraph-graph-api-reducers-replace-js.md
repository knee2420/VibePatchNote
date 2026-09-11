<!-- source: langchain-ai/docs  src/snippets/code-samples/langgraph-graph-api-reducers-replace-js.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```ts
import { ReducedValue, StateSchema } from "@langchain/langgraph";
import { z } from "zod/v4";

const State = new StateSchema({
  errors: new ReducedValue(
    z.array(z.string()).default(() => []),
    { reducer: (_state: string[], update: string[]) => update }
  ),
});

// node can now clear the field with { errors: [] }
```

<Card title="View example trace" icon="chart-line" href="https://smith.langchain.com/public/f08045e6-6826-46ab-8437-73b120f5f615/r" arrow horizontal>
  Open a public LangSmith run for this example.
</Card>
