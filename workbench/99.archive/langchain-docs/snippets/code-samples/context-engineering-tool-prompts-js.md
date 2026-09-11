<!-- source: langchain-ai/docs  src/snippets/code-samples/context-engineering-tool-prompts-js.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```ts
import { tool } from "langchain";
import * as z from "zod";

const searchOrders = tool(
  async ({ userId, status, limit }) =>
    `orders for ${userId} with status ${status} (limit ${limit})`,
  {
    name: "search_orders",
    description: `Search for user orders by status.

Use this when the user asks about order history or wants to check
order status. Always filter by the provided status.`,
    schema: z.object({
      userId: z.string().describe("Unique identifier for the user"),
      status: z
        .enum(["pending", "shipped", "delivered"])
        .describe("Order status to filter by"),
      limit: z
        .number()
        .default(10)
        .describe("Maximum number of results to return"),
    }),
  },
);
```
