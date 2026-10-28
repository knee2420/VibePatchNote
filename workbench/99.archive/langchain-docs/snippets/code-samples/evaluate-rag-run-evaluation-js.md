<!-- source: langchain-ai/docs  src/snippets/code-samples/evaluate-rag-run-evaluation-js.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```ts TypeScript
import { evaluate } from "langsmith/evaluation";

const targetFunc = (inputs: Record<string, unknown>) => {
  return ragBot(String(inputs.question));
};

const experimentResults = await evaluate(targetFunc, {
  data: datasetName,
  evaluators: [correctness, groundedness, relevance, retrievalRelevance],
  experimentPrefix: "rag-doc-relevance",
  metadata: { version: "LCEL context, gpt-4-0125-preview" },
});
```
