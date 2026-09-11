<!-- source: langchain-ai/docs  src/snippets/code-samples/event-streaming-messages-py.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```python
stream = agent.stream_events(input, version="v3")

coordinator_messages: list[str] = []
for message in stream.messages:
    print("[coordinator]", message.text)
    coordinator_messages.append(message.text)

for subagent in stream.subagents:
    for message in subagent.messages:
        print(f"[{subagent.name}]", message.text)
```

<Card title="View example trace" icon="chart-line" href="https://smith.langchain.com/public/91503d73-11d1-4016-90f1-c1ac52e32f3b/r" arrow horizontal>
  Open a public LangSmith run for this example.
</Card>
