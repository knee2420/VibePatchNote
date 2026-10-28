<!-- source: langchain-ai/docs  src/oss/javascript/integrations/providers/openrouter.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

---
title: "OpenRouter integrations"
sidebarTitle: "Overview"
description: "Access models from multiple providers through OpenRouter's unified API using LangChain JavaScript."
---

[OpenRouter](https://openrouter.ai/) is a unified API that provides access to models from multiple providers (OpenAI, Anthropic, Google, Meta, and more) through a single endpoint, with features like provider routing and multi-model fallback.

## Installation

```bash
npm install @langchain/openrouter @langchain/core
```

Set `OPENROUTER_API_KEY` in your environment. See the [ChatOpenRouter](/oss/integrations/chat/openrouter) page for setup details.

## Chat models

<Columns cols={2}>
    <Card title="ChatOpenRouter" href="/oss/integrations/chat/openrouter" cta="Get started" icon="message" arrow>
        Access chat models from multiple providers through the OpenRouter unified API.
    </Card>
</Columns>
