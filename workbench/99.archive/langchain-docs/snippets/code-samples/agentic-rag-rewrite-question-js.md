<!-- source: langchain-ai/docs  src/snippets/code-samples/agentic-rag-rewrite-question-js.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```ts
const rewritePrompt = ChatPromptTemplate.fromTemplate(
  `Look at the input and try to reason about the underlying semantic intent / meaning.
Here is the initial question:
\n ------- \n
{question}
\n ------- \n
Formulate an improved question:`,
);

const rewrite = async (state: typeof State.State) => {
  const question = state.messages.at(0)?.content;
  const response = await rewritePrompt.pipe(model).invoke({ question });
  return {
    messages: [response],
  };
};
```
