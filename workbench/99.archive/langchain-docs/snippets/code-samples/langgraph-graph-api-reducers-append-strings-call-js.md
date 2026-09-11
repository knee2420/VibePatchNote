<!-- source: langchain-ai/docs  src/snippets/code-samples/langgraph-graph-api-reducers-append-strings-call-js.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```ts
const reducer = (left: string[], right: string[]) => left.concat(right);

reducer(["draft"], ["review"]); // left, right → ["draft", "review"]
```
