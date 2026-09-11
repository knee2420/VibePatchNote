<!-- source: langchain-ai/docs  src/oss/javascript/integrations/embeddings/minimax.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

---
title: Minimax integration
description: Integrate with the Minimax embedding model using LangChain JavaScript.
integration:
  name: Minimax
---



The `MinimaxEmbeddings` class uses the Minimax API to generate embeddings for a given text.

# Setup

To use Minimax model, you'll need a Minimax account, an API key, and a Group ID.

# Usage

```typescript
import { MinimaxEmbeddings } from "@langchain/classic/embeddings/minimax";

export const run = async () => {
  /* Embed queries */
  const embeddings = new MinimaxEmbeddings();
  const res = await embeddings.embedQuery("Hello world");
  console.log(res);
  /* Embed documents */
  const documentRes = await embeddings.embedDocuments([
    "Hello world",
    "Bye bye",
  ]);
  console.log({ documentRes });
};
```

## Related

- Embedding model [conceptual guide](/oss/integrations/embeddings)
- Embedding model [how-to guides](/oss/integrations/embeddings)
