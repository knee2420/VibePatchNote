<!-- source: langchain-ai/docs  src/snippets/code-samples/langgraph-graph-api-reducers-merge-does-not-clear-js.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```ts
import { ReducedValue, StateSchema } from "@langchain/langgraph";
import { z } from "zod/v4";

const State = new StateSchema({
  errors: new ReducedValue(
    z.array(z.string()).default(() => []),
    { reducer: (state: string[], update: string[]) => state.concat(update) },
  ),
});

// node A returns { errors: ["bad sql"] }
// node B returns { errors: [] }
// state.errors is still ["bad sql"]; the empty array is merged in, not cleared
```

<Card title="View example trace" icon="chart-line" href="https://smith.langchain.com/public/c65687b5-c6a9-4dca-9f6b-17ff20669c52/r" arrow horizontal>
  Open a public LangSmith run for this example.
</Card>
