<!-- source: langchain-ai/docs  src/snippets/code-samples/langgraph-graph-api-reducers-append-strings-js.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```ts
import { ReducedValue, StateSchema } from "@langchain/langgraph";
import * as z from "zod";

const State = new StateSchema({
  tags: new ReducedValue(
    z.array(z.string()).default(() => []),
    {
      reducer: (left: string[], right: string[]) => {
        // left: existing state; right: update from a node
        return left.concat(right);
      },
    }
  ),
});
```

<Card title="View example trace" icon="chart-line" href="https://smith.langchain.com/public/93ae7eff-5da7-48ae-893a-2e85e87ecd2c/r" arrow horizontal>
  Open a public LangSmith run for this example.
</Card>
