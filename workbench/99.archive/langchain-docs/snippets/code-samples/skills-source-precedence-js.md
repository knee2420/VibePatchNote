<!-- source: langchain-ai/docs  src/snippets/code-samples/skills-source-precedence-js.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```ts
// If both sources contain a skill named "web-search",
// the one from "/skills/project/" wins (loaded last).
import { createDeepAgent } from "deepagents";

const agent = await createDeepAgent({
  skills: ["/skills/user/", "/skills/project/"],
});
```
