<!-- source: langchain-ai/docs  src/snippets/code-samples/rag-deep-index-js.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```ts
import "dotenv/config";

import { Document } from "@langchain/core/documents";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

const DOCS_BASE = "https://docs.langchain.com";

// Curated LangChain OSS pages for this tutorial. Expand this list or filter
// llms.txt URLs to index more of the site.
const DOC_PATHS = [
  "oss/javascript/langchain/agents",
  "oss/javascript/deepagents/rag",
  "oss/javascript/langchain/tools",
  "oss/javascript/langchain/models",
  "oss/javascript/deepagents/retrieval",
  "oss/javascript/langchain/knowledge-base",
  "oss/javascript/langchain/middleware",
  "oss/javascript/deepagents/overview",
  "oss/javascript/deepagents/subagents",
  "oss/javascript/deepagents/streaming",
  "oss/javascript/deepagents/frontend/subagent-streaming",
  "oss/javascript/deepagents/backends",
  "oss/javascript/langgraph/overview",
  "oss/javascript/langgraph/quickstart",
];
```
