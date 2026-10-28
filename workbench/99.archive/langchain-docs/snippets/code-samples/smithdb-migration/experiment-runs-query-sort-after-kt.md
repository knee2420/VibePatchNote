<!-- source: langchain-ai/docs  src/snippets/code-samples/smithdb-migration/experiment-runs-query-sort-after-kt.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```kotlin After
import com.langchain.smith.client.LangsmithClient
import com.langchain.smith.client.okhttp.LangsmithOkHttpClient
import com.langchain.smith.models.datasets.experimentruns.ExperimentRunQueryParams

val client: LangsmithClient = LangsmithOkHttpClient.fromEnv()
val page = client.datasets().experimentRuns().query(
    datasetId,
    ExperimentRunQueryParams.builder()
        .addExperimentId(experimentId)
        .sort(
            ExperimentRunQueryParams.Sort.builder()
                .by("feedback.correctness")
                .order("ASC")
                .build()
        )
        .build()
)
```
