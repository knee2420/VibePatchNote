<!-- source: langchain-ai/docs  src/snippets/code-samples/event-streaming-subagents-py.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```python
stream = agent.stream_events(
    {
        "messages": [{"role": "user", "content": "Write me a haiku about the sea"}],
    },
    version="v3",
)

subagent_names: list[str] = []
for subagent in stream.subagents:
    print(subagent.name, subagent.path, subagent.status)

    for message in subagent.messages:
        print(message.text)

    subagent_names.append(subagent.name)
```

<Card title="View example trace" icon="chart-line" href="https://smith.langchain.com/public/3a85e9e6-9081-44ff-8291-2f7a7a478d6d/r" arrow horizontal>
  Open a public LangSmith run for this example.
</Card>
