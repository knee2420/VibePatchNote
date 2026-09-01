---
type: card
title: "Semantic Attribute Mapping (의미 기반 속성 매핑)"
category: "Feature / Detailed Scaffold Extraction"
---

# 의미 기반 속성 매핑 (Semantic Attribute Mapping)

## 설명
추출된 미시 구조(Row) 내의 텍스트들을 단순한 문자열이 아닌, **'역할(Semantic Role)'을 가진 데이터 속성**으로 1:1 매핑합니다. 
(예: 특정 텍스트 블록은 'T(타임코드)'로, 다른 블록은 'NAR(진행 대본)'으로, 또 다른 블록은 'Attach(화면 지시)'로 자동/수동 분류)

## 핵심 가치
각 세그먼트가 어떤 목적을 가진 데이터인지 AI가 명확히 인지하게 함으로써, "화면(VIDEO)이 비어있거나", "오디오만 길게 늘어지는" **시각적 공백(Quality Control 실패)을 기획 단계에서 완벽하게 차단**합니다.
