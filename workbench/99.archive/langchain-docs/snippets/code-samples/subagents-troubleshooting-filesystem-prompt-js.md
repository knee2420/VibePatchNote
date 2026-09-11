<!-- source: langchain-ai/docs  src/snippets/code-samples/subagents-troubleshooting-filesystem-prompt-js.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```ts
const filesystemPrompt = `When you gather large amounts of data:
1. Save raw data to /data/raw_results.txt
2. Process and analyze the data
3. Return only the analysis summary

This keeps context clean.`;
```
