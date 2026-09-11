<!-- source: langchain-ai/docs  src/snippets/code-samples/skills-dynamic-lists-js.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```ts
import { createDeepAgent } from "deepagents";

const SKILLS_BY_ROLE: Record<string, string[]> = {
  engineering: [
    "/skills/code-review/",
    "/skills/testing/",
    "/skills/deployment/",
  ],
  data: [
    "/skills/sql-analysis/",
    "/skills/visualization/",
    "/skills/data-pipeline/",
  ],
  support: ["/skills/ticket-triage/", "/skills/runbook/"],
};

function createAgentForUser(userRole: string) {
  return createDeepAgent({
    model: "anthropic:claude-sonnet-4-6",
    skills: SKILLS_BY_ROLE[userRole] ?? [],
  });
}
```
