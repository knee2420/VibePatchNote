<!-- source: langchain-ai/docs  src/snippets/code-samples/quickstart-search-tool-provider-py.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

<CodeGroup>
    ```python Google
    from deepagents import create_deep_agent

    # Google's built-in search — no extra install or API key needed
    internet_search = {"google_search": {}}
    ```

    ```python OpenAI
    from deepagents import create_deep_agent

    # OpenAI's built-in web search — no extra install or API key needed
    internet_search = {"type": "web_search"}
    ```

    ```python Anthropic
    from deepagents import create_deep_agent

    # Anthropic's built-in web search — no extra install or API key needed
    internet_search = {"type": "web_search_20260209", "name": "web_search"}
    ```
</CodeGroup>
