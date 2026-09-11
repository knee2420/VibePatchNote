<!-- source: langchain-ai/docs  src/snippets/code-samples/skills-personal-writable-js.mdx -->
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
  backend: new CompositeBackend(new StateBackend(), {
    "/skills/shared/": new StoreBackend({
      namespace: (rt) => ["curated-skills", rt.context.orgId],
    }),
    "/skills/personal/": new StoreBackend({
      namespace: (ctx) => [
        "user-skills",
        ctx.config?.configurable?.user_id ?? "anonymous",
      ],
    }),
  }),
  skills: ["/skills/shared/", "/skills/personal/"],
  permissions: [
    {
      operations: ["write"],
      paths: ["/skills/shared/**"],
      mode: "deny",
    },
  ],
});
```
