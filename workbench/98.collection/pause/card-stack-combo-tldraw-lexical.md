---
type: card
title: "Stack Combo 1: tldraw + Lexical (Whiteboard-First)"
category: "Tech Stack / UI Architecture"
---

# 🚀 Stack Combo 1: tldraw + Lexical (화이트보드 중심 하이브리드)

## 📌 아키텍처 개요
**"가장 미로(Miro)에 가까운 완벽한 화이트보드 경험"**
* **공간 제어 (무한 캔버스):** `tldraw` (최근 가장 각광받는 화이트보드 SDK)
* **텍스트 제어 (블록 에디터):** `Lexical` (Meta에서 만든 고성능 리치 텍스트 에디터)

## 💡 구현 방식
`tldraw`는 선 긋기, 도형 그리기, 줌/팬 등의 화이트보드 기능이 이미 완벽하게 구현되어 있습니다. 이 `tldraw`의 '커스텀 쉐이프(Custom Shape)' 기능 안에 `Lexical` 에디터를 임베딩(Embedding)합니다. 
즉, 유저가 화이트보드 위에서 포스트잇을 생성하거나 문서를 열면, 그 공간 안에서 강력한 텍스트 편집이 가능해집니다.

## 🎯 장단점 분석 (vs React Flow + Tiptap)
* **👍 장점 (UX 끝판왕):** `React Flow`가 다소 딱딱한 '노드-엣지' 다이어그램 느낌이라면, `tldraw`는 진짜 자유로운 '스케치북' 느낌입니다. 포스트잇, 펜 그리기 등 시각적 영감(Inspiration)을 위한 최고의 UX를 제공합니다.
* **👎 단점 (통합 난이도):** `tldraw` 내부에 복잡한 텍스트 에디터(`Lexical`)의 이벤트(드래그, 블록 마스킹 등)를 충돌 없이 연동하는 것이 까다로울 수 있습니다.
