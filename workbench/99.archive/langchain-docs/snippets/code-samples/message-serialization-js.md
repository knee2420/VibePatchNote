<!-- source: langchain-ai/docs  src/snippets/code-samples/message-serialization-js.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```ts
import { HumanMessage } from "@langchain/core/messages";
import { load } from "@langchain/core/load";

const message = new HumanMessage("What is the capital of France?");

// Serialize to a plain object
const serialized = message.toJSON();

// Deserialize back to a message object
const restored = await load<HumanMessage>(JSON.stringify(serialized));
```
