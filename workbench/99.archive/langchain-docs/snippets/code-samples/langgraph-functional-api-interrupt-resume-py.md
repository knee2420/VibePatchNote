<!-- source: langchain-ai/docs  src/snippets/code-samples/langgraph-functional-api-interrupt-resume-py.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```python
# Get review from a user (e.g., via a UI)
# In this case, we're using a bool, but this can be any json-serializable value.
human_review = True

resumed_stream = workflow.stream_events(Command(resume=human_review), config, version="v3")
print(resumed_stream.output)
# {'essay': 'An essay about topic: cat', 'is_approved': True}
```
