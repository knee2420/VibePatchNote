<!-- source: langchain-ai/docs  src/snippets/code-samples/long-term-memory-create-agent-postgres-js.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

<CodeGroup>
    ```ts Google
    import { createAgent } from "langchain";
    import { PostgresStore } from "@langchain/langgraph-checkpoint-postgres/store";
    
    const DB_URI =
      process.env.POSTGRES_URI ??
      "postgresql://postgres:postgres@localhost:5432/postgres?sslmode=disable";
    const store = PostgresStore.fromConnString(DB_URI);
    await store.setup();
    
    const agent = createAgent({
      model: "google-genai:gemini-3.6-flash",
      tools: [],
      store,
    });
    ```

    ```ts OpenAI
    import { createAgent } from "langchain";
    import { PostgresStore } from "@langchain/langgraph-checkpoint-postgres/store";
    
    const DB_URI =
      process.env.POSTGRES_URI ??
      "postgresql://postgres:postgres@localhost:5432/postgres?sslmode=disable";
    const store = PostgresStore.fromConnString(DB_URI);
    await store.setup();
    
    const agent = createAgent({
      model: "openai:gpt-5.5",
      tools: [],
      store,
    });
    ```

    ```ts Anthropic
    import { createAgent } from "langchain";
    import { PostgresStore } from "@langchain/langgraph-checkpoint-postgres/store";
    
    const DB_URI =
      process.env.POSTGRES_URI ??
      "postgresql://postgres:postgres@localhost:5432/postgres?sslmode=disable";
    const store = PostgresStore.fromConnString(DB_URI);
    await store.setup();
    
    const agent = createAgent({
      model: "anthropic:claude-sonnet-4-6",
      tools: [],
      store,
    });
    ```

    ```ts OpenRouter
    import { createAgent } from "langchain";
    import { PostgresStore } from "@langchain/langgraph-checkpoint-postgres/store";
    
    const DB_URI =
      process.env.POSTGRES_URI ??
      "postgresql://postgres:postgres@localhost:5432/postgres?sslmode=disable";
    const store = PostgresStore.fromConnString(DB_URI);
    await store.setup();
    
    const agent = createAgent({
      model: "openrouter:openrouter:z-ai/glm-5.2",
      tools: [],
      store,
    });
    ```

    ```ts Fireworks
    import { createAgent } from "langchain";
    import { PostgresStore } from "@langchain/langgraph-checkpoint-postgres/store";
    
    const DB_URI =
      process.env.POSTGRES_URI ??
      "postgresql://postgres:postgres@localhost:5432/postgres?sslmode=disable";
    const store = PostgresStore.fromConnString(DB_URI);
    await store.setup();
    
    const agent = createAgent({
      model: "fireworks:accounts/fireworks/models/glm-5p2",
      tools: [],
      store,
    });
    ```

    ```ts Baseten
    import { createAgent } from "langchain";
    import { PostgresStore } from "@langchain/langgraph-checkpoint-postgres/store";
    
    const DB_URI =
      process.env.POSTGRES_URI ??
      "postgresql://postgres:postgres@localhost:5432/postgres?sslmode=disable";
    const store = PostgresStore.fromConnString(DB_URI);
    await store.setup();
    
    const agent = createAgent({
      model: "baseten:zai-org/GLM-5.2",
      tools: [],
      store,
    });
    ```

    ```ts Ollama
    import { createAgent } from "langchain";
    import { PostgresStore } from "@langchain/langgraph-checkpoint-postgres/store";
    
    const DB_URI =
      process.env.POSTGRES_URI ??
      "postgresql://postgres:postgres@localhost:5432/postgres?sslmode=disable";
    const store = PostgresStore.fromConnString(DB_URI);
    await store.setup();
    
    const agent = createAgent({
      model: "ollama:north-mini-code-1.0",
      tools: [],
      store,
    });
    ```
</CodeGroup>
