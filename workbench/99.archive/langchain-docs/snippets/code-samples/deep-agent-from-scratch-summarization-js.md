<!-- source: langchain-ai/docs  src/snippets/code-samples/deep-agent-from-scratch-summarization-js.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

<CodeGroup>
    ```ts Google
    import { createSummarizationMiddleware } from "deepagents";
    
    let model = "google-genai:gemini-3.6-flash";
    
    agent = createAgent({
      model,
      tools: [],
      middleware: [
        createFilesystemMiddleware({ backend }),
        createSummarizationMiddleware({
          model,
          backend,
        }),
      ],
    });
    ```

    ```ts OpenAI
    import { createSummarizationMiddleware } from "deepagents";
    
    let model = "openai:gpt-5.5";
    
    agent = createAgent({
      model,
      tools: [],
      middleware: [
        createFilesystemMiddleware({ backend }),
        createSummarizationMiddleware({
          model,
          backend,
        }),
      ],
    });
    ```

    ```ts Anthropic
    import { createSummarizationMiddleware } from "deepagents";
    
    let model = "anthropic:claude-sonnet-4-6";
    
    agent = createAgent({
      model,
      tools: [],
      middleware: [
        createFilesystemMiddleware({ backend }),
        createSummarizationMiddleware({
          model,
          backend,
        }),
      ],
    });
    ```

    ```ts OpenRouter
    import { createSummarizationMiddleware } from "deepagents";
    
    let model = "openrouter:openrouter:z-ai/glm-5.2";
    
    agent = createAgent({
      model,
      tools: [],
      middleware: [
        createFilesystemMiddleware({ backend }),
        createSummarizationMiddleware({
          model,
          backend,
        }),
      ],
    });
    ```

    ```ts Fireworks
    import { createSummarizationMiddleware } from "deepagents";
    
    let model = "fireworks:accounts/fireworks/models/glm-5p2";
    
    agent = createAgent({
      model,
      tools: [],
      middleware: [
        createFilesystemMiddleware({ backend }),
        createSummarizationMiddleware({
          model,
          backend,
        }),
      ],
    });
    ```

    ```ts Baseten
    import { createSummarizationMiddleware } from "deepagents";
    
    let model = "baseten:zai-org/GLM-5.2";
    
    agent = createAgent({
      model,
      tools: [],
      middleware: [
        createFilesystemMiddleware({ backend }),
        createSummarizationMiddleware({
          model,
          backend,
        }),
      ],
    });
    ```

    ```ts Ollama
    import { createSummarizationMiddleware } from "deepagents";
    
    let model = "ollama:north-mini-code-1.0";
    
    agent = createAgent({
      model,
      tools: [],
      middleware: [
        createFilesystemMiddleware({ backend }),
        createSummarizationMiddleware({
          model,
          backend,
        }),
      ],
    });
    ```
</CodeGroup>
