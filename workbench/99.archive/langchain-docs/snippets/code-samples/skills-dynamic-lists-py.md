<!-- source: langchain-ai/docs  src/snippets/code-samples/skills-dynamic-lists-py.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```python
from deepagents import create_deep_agent

# Each role path is a container with one subdirectory per skill:
# /skills/
# ├── engineering/
# │   ├── code-review/SKILL.md
# │   └── testing/SKILL.md
# ├── data/
# │   └── sql-analysis/SKILL.md
# └── support/
#     └── ticket-triage/SKILL.md
SKILLS_BY_ROLE = {
    "engineering": ["/skills/engineering/"],
    "data": ["/skills/data/"],
    "support": ["/skills/support/"],
}


def create_agent_for_user(user_role: str):
    return create_deep_agent(
        model="anthropic:claude-sonnet-4-6",
        skills=SKILLS_BY_ROLE.get(user_role, []),
    )
```
