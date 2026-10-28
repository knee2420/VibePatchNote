<!-- source: langchain-ai/docs  src/snippets/code-samples/sql-agent-execute-sql-js.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```ts
import { tool } from "langchain";
import * as z from "zod";

const executeSql = tool(
  async ({ query }) => {
    const q = sanitizeSqlQuery(query);
    try {
      const result = await runQuery(q);
      return JSON.stringify(result, null, 2);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      throw new Error(message);
    }
  },
  {
    name: "execute_sql",
    description: "Execute a READ-ONLY SQLite SELECT query and return results.",
    schema: z.object({
      query: z.string().describe("SQLite SELECT query to execute (read-only)."),
    }),
  },
);
```
