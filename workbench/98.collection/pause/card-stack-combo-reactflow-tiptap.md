---
type: card
title: "Stack Combo 0: React Flow + Tiptap (Main Recommendation)"
category: "Tech Stack / UI Architecture"
---

# 🌟 Stack Combo 0: React Flow + Tiptap (메인 추천 스택)

## 📌 아키텍처 개요
**"가장 완벽한 밸런스: 구조(Canvas)와 내용(Editor)의 하이브리드"**
* **공간 제어 (노드 및 매핑):** `React Flow` (무한 줌/팬이 가능한 노드 기반 다이어그램 라이브러리)
* **텍스트 제어 (블록 및 마스킹):** `Tiptap` (최고의 확장성을 가진 Headless 블록 텍스트 에디터)

## 💡 구현 방식
`React Flow`를 바탕판(무한 캔버스)으로 깝니다. 아웃라인의 각 챕터나 지식 카드들은 모두 `React Flow`의 커스텀 노드(Node)가 됩니다. 
이 커스텀 노드의 내부에 `Tiptap` 에디터 인스턴스를 삽입합니다. 유저는 캔버스 위에서 노드를 드래그해 목차를 배치(Top-Down Outliner)하고, 포스트잇 노드를 연결(Post-it Mapping)한 뒤, 노드 안쪽을 클릭해 `Tiptap`의 강력한 글쓰기 기능과 블록 마스킹(Interactive Block Masking) 기능을 사용합니다.

## 🎯 장단점 분석
* **👍 장점 (기획 요구사항 100% 충족):** `React Flow`의 DOM 기반 노드 시스템은 `Tiptap`과 같은 복잡한 HTML 에디터를 임베딩할 때 충돌이 가장 적습니다. '탑다운 아웃라인 재배치'와 '하이브리드 편집'이라는 두 가지 핵심 가치를 지연 없이 완벽하게 구현할 수 있는 최적의 핏(Fit)입니다.
* **👎 단점 (드로잉 기능의 부재):** 펜으로 자유롭게 그림을 그리거나 삐뚤삐뚤한 스케치를 하는 등 '아날로그 화이트보드' 감성을 내기는 어렵습니다. 철저하게 정보(Node)와 관계(Edge)를 다루는 데 특화되어 있습니다.
