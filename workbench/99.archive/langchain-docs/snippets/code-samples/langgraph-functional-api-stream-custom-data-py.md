<!-- source: langchain-ai/docs  src/snippets/code-samples/langgraph-functional-api-stream-custom-data-py.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```python
config = {"configurable": {"thread_id": str(uuid7())}}

stream = main.stream_events({"x": 5}, config=config, version="v3")
for mode, chunk in stream.interleave("values"):
    print(f"{mode}: {chunk}")
# values: 10
```

<Card title="View example trace" icon="chart-line" href="https://smith.langchain.com/public/1b3e500b-749a-4587-9906-5a92c0471ffe/r" arrow horizontal>
  Open a public LangSmith run for this example.
</Card>
