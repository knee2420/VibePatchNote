<!-- source: langchain-ai/docs  src/snippets/code-samples/event-streaming-nested-py.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```python
stream = agent.stream_events(input, version="v3")

subagent_names: list[str] = []
for subagent in stream.subagents:
    print(f"subagent {subagent.name}: {subagent.status}")

    for tool_call in subagent.tool_calls:
        print(f"{tool_call.tool_name}({tool_call.input})")
        for delta in tool_call.output_deltas:
            print(delta, end="", flush=True)

    for nested in subagent.subagents:
        print(f"nested subagent {nested.name}: {nested.status}")

    subagent_names.append(subagent.name)
```

<Card title="View example trace" icon="chart-line" href="https://smith.langchain.com/public/85a499ed-bde5-4fa7-8154-25522617d724/r" arrow horizontal>
  Open a public LangSmith run for this example.
</Card>
