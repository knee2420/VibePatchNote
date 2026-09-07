---
title: "Boost Command (/boost)"
source: "https://antigravity.google/docs/boost/"
section: "Commands"
---

# Boost deep reasoning (/boost)

The `/boost` slash command activates an on-demand multi-agent reasoning pipeline designed for challenging software engineering tasks. When standard single-turn coding assistance falls short on complex bugs, race conditions, or intricate refactoring, `/boost` breaks down the problem, delegates focused workstreams to specialized subagents, and independently verifies solutions across iterative rounds.

**Note:** The `/boost` command is available on paid plans across Google Antigravity 2.0 and the Antigravity CLI.

---

## Overview

Modern software development involves problems spanning a wide spectrum of complexity:

1. **Everyday engineering**: Interactive feature development, codebase navigation, refactoring, and general programming workflows where speed and versatility shine.
2. **Deep reasoning tasks**: High-difficulty concurrency bugs, algorithmic optimization, subtle regressions, and multi-file architecture puzzles that benefit from multi-agent exploration and iterative verification.
3. **Long-horizon campaigns**: Repository-scale migrations, large subsystem builds, and multi-day exploratory research.

`/boost` addresses interactive, high-intensity developer productivity by delivering multi-agent deep reasoning directly within day-to-day coding sessions without requiring complex setup or prolonged scoping interviews.

---

## How Boost works

When you invoke `/boost`, Antigravity initiates a three-phase multi-agent reasoning pipeline that decouples strategy formulation from isolated execution and verification:

### Phase 1: Goal & strategy formulation

The Primary Orchestrator receives your prompt, inspects workspace context, and formulates an execution strategy. It breaks down complex engineering challenges into discrete, verifiable subtasks and determines which specialized workstreams are required.

### Phase 2: Parallel execution & verification

The Orchestrator dispatches focused subtasks to specialized subagents operating in clean, isolated scopes:

- **Implementation workstreams**: Construct candidate code solutions, apply refactoring, and generate unit tests.
- **Investigation workstreams**: Perform root-cause debugging, trace execution call graphs, and analyze unfamiliar dependencies without modifying files.
- **Local verification**: Subagents execute build targets and test suites locally to validate hypotheses before reporting results.

### Phase 3: Synthesis & delivery

Before presenting the final outcome, the reasoning pipeline aggregates findings and runs regression checks:

- The Orchestrator validates the combined solution against full test suites and edge cases.
- If an assertion fails, error diagnostics are fed back into the next iteration for automated correction.
- Once all tests and requirements pass, a concise summary with verified changes is delivered.

---

## When to use /boost

The following table compares the three primary execution modes in Antigravity:

| Dimension | Default Agent | 🚀 Boost (`/boost`) | 👥 Teamwork (`/teamwork-preview`) |
|-----------|---|---|---|
| **Primary focus** | Full-spectrum interactive coding & pair programming | Deep reasoning and tricky bugs | Autonomous multi-day agent teams |
| **Task horizon** | Seconds to minutes | Seconds to hours | Hours to days |
| **Plan tier** | All plans | Paid plans | Paid plans |
| **Scoping phase** | Single prompt | Immediate execution | Two-phase scoping interview |
| **Architecture** | Single-agent direct loop | 3-phase reasoning hierarchy | Multi-role agent teams |
| **Workspace model** | Shared working tree | Ephemeral isolated worktrees | Persistent isolated worktrees per milestone |
| **Verification** | Single-pass tool check | Multi-round independent verification | Adversarial falsification and independent success audit |
| **Best suited for** | Feature development, code navigation, refactoring, and general engineering workflows | Tough concurrency bugs, algorithmic optimization, intricate multi-file refactors | Subsystem builds, formal proofs, and autonomous OS-scale campaigns |

---

## How to use /boost

You can invoke Boost across all Antigravity surfaces.

### In Antigravity 2.0

Type `/boost` followed by your task prompt in any conversation turn:

```
/boost Investigate the race condition in the session cache and implement a thread-safe fix with tests.
```

### In Antigravity CLI

Type `/boost` directly into the terminal user interface (TUI) prompt box:

```
/boost Optimize the matrix transposition algorithm to use SIMD vectorization and benchmark throughput.
```

---

## Key use cases

### 1. Concurrency and race conditions

Debugging multithreaded timing issues, deadlocks, and cache synchronization bugs where reproduction requires careful trace analysis and isolated verification:

```
/boost Reproduce and fix the intermittent deadlock in the connection pool during high connection turnover.
```

### 2. Algorithmic problem solving

Implementing high-performance algorithms, custom data structures, graph traversals, or mathematical routines with rigorous boundary testing:

```
/boost Implement a lock-free ring buffer for streaming telemetry events and write stress tests.
```

### 3. Non-trivial refactoring

Refactoring tightly coupled modules, modernizing legacy interfaces, or migrating synchronous APIs to asynchronous patterns across multiple files:

```
/boost Refactor the authentication middleware to use asynchronous token validation without breaking existing routes.
```

### 4. Deep root-cause investigation

Tracing execution paths across unfamiliar or large codebases to isolate the exact origin of an unexpected failure:

```
/boost Trace why HTTP request timeouts spike when batch payload size exceeds 2MB, without modifying code.
```

---

## Safety and permissions

Boost respects all standard Antigravity security policies:

- **Scoped permissions**: "Subagents inherit file access rules and command permission policies configured for your active workspace or project."
- **Interactive approvals**: When a worker proposes a protected terminal command or file edit outside trusted scopes, the authorization prompt surfaces to your interface for confirmation.
- **Context isolation**: Subagents execute in isolated memory spaces, preventing verbose debug logs and scratch diffs from cluttering your primary chat history.

---

## Next steps

Explore related documentation and guides:

- [Slash commands catalog](https://antigravity.google/docs/slash-commands): Review all available slash commands across Antigravity 2.0 and the CLI.
- [Teamwork agent teams (`/teamwork-preview`)](https://antigravity.google/docs/teamwork): Learn how collaborative agent teams tackle large-scale migrations.
- [Subagents in Antigravity 2.0](https://antigravity.google/docs/subagents): Learn how asynchronous subagent workers operate in parallel.
- [Antigravity CLI reference](https://antigravity.google/docs/cli/reference): Explore terminal keybindings and command reference for the CLI.
