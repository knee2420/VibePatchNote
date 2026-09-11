<!-- source: langchain-ai/docs  src/snippets/code-samples/permissions-composite-backend-js.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```ts
const sandbox = new StateBackend();
const memoriesBackend = new StateBackend();
const composite = new CompositeBackend(sandbox, {
  "/memories/": memoriesBackend,
});
const agent = createDeepAgent({
  model,
  backend: composite,
  permissions: [
    { operations: ["write"], paths: ["/memories/**"], mode: "deny" },
  ],
});
if (!agent) throw new Error("composite-backend: agent not created");
```
