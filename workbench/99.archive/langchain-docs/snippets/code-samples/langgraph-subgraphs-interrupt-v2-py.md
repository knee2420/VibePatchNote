<!-- source: langchain-ai/docs  src/snippets/code-samples/langgraph-subgraphs-interrupt-v2-py.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```python
from langgraph.types import Command

config = {"configurable": {"thread_id": "1"}}

# Stream events - the subagent's tool calls interrupt()
stream = agent.stream_events(
    {"messages": [{"role": "user", "content": "Tell me about apples"}]},
    config=config,
    version="v3",
)
output = stream.output  # drive the stream to completion
# stream.interrupts contains pending interrupts (and stream.interrupted is True)

# Resume - approve the interrupt
resumed = agent.stream_events(Command(resume=True), config=config, version="v3")
final = resumed.output
```

<Card title="View example trace" icon="chart-line" href="https://smith.langchain.com/public/b9877a82-7701-4a9b-9430-bf5cb8740be0/r" arrow horizontal>
  Open a public LangSmith run for this example.
</Card>
