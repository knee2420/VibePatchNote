<!-- source: langchain-ai/docs  src/snippets/code-samples/event-streaming-interleave-py.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```python
stream = agent.stream_events(input, version="v3")

for name, item in stream.interleave("messages", "subagents"):
    if name == "messages":
        print("[coordinator]", item.text)
    else:
        for message in item.messages:
            print(f"[{item.name}]", message.text)
```

<Card title="View example trace" icon="chart-line" href="https://smith.langchain.com/public/22b2e253-4b17-4633-9eb0-c036cb548ce1/r" arrow horizontal>
  Open a public LangSmith run for this example.
</Card>
