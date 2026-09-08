# Workbench: 01.requirements_analysis Guidelines

## 1. 목적
`workbench/01.requirements_analysis/`는 VibePatchNote 시스템의 기획 의도, 전역 기능 요구사항(Features), 그리고 이를 더 이상 쪼갤 수 없는 단위로 분해한 원자적 기능 명세(Atomic Features)를 정의하고 관리하는 **요구사항 분석의 단일 진실 공급원(Single Source of Truth)**입니다.

---

## 2. 디렉토리 구조 및 역할

```text
workbench/01.requirements_analysis/
├── features/                  # 거시적 기능 요구사항 명세서 (Macro Features)
│   └── F-XX-{기능명}.md        # 예: F-01-global-segment-extraction.md
└── atomic-features/           # 세부 원자적 기능 카드 (Micro Atomic Features)
    └── card-{기능식별자}.md     # 예: card-dynamic-schema-extraction.md
```

---

## 3. 🚨 작성 및 관리 원칙

### ① 요구사항의 원자화 (Atomicity)
- 하나의 큰 기능은 여러 개의 독립적이고 검증 가능한 단위로 분해하여 `atomic-features/`에 카드로 등록합니다.
- 각 원자 카드는 단일 책임(Single Responsibility)을 가지며, 다른 기능과 조합(Composition) 가능한 형태로 정의합니다.

### ② 원자 카드 표준 규격 (Frontmatter & Format)
원자 기능 카드는 반드시 상단에 메타데이터 프론트매터를 포함합니다:
```markdown
---
type: card
title: "{기능 국문명 및 영문명}"
category: "{대분류 카테고리}"
---

# {기능 제목}

## 설명
{구체적인 기능 동작 및 사용자 인터랙션 설명}

## 핵심 가치
{왜 이 기능이 필요한지, 사용자와 시스템에 제공하는 본질적 가치}
```

### ③ 핵심 가치(Core Value) 필수 명시
- 단순한 UI 동작 나열에 그치지 않고, **"이 기능이 왜 존재하는가"**에 대한 본질적 효용과 사용자 경험 가치를 반드시 명시합니다.

### ④ 휴먼 인 더 루프 (HITL) 존중
- AI가 자동 추출/생성하는 기능이라도, 오차를 보정할 수 있는 사람의 시각적 확인 및 직접 수정(수동 튜닝/각잡기) 인터페이스 접점을 요구사항에 항상 고려하여 명세합니다.

### ⑤ 구현 전 정본(Ground Truth) 참조
- 에이전트는 코드 구현 및 기능 리팩토링 시 기획 의도가 모호할 경우 본 디렉토리의 요구사항 명세서를 우선 참조합니다.
