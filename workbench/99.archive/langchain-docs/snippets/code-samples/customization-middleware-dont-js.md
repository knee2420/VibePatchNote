<!-- source: langchain-ai/docs  src/snippets/code-samples/customization-middleware-dont-js.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```ts
let x = 1;

const customMiddlewareBad = createMiddleware({
  name: "CustomMiddleware",
  beforeAgent: async () => {
    x += 1; // Mutation causes race conditions
  },
});
```
