---
title: Engine and Model Executor Boundary
status: candidate
related_feature: F-02
---

# Engine and Model Executor Boundary

## 목표

`scaffold-engine`은 모델 공급자·자격증명·HTTP·파일 저장소를 모르고 공개 `ModelExecutor` 계약만 요구한다. `core/llm`이 CLI와 Google API 구현체를 조립해 주입한다.

## 검토 기준

- 패키지가 `apps/*`를 import하지 않는가
- 앱은 패키지의 Public API만 사용하는가
- 기존 `BaseLlmHarness`와의 호환 이행 경로가 있는가
