<!-- source: langchain-ai/docs  src/oss/javascript/integrations/embeddings/nomic.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

---
title: Nomic integration
description: Integrate with the Nomic embedding model using LangChain JavaScript.
integration:
  name: Nomic
  npm: '@langchain/nomic'
---

The `NomicEmbeddings` class uses the Nomic AI API to generate embeddings for a given text.

## Setup

In order to use the Nomic API you'll need to [sign up for a Nomic account and create an API key](https://atlas.nomic.ai/).

You'll first need to install the [`@langchain/nomic`](https://www.npmjs.com/package/@langchain/nomic) package:

<Tip>
See [this section for general instructions on installing LangChain packages](/oss/langchain/install).
</Tip>

```bash npm
npm install @langchain/nomic @langchain/core
```

## Usage

```typescript
import { NomicEmbeddings } from "@langchain/nomic";

/* Embed queries */
const nomicEmbeddings = new NomicEmbeddings();
const res = await nomicEmbeddings.embedQuery("Hello world");
console.log(res);
/* Embed documents */
const documentRes = await nomicEmbeddings.embedDocuments([
  "Hello world",
  "Bye bye",
]);
console.log(documentRes);
```

## Related

- Embedding model [conceptual guide](/oss/integrations/embeddings)
- Embedding model [how-to guides](/oss/integrations/embeddings)
