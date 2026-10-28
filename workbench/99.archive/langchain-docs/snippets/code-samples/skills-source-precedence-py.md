<!-- source: langchain-ai/docs  src/snippets/code-samples/skills-source-precedence-py.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```python
# If both sources contain a skill named "web-search",
# the one from "/skills/project/" wins (loaded last).
from deepagents import create_deep_agent

agent = create_deep_agent(
    model="google_genai:gemini-3.6-flash",
    skills=["/skills/user/", "/skills/project/"],
)
```
