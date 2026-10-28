<!-- source: langchain-ai/docs  src/snippets/code-samples/skills-namespaced-js.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```ts
import {
  createDeepAgent,
  CompositeBackend,
  StateBackend,
  StoreBackend,
} from "deepagents";

const agent = await createDeepAgent({
  model: "anthropic:claude-sonnet-4-6",
  skills: ["/skills/"],
  backend: new CompositeBackend(new StateBackend(), {
    "/skills/": new StoreBackend({
      namespace: (ctx) => [
        ctx.assistantId ?? "default",
        ctx.config?.configurable?.user_id ?? "anonymous",
      ],
    }),
  }),
});
```
