<!-- source: langchain-ai/docs  src/snippets/code-samples/openai-prompt-cache-options-py.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```python
from langchain_openai import ChatOpenAI

llm = ChatOpenAI(
    model="gpt-5.6-sol",
    prompt_cache_options={"mode": "explicit", "ttl": "30m"},
)

messages = [{"role": "user", "content": "Hello"}]

# Override per request
response = llm.invoke(
    messages,
    prompt_cache_options={"mode": "implicit"},
)
```
