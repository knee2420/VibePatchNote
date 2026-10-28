<!-- source: langchain-ai/docs  src/snippets/langsmith/pre-release-behavior.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

By default, LangSmith follows the `uv`/`pip` behavior of **not** installing prerelease versions unless explicitly allowed. If want to use prereleases, you have the following options:

- With `pyproject.toml`: add `allow-prereleases = true` to your `[tool.uv]` section.
- With `requirements.txt` or `setup.py`: you must explicitly specify every prerelease dependency, including transitive ones. For example, if you declare `a==0.0.1a1` and `a` depends on `b==0.0.1a1`, then you must also explicitly include `b==0.0.1a1` in your dependencies.
