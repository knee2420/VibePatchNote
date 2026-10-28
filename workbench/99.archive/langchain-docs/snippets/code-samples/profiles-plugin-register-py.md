<!-- source: langchain-ai/docs  src/snippets/code-samples/profiles-plugin-register-py.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```python
from deepagents import (
    HarnessProfile,
    ProviderProfile,
    register_harness_profile,
    register_provider_profile,
)


def register_harness() -> None:
    register_harness_profile(
        "my_provider",
        HarnessProfile(system_prompt_suffix="Batch independent tool calls in parallel."),
    )


def register_provider() -> None:
    register_provider_profile(
        "my_provider",
        ProviderProfile(init_kwargs={"temperature": 0}),
    )
```
