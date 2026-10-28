<!-- source: langchain-ai/docs  src/snippets/code-samples/interpreters-task-fanout-eval-js.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```ts
const paths = ["src/auth.ts", "src/routes/api.ts"];

const reviews = await Promise.all(
  paths.map((path) =>
    task({
      description: `Review ${path} for authentication issues`,
      subagentType: "reviewer",
    }),
  ),
);

reviews.join("\n\n");
```
