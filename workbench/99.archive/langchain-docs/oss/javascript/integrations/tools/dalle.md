<!-- source: langchain-ai/docs  src/oss/javascript/integrations/tools/dalle.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

---
title: Dall-e integration
description: Integrate with the Dall-e tool using LangChain JavaScript.
integration:
  name: Dall-e
  npm: '@langchain/openai'
---

```typescript
/* eslint-disable no-process-env */
import { DallEAPIWrapper } from "@langchain/openai";

const tool = new DallEAPIWrapper({
  n: 1, // Default
  model: "dall-e-3", // Default
  apiKey: process.env.OPENAI_API_KEY, // Default
});

const imageURL = await tool.invoke("a painting of a cat");

console.log(imageURL);
```

## Related

- Tool [conceptual guide](/oss/langchain/tools)
- Tool [how-to guides](/oss/langchain/tools)
