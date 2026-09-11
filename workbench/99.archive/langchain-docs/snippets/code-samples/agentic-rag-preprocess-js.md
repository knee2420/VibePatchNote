<!-- source: langchain-ai/docs  src/snippets/code-samples/agentic-rag-preprocess-js.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```ts
import * as cheerio from "cheerio";
import { Document } from "@langchain/core/documents";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

async function loadWebPage(
  url: string,
  selector: string = "body",
): Promise<Document[]> {
  const response = await fetch(url);
  const html = await response.text();
  const $ = cheerio.load(html);
  return [
    new Document({
      pageContent: $(selector).text(),
      metadata: { source: url },
    }),
  ];
}

const urls = [
  "https://lilianweng.github.io/posts/2024-11-28-reward-hacking/",
  "https://lilianweng.github.io/posts/2024-07-07-hallucination/",
  "https://lilianweng.github.io/posts/2024-04-12-diffusion-video/",
];

const docs = await Promise.all(urls.map((url) => loadWebPage(url)));
```
