<!-- source: langchain-ai/docs  src/snippets/code-samples/deep-research-run-sync-js.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```ts
{
  async function main() {
    const result = await agent.invoke({
      messages: [
        {
          role: "user",
          content:
            "What are the main differences between RAG and fine-tuning for LLM applications?",
        },
      ],
    });

    for (const msg of result.messages ?? []) {
      if (msg.content) {
        console.log(msg.content);
      }
    }
  }

  main().catch((err) => {
    console.error(err);
    process.exitCode = 1;
  });
}
```
