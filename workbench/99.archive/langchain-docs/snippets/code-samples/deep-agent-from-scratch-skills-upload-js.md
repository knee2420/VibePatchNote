<!-- source: langchain-ai/docs  src/snippets/code-samples/deep-agent-from-scratch-skills-upload-js.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```ts
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const skillsDir = resolve(
  fileURLToPath(new URL(".", import.meta.url)),
  "skills",
);
const skillFiles: Array<[string, Uint8Array]> = [];

function collectSkillFiles(dir: string): void {
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    if (statSync(fullPath).isDirectory()) {
      collectSkillFiles(fullPath);
    } else {
      const rel = relative(skillsDir, fullPath).replace(/\\/g, "/");
      skillFiles.push([`/skills/${rel}`, readFileSync(fullPath)]);
    }
  }
}

collectSkillFiles(skillsDir);
await backend.uploadFiles(skillFiles);
```
