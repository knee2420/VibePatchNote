<!-- source: langchain-ai/docs  src/snippets/code-samples/ls-metadata-parameters-basic-java.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```java Java
import com.langchain.smith.tracing.RunType;
import com.langchain.smith.tracing.TraceConfig;
import com.langchain.smith.tracing.Tracing;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

Map<String, Object> metadata = new HashMap<>();
metadata.put("ls_provider", "my_provider");
metadata.put("ls_model_name", "my_custom_model");

Function<String, String> myCustomLlm =
    Tracing.traceFunction(
        prompt -> callCustomApi(prompt),
        TraceConfig.builder()
            .runType(RunType.LLM)
            .metadata(metadata)
            .build());
```
