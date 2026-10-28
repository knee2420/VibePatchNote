<!-- source: langchain-ai/docs  src/snippets/code-samples/tool-return-object-js.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```ts
import { tool } from "langchain";
import * as z from "zod";

const getWeatherData = tool(
  ({ city }) => ({
    city,
    temperature_c: 22,
    conditions: "sunny",
  }),
  {
    name: "get_weather_data",
    description: "Get structured weather data for a city.",
    schema: z.object({ city: z.string() }),
  },
);
```
