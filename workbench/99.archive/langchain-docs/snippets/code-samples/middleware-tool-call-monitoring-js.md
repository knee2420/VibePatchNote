<!-- source: langchain-ai/docs  src/snippets/code-samples/middleware-tool-call-monitoring-js.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```ts
import { createMiddleware } from "langchain";

const toolMonitoringMiddleware = createMiddleware({
  name: "ToolMonitoringMiddleware",
  wrapToolCall: (request, handler) => {
    console.log(`Executing tool: ${request.toolCall.name}`);
    console.log(`Arguments: ${JSON.stringify(request.toolCall.args)}`);
    try {
      const result = handler(request);
      console.log("Tool completed successfully");
      return result;
    } catch (e) {
      console.log(`Tool failed: ${e}`);
      throw e;
    }
  },
});
```
