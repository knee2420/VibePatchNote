<!-- source: langchain-ai/docs  src/snippets/code-samples/langgraph-interrupts-validate-conditional-edge-pattern-js.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```ts
import { interrupt } from "@langchain/langgraph";

const getAgeNode: typeof State.Node = (state) => {
  const question = state.pendingQuestion ?? "What is your age?";
  const answer = interrupt(question); // called exactly once per invocation

  if (typeof answer === "number" && answer > 0) {
    return { age: answer, pendingQuestion: null };
  }
  return {
    pendingQuestion: `'${answer}' is not a valid age. Please enter a positive number.`,
  };
};

// builder.addConditionalEdges("collectAge", (state) =>
//   state.age !== null ? END : "collectAge"
// );
```

<Card title="View example trace" icon="chart-line" href="https://smith.langchain.com/public/04c9112c-edbf-497d-92b8-7263fb485ff5/r" arrow horizontal>
  Open a public LangSmith run for this example.
</Card>
