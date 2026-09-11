<!-- source: langchain-ai/docs  src/snippets/code-samples/context-engineering-long-term-memory-py.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

<CodeGroup>
    ```python Google
    from deepagents import create_deep_agent
    from deepagents.backends import CompositeBackend, StateBackend, StoreBackend
    from langgraph.store.memory import InMemoryStore
    
    store = InMemoryStore()
    
    agent = create_deep_agent(
        model="google_genai:gemini-3.6-flash",
        store=store,
        backend=CompositeBackend(
            default=StateBackend(),
            routes={
                "/memories/": StoreBackend(namespace=lambda _rt: ("memories",)),
            },
        ),
        system_prompt="""When users tell you their preferences, save them to
        /memories/user_preferences.txt so you remember them in future conversations.""",
    )
    ```

    ```python OpenAI
    from deepagents import create_deep_agent
    from deepagents.backends import CompositeBackend, StateBackend, StoreBackend
    from langgraph.store.memory import InMemoryStore
    
    store = InMemoryStore()
    
    agent = create_deep_agent(
        model="openai:gpt-5.5",
        store=store,
        backend=CompositeBackend(
            default=StateBackend(),
            routes={
                "/memories/": StoreBackend(namespace=lambda _rt: ("memories",)),
            },
        ),
        system_prompt="""When users tell you their preferences, save them to
        /memories/user_preferences.txt so you remember them in future conversations.""",
    )
    ```

    ```python Anthropic
    from deepagents import create_deep_agent
    from deepagents.backends import CompositeBackend, StateBackend, StoreBackend
    from langgraph.store.memory import InMemoryStore
    
    store = InMemoryStore()
    
    agent = create_deep_agent(
        model="anthropic:claude-sonnet-4-6",
        store=store,
        backend=CompositeBackend(
            default=StateBackend(),
            routes={
                "/memories/": StoreBackend(namespace=lambda _rt: ("memories",)),
            },
        ),
        system_prompt="""When users tell you their preferences, save them to
        /memories/user_preferences.txt so you remember them in future conversations.""",
    )
    ```

    ```python OpenRouter
    from deepagents import create_deep_agent
    from deepagents.backends import CompositeBackend, StateBackend, StoreBackend
    from langgraph.store.memory import InMemoryStore
    
    store = InMemoryStore()
    
    agent = create_deep_agent(
        model="openrouter:z-ai/glm-5.2",
        store=store,
        backend=CompositeBackend(
            default=StateBackend(),
            routes={
                "/memories/": StoreBackend(namespace=lambda _rt: ("memories",)),
            },
        ),
        system_prompt="""When users tell you their preferences, save them to
        /memories/user_preferences.txt so you remember them in future conversations.""",
    )
    ```

    ```python Fireworks
    from deepagents import create_deep_agent
    from deepagents.backends import CompositeBackend, StateBackend, StoreBackend
    from langgraph.store.memory import InMemoryStore
    
    store = InMemoryStore()
    
    agent = create_deep_agent(
        model="fireworks:accounts/fireworks/models/glm-5p2",
        store=store,
        backend=CompositeBackend(
            default=StateBackend(),
            routes={
                "/memories/": StoreBackend(namespace=lambda _rt: ("memories",)),
            },
        ),
        system_prompt="""When users tell you their preferences, save them to
        /memories/user_preferences.txt so you remember them in future conversations.""",
    )
    ```

    ```python Baseten
    from deepagents import create_deep_agent
    from deepagents.backends import CompositeBackend, StateBackend, StoreBackend
    from langgraph.store.memory import InMemoryStore
    
    store = InMemoryStore()
    
    agent = create_deep_agent(
        model="baseten:zai-org/GLM-5.2",
        store=store,
        backend=CompositeBackend(
            default=StateBackend(),
            routes={
                "/memories/": StoreBackend(namespace=lambda _rt: ("memories",)),
            },
        ),
        system_prompt="""When users tell you their preferences, save them to
        /memories/user_preferences.txt so you remember them in future conversations.""",
    )
    ```

    ```python Ollama
    from deepagents import create_deep_agent
    from deepagents.backends import CompositeBackend, StateBackend, StoreBackend
    from langgraph.store.memory import InMemoryStore
    
    store = InMemoryStore()
    
    agent = create_deep_agent(
        model="ollama:north-mini-code-1.0",
        store=store,
        backend=CompositeBackend(
            default=StateBackend(),
            routes={
                "/memories/": StoreBackend(namespace=lambda _rt: ("memories",)),
            },
        ),
        system_prompt="""When users tell you their preferences, save them to
        /memories/user_preferences.txt so you remember them in future conversations.""",
    )
    ```
</CodeGroup>
