<!-- source: langchain-ai/docs  src/snippets/code-samples/models-configure-params-provider-package-py.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```python Provider package
from langchain_google_genai import ChatGoogleGenerativeAI
from deepagents import create_deep_agent

model = ChatGoogleGenerativeAI(
    model="gemini-3.1-pro-preview",
    thinking_level="medium",  # [!code highlight]
)
agent = create_deep_agent(model=model)
```
