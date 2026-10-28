<!-- source: langchain-ai/docs  src/snippets/code-samples/skills-subagents-py.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```python
from deepagents import create_deep_agent

# Each path is a container with one subdirectory per skill:
# /skills/main/
# └── overview/SKILL.md
# /skills/researcher/
# ├── research/SKILL.md
# └── web-search/SKILL.md
research_subagent = {
    "name": "researcher",
    "description": "Research assistant with specialized skills",
    "system_prompt": "You are a researcher.",
    "tools": [web_search],
    "skills": ["/skills/researcher/"],  # Subagent-specific skills
}

agent = create_deep_agent(
    model="google_genai:gemini-3.6-flash",
    skills=["/skills/main/"],  # Main agent and GP subagent get these
    subagents=[research_subagent],  # Researcher gets only its own skills
)
```
