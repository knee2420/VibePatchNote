---
id: GSV-01
feature_id: F-03
title: "Grid-Slot 인터랙티브 문서 뷰어 요구사항 (Structured Document & Slot Viewer)"
spec_version: 0.2.0-draft
status: proposed
updated_at: 2026-10-28
related_tech_spec: workbench/02.tech_specs_candidates/grid_slot_viewer/GSV-TECH-01-architecture.md
experiment_path: workbench/08.experiments/01.grid_slot_viewer
---

# [GSV-01] 범용 시각 문서 & 슬롯 뷰어 핵심 요구사항 (Big Boundaries)

## 1. 배경 및 목적
위에서 아래로만 끝없이 흐르는 1차원 마크다운(MD) 줄글의 독해 피로감을 해소하기 위해, **문서를 2차원 시각 구획(다단 칼럼, 요약 카드, 콜아웃 섹션, 정밀 표 등)으로 한눈에 조망**하면서 **원하는 구획(Slot)만 콕 찍어 백데이터를 연결하고 AI와 상호작용**하는 컴퓨터 내장형 뷰어를 구축한다.

---

## 2. 4대 핵심 바운더리 (Big Boundaries)

```text
• [GSV-01] 범용 시각 문서 뷰어 (Structured Document Viewer)
  ├─ [GSV-B1] 레이아웃 컨테이너 (Layout Container — 2차원 시각 구획)
  │   └─ 1차원 줄글을 벗어나 다단(Columns), 요약 배너, 카드 그리드, 섹션 박스, 표(Table) 등 문서를 시각적으로 구획하는 뼈대
  │
  ├─ [GSV-B2] 고정 틀 vs 가변 슬롯 (Boilerplate vs Slot — 역할 분리)
  │   ├─ 고정 틀 (Boilerplate): 문서의 디자인·구조·헤더·라벨을 지탱하는 불변 영역 (임의 편집 잠금)
  │   └─ 가변 슬롯 (Slot): 각 구획 안에서 사용자와 AI가 실제로 알맹이를 채우고 고치는 독립 타겟 영역 (`slotId`)
  │
  ├─ [GSV-B3] 슬롯별 백데이터 바인딩 (Slot-Scoped Backdata)
  │   └─ 문서 전체가 아닌 특정 슬롯(구획) 단위로 원본 근거 자료(MD, 메모, 녹취, PDF 발췌 등)를 뒷배경 데이터로 연결·열람
  │
  └─ [GSV-B4] 인플레이스 AI 인터랙션 (In-place AI Interaction)
      └─ 화면에서 원하는 슬롯을 클릭하면, 연결된 백데이터와 그 구획의 공간 제약을 바탕으로 해당 슬롯만 AI로 생성·수정·직접 편집
```

---

## 3. 바운더리별 핵심 원칙

| ID | 바운더리 명칭 | 핵심 원칙 |
| :--- | :--- | :--- |
| **`GSV-B1`** | **레이아웃 컨테이너** | 표(Table)에 한정되지 않고 원페이저 보고서·대시보드·회의록·잡지형 레이아웃 등 모든 2차원 시각 배치를 포괄한다. |
| **`GSV-B2`** | **고정 틀 vs 가변 슬롯** | 전체 문서를 하나의 에디터에 넣지 않는다. 바깥 틀은 레이아웃을 고정하고, 안쪽 슬롯만 독립적으로 움직여 서식 붕괴를 막는다. |
| **`GSV-B3`** | **슬롯별 백데이터** | 모든 슬롯은 자기만의 참고 자료(`backDataRefs`)를 가질 수 있으며, 클릭 시 그 근거 원문을 즉시 대조할 수 있어야 한다. |
| **`GSV-B4`** | **인플레이스 AI** | 조판/마크업 코드는 사용자에게 완전히 은닉하고, 완성된 화면 위에서 슬롯 클릭만으로 AI 지시와 내용 교체가 끝나야 한다. |
