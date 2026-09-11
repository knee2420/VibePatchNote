<!-- source: langchain-ai/docs  src/snippets/code-samples/rag-load-documents-js.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```ts
import * as cheerio from "cheerio";
import { Document } from "@langchain/core/documents";

// Below is a minimal helper for demonstration purposes.
async function loadWebPage(
  url: string,
  selector: string = ".post-title, .post-header, .post-content",
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

const docs = await loadWebPage(
  "https://lilianweng.github.io/posts/2023-06-23-agent/",
);

console.assert(docs.length === 1);
console.log(`Total characters: ${docs[0].pageContent.length}`);
```
