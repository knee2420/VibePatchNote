<!-- source: langchain-ai/docs  src/snippets/code-samples/openai-prompt-cache-write-tokens-py.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```python
response = llm.invoke(messages)

cache_read = response.usage_metadata["input_token_details"].get("cache_read")
cache_creation = response.usage_metadata["input_token_details"].get("cache_creation")
print(f"Cache read tokens:     {cache_read}")
print(f"Cache creation tokens: {cache_creation}")
```
