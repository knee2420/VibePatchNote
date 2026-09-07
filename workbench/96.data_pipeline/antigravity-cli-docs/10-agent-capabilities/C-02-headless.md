---
type: card
title: "Headless Mode"
description: "Headless Mode 핵심 기능 및 아키텍처 가이드"
resource: "../../../99.archive/antigravity-cli-docs/10-agent-capabilities/02-headless.md"
timestamp: "2026-09-07"
---

# summary
Headless Mode의 핵심 엔지니어링 사양을 정의하며, **터미널 환경에서 고속 에이전트 오케스트레이션 및 무인 자동화 파이프라인을 구축하기 위한 표준 인터페이스와 작동 제약**을 다룬다.
Run Antigravity CLI non-interactively to script agent tasks, integrate with CI pipelines, and capture machine-readable output.

# elements
| id | kind | label | 무엇이 들어있나 | anchor |
|---|---|---|---|---|
| E1 | 도구 | Run a single prompt | Pass a prompt with `-p` (or its aliases `--print` and `--prompt`) to run once and exit: The response goes to `stdout`... | `## Run a single prompt` |
| E2 | 아키텍처 | Capture only the model response; diagnostics still print to the terminal. | answer=$(agy -p "Name three popular version control systems, comma-separated.") ``` | `# Capture only the model response; diagnostics still print to the terminal.` |
| E3 | 도구 | Output formats | The `--output-format` flag controls the shape of `stdout`. It accepts three values: | `## Output formats` |
| E4 | 코드 | Text | The default. The response text goes straight to `stdout` with no wrapping: | `### Text` |
| E5 | 인터페이스 | JSON | Set `--output-format json` to get a single JSON envelope after the run completes. The CLI emits it on one line; pipe ... | `### JSON` |
| E6 | 코드 | JSON 실행 구문 | CLI 명령어: `agy -p "In one sentence, what is a git rebase?" --output-for` | `### JSON` |
| E7 | 인터페이스 | Structured output with a schema | Pass `--json-schema` to constrain the answer to a schema. The parsed object appears in `structured_output`, and `resp... | `#### Structured output with a schema` |
| E8 | 인터페이스 | Streaming JSON | Set `--output-format stream-json` to emit one JSON object per line (NDJSON) as the run progresses. Use this format to... | `### Streaming JSON` |
| E9 | 코드 | Streaming JSON 실행 구문 | CLI 명령어: `agy -p "In one sentence, what is a git rebase?" --output-for` | `### Streaming JSON` |
| E10 | 코드 | Tool calls in the stream | On tool steps, `tool_info` carries the call and its result. This is a real tool step from a run that executed `echo h... | `#### Tool calls in the stream` |
| E11 | 원칙 | Structured output in the stream | With `--json-schema`, the schema applies to the terminal `result` event, which carries the same `structured_output` a... | `#### Structured output in the stream` |
| E12 | 코드 | Parse output with jq | `stdout` is machine-readable, so `jq` extracts exactly what you need. Get the response text from a JSON run: | `## Parse output with jq` |
| E13 | 코드 | Continue a conversation | Headless runs are stateless by default. Resume prior context with `--continue` (`-c`) for the most recent conversatio... | `## Continue a conversation` |
| E14 | 원칙 | Continue the most recent conversation. | agy -p "Now explain your previous answer in more detail" --continue | `# Continue the most recent conversation.` |
| E15 | 코드 | Resume a specific conversation by ID. | agy -p "Summarize what we discussed" --conversation 055a398f-db14-4c5f-abbb-1bf03f8120a7 ``` | `# Resume a specific conversation by ID.` |
| E16 | 원칙 | Stream prompts from stdin | Use `--input-format stream-json` to maintain a single, continuous conversation process, feeding it prompts one by one... | `## Stream prompts from stdin` |
| E17 | 코드 | Send a prompt | Write one JSON object per line to `stdin`. The `event` key specifies the message type (matching the output stream for... | `### Send a prompt` |
| E18 | 코드 | Read the results | The output stream works as follows: 1. Opens with a single `init` event. | `### Read the results` |
| E19 | 코드 | Read the results 실행 구문 | CLI 명령어: `printf '%s\n' \` | `### Read the results` |
| E20 | 코드 | Drive a session programmatically | Instead of passing all prompts up front, you can hold the `stdin` pipe open in a script. This allows your application... | `### Drive a session programmatically` |
| E21 | 원칙 | End a session | To close a session gracefully, simply close `stdin`. The process exits after the input pipe is closed and the current... | `### End a session` |
| E22 | 코드 | Unsupported messages | To prevent unpredictable behavior, the CLI validates inputs. If it encounters a malformed or unsupported message, it ... | `### Unsupported messages` |
| E23 | 코드 | Common mistakes | Common mistakes에 대한 핵심 사양 및 작동 규칙 정의. | `### Common mistakes` |
| E24 | 아키텍처 | Select a model, effort, or agent | List the available model slugs, then pin one for the run: ```bash | `## Select a model, effort, or agent` |
| E25 | 아키텍처 | Pin a model by slug. | agy -p "Reverse the string antigravity." --model gemini-3.5-flash-medium | `# Pin a model by slug.` |
| E26 | 원칙 | Set reasoning effort (low, medium, or high). | agy -p "Outline a plan to add caching to this service." --effort high | `# Set reasoning effort (low, medium, or high).` |
| E27 | 코드 | Select an agent (list them with `agy agents`). | agy -p "Review this function for edge cases." --agent <agent-name> ``` | `# Select an agent (list them with `agy agents`).` |
| E28 | 규칙 | Permissions in headless mode | There is no interactive prompt in headless mode, so tools that would normally ask for confirmation are handled by pol... | `## Permissions in headless mode` |
| E29 | 안티패턴 | Handle exit codes and errors | A successful run exits `0`. A run that fails to produce a response exits non-zero and writes the reason to `stderr`. ... | `## Handle exit codes and errors` |
| E30 | 도구 | Flag reference | Flag reference에 대한 핵심 사양 및 작동 규칙 정의. | `## Flag reference` |
| E31 | 도구 | Example: run the agent in CI | Fail the job on error and save the response: | `## Example: run the agent in CI` |
| E32 | 절차 | Next steps | - Prompting & Interaction: Write effective prompts for the agent. - Permissions: Configure allow, deny, and ask rules. | `## Next steps` |

# 밖으로
- [E1] 요소는 에이전트 하네스 코어와 연동되며 상위 실행 정책을 공유한다.
- ⚠️ CLI 업데이트(v1.1.25 기준) 시 플래그 명칭이나 기본 세션 타임아웃 변경 여부를 상시 점검할 것.

# 원문
[02-headless.md](../../../99.archive/antigravity-cli-docs/10-agent-capabilities/02-headless.md) · [공식 사이트](https://antigravity.google/docs/cli/headless/)
