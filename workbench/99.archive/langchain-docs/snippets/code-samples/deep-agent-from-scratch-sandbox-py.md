<!-- source: langchain-ai/docs  src/snippets/code-samples/deep-agent-from-scratch-sandbox-py.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

<CodeGroup>
    ```python Google
    from langchain.agents import create_agent
    from deepagents.backends.langsmith import LangSmithSandbox
    from deepagents.middleware import FilesystemMiddleware
    from langsmith.sandbox import SandboxClient
    
    client = SandboxClient()
    sandbox = client.create_sandbox(name="langchain-docs", snapshot_name="docs-test-ci")
    backend = LangSmithSandbox(sandbox=sandbox)
    
    agent = create_agent(
        model="google_genai:gemini-3.6-flash",
        tools=[],
        middleware=[FilesystemMiddleware(backend=backend)],
    )
    ```

    ```python OpenAI
    from langchain.agents import create_agent
    from deepagents.backends.langsmith import LangSmithSandbox
    from deepagents.middleware import FilesystemMiddleware
    from langsmith.sandbox import SandboxClient
    
    client = SandboxClient()
    sandbox = client.create_sandbox(name="langchain-docs", snapshot_name="docs-test-ci")
    backend = LangSmithSandbox(sandbox=sandbox)
    
    agent = create_agent(
        model="openai:gpt-5.5",
        tools=[],
        middleware=[FilesystemMiddleware(backend=backend)],
    )
    ```

    ```python Anthropic
    from langchain.agents import create_agent
    from deepagents.backends.langsmith import LangSmithSandbox
    from deepagents.middleware import FilesystemMiddleware
    from langsmith.sandbox import SandboxClient
    
    client = SandboxClient()
    sandbox = client.create_sandbox(name="langchain-docs", snapshot_name="docs-test-ci")
    backend = LangSmithSandbox(sandbox=sandbox)
    
    agent = create_agent(
        model="anthropic:claude-sonnet-4-6",
        tools=[],
        middleware=[FilesystemMiddleware(backend=backend)],
    )
    ```

    ```python OpenRouter
    from langchain.agents import create_agent
    from deepagents.backends.langsmith import LangSmithSandbox
    from deepagents.middleware import FilesystemMiddleware
    from langsmith.sandbox import SandboxClient
    
    client = SandboxClient()
    sandbox = client.create_sandbox(name="langchain-docs", snapshot_name="docs-test-ci")
    backend = LangSmithSandbox(sandbox=sandbox)
    
    agent = create_agent(
        model="openrouter:z-ai/glm-5.2",
        tools=[],
        middleware=[FilesystemMiddleware(backend=backend)],
    )
    ```

    ```python Fireworks
    from langchain.agents import create_agent
    from deepagents.backends.langsmith import LangSmithSandbox
    from deepagents.middleware import FilesystemMiddleware
    from langsmith.sandbox import SandboxClient
    
    client = SandboxClient()
    sandbox = client.create_sandbox(name="langchain-docs", snapshot_name="docs-test-ci")
    backend = LangSmithSandbox(sandbox=sandbox)
    
    agent = create_agent(
        model="fireworks:accounts/fireworks/models/glm-5p2",
        tools=[],
        middleware=[FilesystemMiddleware(backend=backend)],
    )
    ```

    ```python Baseten
    from langchain.agents import create_agent
    from deepagents.backends.langsmith import LangSmithSandbox
    from deepagents.middleware import FilesystemMiddleware
    from langsmith.sandbox import SandboxClient
    
    client = SandboxClient()
    sandbox = client.create_sandbox(name="langchain-docs", snapshot_name="docs-test-ci")
    backend = LangSmithSandbox(sandbox=sandbox)
    
    agent = create_agent(
        model="baseten:zai-org/GLM-5.2",
        tools=[],
        middleware=[FilesystemMiddleware(backend=backend)],
    )
    ```

    ```python Ollama
    from langchain.agents import create_agent
    from deepagents.backends.langsmith import LangSmithSandbox
    from deepagents.middleware import FilesystemMiddleware
    from langsmith.sandbox import SandboxClient
    
    client = SandboxClient()
    sandbox = client.create_sandbox(name="langchain-docs", snapshot_name="docs-test-ci")
    backend = LangSmithSandbox(sandbox=sandbox)
    
    agent = create_agent(
        model="ollama:north-mini-code-1.0",
        tools=[],
        middleware=[FilesystemMiddleware(backend=backend)],
    )
    ```
</CodeGroup>
