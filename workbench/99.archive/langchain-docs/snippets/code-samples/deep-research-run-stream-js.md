<!-- source: langchain-ai/docs  src/snippets/code-samples/deep-research-run-stream-js.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```ts
{
  async function main() {
    const stream = await agent.streamEvents(
      {
        messages: [
          {
            role: "user",
            content: "Compare Python vs JavaScript for web development",
          },
        ],
      },
      { version: "v3" },
    );
    for await (const message of stream.messages) {
      for await (const token of message.text) {
        process.stdout.write(token);
      }
    }
  }

  main().catch((err) => {
    console.error(err);
    process.exitCode = 1;
  });
}
```
