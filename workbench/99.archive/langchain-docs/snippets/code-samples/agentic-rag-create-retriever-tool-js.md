<!-- source: langchain-ai/docs  src/snippets/code-samples/agentic-rag-create-retriever-tool-js.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```ts
import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";
import { createRetrieverTool } from "@langchain/classic/tools/retriever";
import { OpenAIEmbeddings } from "@langchain/openai";

const vectorStore = await MemoryVectorStore.fromDocuments(
  docSplits,
  new OpenAIEmbeddings(),
);
const retriever = vectorStore.asRetriever();
const tool = createRetrieverTool(retriever, {
  name: "retrieve_blog_posts",
  description:
    "Search and return information about Lilian Weng blog posts on reward hacking, hallucination, and diffusion.",
});
const tools = [tool];
```
