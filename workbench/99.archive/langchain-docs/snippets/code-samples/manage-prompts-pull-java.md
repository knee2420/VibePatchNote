<!-- source: langchain-ai/docs  src/snippets/code-samples/manage-prompts-pull-java.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```java Java
import com.langchain.smith.client.LangsmithClient;
import com.langchain.smith.client.okhttp.LangsmithOkHttpClient;
import com.langchain.smith.prompts.Prompt;
import com.langchain.smith.prompts.PromptClient;
import com.langchain.smith.prompts.PromptValue;
import java.util.Map;

LangsmithClient client = LangsmithOkHttpClient.fromEnv();
PromptClient promptClient = PromptClient.create(client);

Prompt prompt = promptClient.pull("joke-generator");
PromptValue formattedPrompt = prompt.invoke(Map.of("topic", "cats"));
// Use formattedPrompt with your model provider — see "Use a prompt without LangChain" below.
```
