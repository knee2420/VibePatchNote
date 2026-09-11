<!-- source: langchain-ai/docs  src/oss/python/integrations/providers/graph_rag.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

---
title: "Graph RAG integrations"
description: "Integrate with Graph RAG using LangChain Python."
---

## Overview

[Graph RAG](https://datastax.github.io/graph-rag/) provides a retriever interface
that combines **unstructured** similarity search on vectors with **structured**
traversal of metadata properties. This enables graph-based retrieval over **existing**
vector stores.

## Installation and setup

<CodeGroup>
```bash pip
pip install langchain-graph-retriever
```

```bash uv
uv add langchain-graph-retriever
```
</CodeGroup>

## Retrievers

```python
from langchain_graph_retriever import GraphRetriever
```

For more information, see the [Graph RAG Integration Guide](/oss/integrations/retrievers/graph_rag).
