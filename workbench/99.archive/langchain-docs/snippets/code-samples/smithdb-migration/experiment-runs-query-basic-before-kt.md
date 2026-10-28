<!-- source: langchain-ai/docs  src/snippets/code-samples/smithdb-migration/experiment-runs-query-basic-before-kt.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```kotlin Before
import com.langchain.smith.client.LangsmithClient
import com.langchain.smith.client.okhttp.LangsmithOkHttpClient
import com.langchain.smith.models.datasets.runs.RunQueryParams

val client: LangsmithClient = LangsmithOkHttpClient.fromEnv()
val examplesWithRuns = client.datasets().runs().query(
    datasetId,
    RunQueryParams.builder()
        .addSessionId(experimentId)
        .limit(20L)
        .preview(true)
        .build()
)
```
