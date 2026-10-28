<!-- source: langchain-ai/docs  src/oss/javascript/integrations/llms/jigsawstack.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

---
title: Jigsawstack prompt engine integration
description: Integrate with the Jigsawstack prompt engine LLM using LangChain JavaScript.
integration:
  name: Jigsawstack prompt engine
  npm: '@langchain/jigsawstack'
---

LangChain.js supports calling JigsawStack [Prompt Engine](https://docs.jigsawstack.com/api-reference/prompt-engine/run-direct) LLMs.

## Setup

- Set up an [account](https://jigsawstack.com/dashboard) (Get started for free)
- Create and retrieve your [API key](https://jigsawstack.com/dashboard)

## Credentials

```bash
export JIGSAWSTACK_API_KEY="your-api-key"
```

## Usage

<Tip>
See [this section for general instructions on installing LangChain packages](/oss/langchain/install).
</Tip>

```bash npm
npm install @langchain/jigsawstack
```
```ts
import { JigsawStackPromptEngine } from "@langchain/jigsawstack";

export const run = async () => {
  const model = new JigsawStackPromptEngine();
  const res = await model.invoke(
    "Tell me about the leaning tower of pisa?\nAnswer:"
  );
  console.log({ res });
};
```

## Related


- [Models guide](/oss/langchain/models)
