<!-- source: langchain-ai/docs  src/snippets/code-samples/langgraph-graph-api-reducers-custom-state-js.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```ts
import { ReducedValue, StateSchema } from "@langchain/langgraph";
import { z } from "zod/v4";

const State = new StateSchema({
  foo: z.number(),
  bar: new ReducedValue(
    z.array(z.string()).default(() => []),
    { reducer: (x, y) => x.concat(y) }
  ),
});
```

<Card title="View example trace" icon="chart-line" href="https://smith.langchain.com/public/65abf4d1-0932-4229-9d3f-c21e52d6008c/r" arrow horizontal>
  Open a public LangSmith run for this example.
</Card>
