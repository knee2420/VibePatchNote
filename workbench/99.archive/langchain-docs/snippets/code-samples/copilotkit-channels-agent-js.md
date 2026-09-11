<!-- source: langchain-ai/docs  src/snippets/code-samples/copilotkit-channels-agent-js.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```ts icon="robot" title="agent.ts"
import { LangGraphAgent } from "@copilotkit/runtime/langgraph";

// A fresh agent per conversation, keyed by thread.
export function makeAgent(threadId: string) {
  const agent = new LangGraphAgent({
    deploymentUrl: process.env.LANGGRAPH_DEPLOYMENT_URL!,
    graphId: "copilotkit_shadify", // the graph you deployed above
  });
  agent.threadId = threadId;
  return agent;
}
```
