---
name: rule_develop_50_generator
description: "사용자가 에이전트에게 agy-cli 관련 트러블슈팅 사례나 스크립팅 활용법을 'rules에 등록해'라고 지시할 때 발동합니다. 50-develop/agy-cli 규칙 저장소의 1가이드=1폴더 원칙을 엄격하게 준수하여 문서화하고 예제를 격리합니다."
---

# Skill: 50-develop/agy-cli Rule Generator

## 1. 목적
에이전트가 사용자로부터 `agy-cli`와 관련된 트러블슈팅, 베스트 프랙티스, 스크립팅 활용법 등을 규칙으로 등록하라는 지시를 받았을 때, 오직 `.agents/rules/50-develop/agy-cli` 폴더 내부에 정해진 구조(1 가이드 = 1 폴더)와 예제 격리 원칙(Isolation)에 따라 완벽하게 문서화하는 워크플로우를 강제합니다.

## 2. 트리거 조건
사용자가 다음과 같은 뉘앙스의 지시를 할 때 발동합니다:
- "방금 파악한 agy-cli 활용법을 rules에 등록해"
- "agy-cli 스크립팅 시행착오를 규칙으로 남겨둬"
- "이 내용을 50-develop agy-cli 에 추가해"

## 3. 엄격한 구조 규칙 (1 가이드 = 1 폴더)
agy-cli 관련 새로운 규칙은 `50-develop/agy-cli` 하위에 단일 파일로 생성해서는 **절대 안 됩니다**.
반드시 다음의 구조를 따라야 합니다.

```text
50-develop/agy-cli/
└── [구체적_가이드_이름]/        # 예: 02_advanced_scripting/
    ├── rule.md                  # 가이드 본문 (절대 다른 이름 안됨)
    └── examples/                # 독립된 예제 코드 및 산출물 격리 폴더
```

## 4. Rule 생성 5단계 워크플로우

### Step 1: 폴더 구조 생성 (Isolation)
1. `50-develop/agy-cli/` 폴더 하위에 구체적인 가이드 폴더(예: `02_xxx_guide`)를 생성합니다.
2. 그 가이드 폴더 하위에 반드시 `examples` 하위 폴더를 생성합니다. 
   *(예: `.agents/rules/50-develop/agy-cli/02_advanced_guide/examples`)*

### Step 2: 예제(Examples) 이주 및 튜닝
1. 방금까지 작업하며 `agy-cli` 문제를 해결했던 임시 폴더(`scratch/` 등)의 테스트 스크립트(.py, .sh 등), 결과물 파일 등을 새로 만든 `examples/` 폴더 안으로 이동(Move)시킵니다.
2. 예제 코드 내부의 파일 I/O 절대 경로나 임시 경로를 찾아, `examples/` 폴더 내에서 실행해도 독립적으로 동작할 수 있도록 **상대 경로(Relative Path)**로 코드를 수정(Tuning)합니다.

### Step 3: rule.md 본문 작성
1. 가이드 폴더 바로 아래에 `rule.md` 파일을 작성합니다.
2. `rule.md` 에는 다음 내용이 필수로 포함되어야 합니다:
   - **목적(Objective):** `agy-cli` 사용 시 어떤 문제를 해결하거나 팁을 제공하기 위함인지 명확한 서술
   - **해결책 및 필수 규칙(Troubleshooting/Rules):** 발생했던 CLI 에러와 해결책 (핵심 코드 스니펫 및 플래그 설명 포함)
   - **성공 사례 참고(References):** 문제를 해결할 때 힌트를 얻었던 96.data_pipeline의 `antigravity-docs` 카드 링크나 워크스페이스 내 파일 경로 (예: `obsidian_tuning/scripts/...`)

### Step 4: 50-develop/README.md 업데이트
새로운 `agy-cli` 하위 가이드가 생성되었다면, 필요 시 `50-develop/README.md`를 열어서 새 구조가 트리에 잘 나타나도록 현행화(Update)합니다.

### Step 5: 완료 보고
사용자에게 새롭게 생성된 `rule.md`의 절대 경로 링크를 제공하고, `agy-cli` 예제 파일들이 어떻게 격리되었는지 요약하여 보고합니다.
