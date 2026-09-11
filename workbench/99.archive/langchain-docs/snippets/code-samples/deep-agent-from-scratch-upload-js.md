<!-- source: langchain-ai/docs  src/snippets/code-samples/deep-agent-from-scratch-upload-js.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```ts
const rows = [
  ["Date", "Product", "Units", "Revenue"],
  ["2025-08-01", "Widget A", "10", "250"],
  ["2025-08-02", "Widget B", "5", "125"],
  ["2025-08-03", "Widget A", "7", "175"],
  ["2025-08-04", "Widget C", "3", "90"],
];

const csv = rows.map((row) => row.join(",")).join("\n");
const encoder = new TextEncoder();
await backend.uploadFiles([["/sales.csv", encoder.encode(csv)]]);

const uploadStream = await agent.streamEvents(
  {
    messages: [
      {
        role: "user",
        content:
          "Read /sales.csv and summarize total revenue by product in one sentence. Do not run shell commands.",
      },
    ],
  },
  { version: "v3", recursionLimit: 8 },
);

await Promise.all([
  (async () => {
    for await (const message of uploadStream.messages) {
      console.log(await message.text);
    }
  })(),
  uploadStream.output,
]);
```
