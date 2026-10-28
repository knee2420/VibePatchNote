<!-- source: langchain-ai/docs  src/snippets/code-samples/content-builder-create-agent-py.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

<CodeGroup>
    ```python Google
    from deepagents import create_deep_agent
    from deepagents.backends import FilesystemBackend
    
    
    def create_content_writer():
        """Create a content writer agent configured by filesystem files."""
        return create_deep_agent(
            model="google_genai:gemini-3.6-flash",
            memory=["./AGENTS.md"],
            skills=["./skills/"],
            tools=[generate_cover, generate_social_image],
            subagents=load_subagents(EXAMPLE_DIR / "subagents.yaml"),
            backend=FilesystemBackend(root_dir=EXAMPLE_DIR),
        )
    ```

    ```python OpenAI
    from deepagents import create_deep_agent
    from deepagents.backends import FilesystemBackend
    
    
    def create_content_writer():
        """Create a content writer agent configured by filesystem files."""
        return create_deep_agent(
            model="openai:gpt-5.5",
            memory=["./AGENTS.md"],
            skills=["./skills/"],
            tools=[generate_cover, generate_social_image],
            subagents=load_subagents(EXAMPLE_DIR / "subagents.yaml"),
            backend=FilesystemBackend(root_dir=EXAMPLE_DIR),
        )
    ```

    ```python Anthropic
    from deepagents import create_deep_agent
    from deepagents.backends import FilesystemBackend
    
    
    def create_content_writer():
        """Create a content writer agent configured by filesystem files."""
        return create_deep_agent(
            model="anthropic:claude-sonnet-4-6",
            memory=["./AGENTS.md"],
            skills=["./skills/"],
            tools=[generate_cover, generate_social_image],
            subagents=load_subagents(EXAMPLE_DIR / "subagents.yaml"),
            backend=FilesystemBackend(root_dir=EXAMPLE_DIR),
        )
    ```

    ```python OpenRouter
    from deepagents import create_deep_agent
    from deepagents.backends import FilesystemBackend
    
    
    def create_content_writer():
        """Create a content writer agent configured by filesystem files."""
        return create_deep_agent(
            model="openrouter:z-ai/glm-5.2",
            memory=["./AGENTS.md"],
            skills=["./skills/"],
            tools=[generate_cover, generate_social_image],
            subagents=load_subagents(EXAMPLE_DIR / "subagents.yaml"),
            backend=FilesystemBackend(root_dir=EXAMPLE_DIR),
        )
    ```

    ```python Fireworks
    from deepagents import create_deep_agent
    from deepagents.backends import FilesystemBackend
    
    
    def create_content_writer():
        """Create a content writer agent configured by filesystem files."""
        return create_deep_agent(
            model="fireworks:accounts/fireworks/models/glm-5p2",
            memory=["./AGENTS.md"],
            skills=["./skills/"],
            tools=[generate_cover, generate_social_image],
            subagents=load_subagents(EXAMPLE_DIR / "subagents.yaml"),
            backend=FilesystemBackend(root_dir=EXAMPLE_DIR),
        )
    ```

    ```python Baseten
    from deepagents import create_deep_agent
    from deepagents.backends import FilesystemBackend
    
    
    def create_content_writer():
        """Create a content writer agent configured by filesystem files."""
        return create_deep_agent(
            model="baseten:zai-org/GLM-5.2",
            memory=["./AGENTS.md"],
            skills=["./skills/"],
            tools=[generate_cover, generate_social_image],
            subagents=load_subagents(EXAMPLE_DIR / "subagents.yaml"),
            backend=FilesystemBackend(root_dir=EXAMPLE_DIR),
        )
    ```

    ```python Ollama
    from deepagents import create_deep_agent
    from deepagents.backends import FilesystemBackend
    
    
    def create_content_writer():
        """Create a content writer agent configured by filesystem files."""
        return create_deep_agent(
            model="ollama:north-mini-code-1.0",
            memory=["./AGENTS.md"],
            skills=["./skills/"],
            tools=[generate_cover, generate_social_image],
            subagents=load_subagents(EXAMPLE_DIR / "subagents.yaml"),
            backend=FilesystemBackend(root_dir=EXAMPLE_DIR),
        )
    ```
</CodeGroup>
