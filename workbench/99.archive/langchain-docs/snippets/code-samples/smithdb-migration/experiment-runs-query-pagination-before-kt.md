<!-- source: langchain-ai/docs  src/snippets/code-samples/smithdb-migration/experiment-runs-query-pagination-before-kt.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```kotlin Before
import com.langchain.smith.client.LangsmithClient
import com.langchain.smith.client.okhttp.LangsmithOkHttpClient
import com.langchain.smith.models.datasets.runs.RunQueryParams
import com.langchain.smith.models.datasets.runs.ExampleWithRunsCh

val client: LangsmithClient = LangsmithOkHttpClient.fromEnv()
val examplesWithRuns = mutableListOf<ExampleWithRunsCh>()
var offset = 0L
val limit = 20L
while (true) {
    val page = client.datasets().runs().query(
        datasetId,
        RunQueryParams.builder()
            .addSessionId(experimentId)
            .limit(limit)
            .offset(offset)
            .build()
    ).orElse(emptyList())
    examplesWithRuns.addAll(page)
    if (examplesWithRuns.size >= 100 || page.size.toLong() < limit) break
    offset += limit
}
```
