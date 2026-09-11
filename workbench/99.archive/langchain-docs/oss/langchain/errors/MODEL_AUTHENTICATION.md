<!-- source: langchain-ai/docs  src/oss/langchain/errors/MODEL_AUTHENTICATION.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

---
title: MODEL_AUTHENTICATION
---

<Note>
    Currently only used in `langchainjs` (JavaScript/TypeScript).
</Note>

Your model provider is denying you access to their service.

This error typically occurs when there's an issue with your authentication credentials or API keys.

## Troubleshooting

* Confirm that your API key or authentication credentials are accurate and valid.
* If using environment-based authentication, verify:
    - The variable name is spelled correctly
    - The variable contains an assigned value
    - Third-party packages like `dotenv` haven't interfered with loading
* If using a proxy or non-standard endpoint, make sure that your custom provider does not expect an alternative authentication scheme.
* Bypass environment variable issues by passing credentials explicitly:

:::python
```python
from langchain_openai import ChatOpenAI

model = ChatOpenAI(api_key="YOUR_KEY_HERE")
```
:::
:::js
```typescript
import { ChatOpenAI } from "@langchain/openai";

const model = new ChatOpenAI({
  apiKey: "YOUR_KEY_HERE",
});
```
:::


