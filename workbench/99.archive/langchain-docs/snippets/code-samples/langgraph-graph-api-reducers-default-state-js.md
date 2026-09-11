<!-- source: langchain-ai/docs  src/snippets/code-samples/langgraph-graph-api-reducers-default-state-js.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```ts
import { StateSchema } from "@langchain/langgraph";
import * as z from "zod";

const State = new StateSchema({
  foo: z.number(),
  bar: z.array(z.string()),
});
```

<Card title="View example trace" icon="chart-line" href="https://smith.langchain.com/public/b3536d55-6b2a-4b92-b956-be768be61b3d/r" arrow horizontal>
  Open a public LangSmith run for this example.
</Card>
