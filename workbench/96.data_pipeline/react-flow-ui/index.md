---
type: index
title: "React Flow UI Knowledge Pipeline (Root Index)"
description: "xyflow 공식 팀의 shadcn/ui 기반 캔버스 전용 17종 완성형 컴포넌트 지식 체계"
resource: "../../99.archive/react-flow-ui/"
timestamp: "2026-09-06"
---

원문 출처: [ui.reactflow.dev](https://ui.reactflow.dev) · 총 17 컴포넌트 / 핵심 지식 카드 18장

# 이 지식 파이프라인은

React Flow UI는 xyflow 공식 팀이 직접 구축한 **shadcn/ui 기반의 캔버스 전용 풀 디자인 시스템**이다.
캔버스 애플리케이션 개발 시 에이전트가 `div` 태그에 임의의 다크/원색 인라인 스타일을 즉흥적으로 적용하여 발생하는 **UI 파괴(Ad-hoc Styling) 참사를 원천 차단**하기 위해 설계되었다.

이 데이터 파이프라인은 17종의 완성형 노드, 엣지, 핸들, 툴팁, 줌 컨트롤의 스펙과 코드를 체계화하여, 에이전트가 캔버스 UI를 구현할 때 단 한 번의 참조로 100% 일관된 고품질 UI를 자동 조립할 수 있도록 돕는다.

# 지도

```text
react-flow-ui/
├── root/                  [아카이브 개요 및 4대 분류 체계]       카드 1장
└── components/            [17종 캔버스 컴포넌트 소스코드]        카드 17장

원문: ../../99.archive/react-flow-ui/
```

# 전체 카드

## Root Overview
- [React Flow UI Kit Overview](C-README.md) — xyflow 공식 팀이 제작한 shadcn/ui 기반 캔버스 전용 컴포넌트 레지스트리

## Canvas Components (17 Types)
- [Base Node Component](components/C-base-node.md) — 헤더, 타이틀, 본문, 푸터 레이아웃과 선택 상태 스타일이 결합된 표준 캔버스 카드
- [Database Schema Node](components/C-database-schema-node.md) — 테이블 명칭, 키 타입 및 다중 필드 행 목록을 표시하는 스키마/데이터 테이블 전용 노드
- [Labeled Group Node](components/C-labeled-group-node.md) — 캔버스 위의 여러 노드를 시각적으로 묶어주는 영역 래퍼 및 그룹 라벨 컴포넌트
- [Placeholder Node](components/C-placeholder-node.md) — 데이터 로딩 중이거나 드롭 대기 상태를 나타내는 플레이스홀더/스켈레톤 노드
- [Node Tooltip Component](components/C-node-tooltip.md) — 노드나 캔버스 요소 호버 시 플로팅되는 고해상도 정보 툴팁
- [Node Status Indicator](components/C-node-status-indicator.md) — 노드의 실행, 완료, 에러, 대기 상태를 실시간 시각화하는 인디케이터 점/뱃지
- [Node Search Bar](components/C-node-search.md) — 캔버스 내 노드를 실시간 검색하고 해당 노드로 부드럽게 화면을 이동시키는 검색 위젯
- [Node Appendix Panel](components/C-node-appendix.md) — 노드 카드 외곽에 날개처럼 부착되어 추가 정보나 액션을 확장하는 부가 패널
- [Canvas Devtools Panel](components/C-devtools.md) — 캔버스 노드 수, 선택 상태, 뷰포트 x/y/zoom 좌표를 실시간 디버깅하는 개발자 패널
- [Zoom Select Dropdown](components/C-zoom-select.md) — 25%, 50%, 100%, 200%, Fit View 등 정형화된 줌 배율을 원클릭 선택하는 드롭다운
- [Zoom Slider Controller](components/C-zoom-slider.md) — 캔버스 줌 배율을 미세 조절하는 슬라이더 바 컨트롤러
- [Animated SVG Edge](components/C-animated-svg-edge.md) — SVG 패스를 따라 점이나 빛 파티클이 동적으로 흐르는 고품질 애니메이션 엣지
- [Button Edge Component](components/C-button-edge.md) — 엣지 중앙에 삭제, 분기, 설정 등의 액션 버튼이 부착된 인터랙티브 엣지
- [Data Edge Component](components/C-data-edge.md) — 연결선 위에 데이터 타입, 흐름 건수, 라벨 뱃지를 표시하는 데이터 플로우 엣지
- [Base Handle Component](components/C-base-handle.md) — 포트 호버 효과 및 연결 가능 상태를 시각화하는 표준 연결 핸들/포트
- [Button Handle Component](components/C-button-handle.md) — 클릭하여 즉시 새 노드를 생성하거나 팝오버 메뉴를 띄우는 버튼형 연결 포트
- [Labeled Handle Component](components/C-labeled-handle.md) — 입출력 파라미터명이나 데이터 타입 라벨이 나란히 표시되는 텍스트 라벨 포트

# 가로축 — 전체를 관통하는 핵심 줄기

1. **[표준 노드 카드 조립 줄기]**
   [C-base-node](components/C-base-node.md) E1 → [C-base-handle](components/C-base-handle.md) E1 → [C-node-status-indicator](components/C-node-status-indicator.md) E1
   → 캔버스에 카드를 띄울 때 임의의 div를 쓰지 않고 BaseNode 쉘 + BaseHandle 포트 + StatusIndicator 상태점을 세트로 조합하는 표준 줄기.

2. **[테이블 및 세그먼트 매핑 카드 줄기]**
   [C-database-schema-node](components/C-database-schema-node.md) E1 → [C-labeled-handle](components/C-labeled-handle.md) E2 → [C-node-tooltip](components/C-node-tooltip.md) E1
   → TABLE 매핑처럼 필드 목록이 존재하는 복합 노드를 구성할 때 DatabaseSchemaNode 행과 라벨 포트를 결합하는 전문 생산성 줄기.

# 어디로 갈지 (목적별 라우팅 테이블)

| 개발/설계 시 필요한 것 | 바로 가야 할 카드 |
|---|---|
| 일반 캔버스 카드, 헤더, 타이틀, 본문 구조 | [C-base-node](components/C-base-node.md) |
| 테이블, 스키마, 필드 목록 형태의 매핑 카드 | [C-database-schema-node](components/C-database-schema-node.md) |
| 노드 그룹핑 및 서브 영역 컨테이너 | [C-labeled-group-node](components/C-labeled-group-node.md) |
| 노드 호버 시 플로팅 툴팁 | [C-node-tooltip](components/C-node-tooltip.md) |
| 노드 실행/에러/완료 실시간 상태 표시 점 | [C-node-status-indicator](components/C-node-status-indicator.md) |
| 캔버스 노드 검색바 위젯 | [C-node-search](components/C-node-search.md) |
| 애니메이션 데이터 흐름 연결선 | [C-animated-svg-edge](components/C-animated-svg-edge.md) |
| 줌 배율 드롭다운 및 슬라이더 | [C-zoom-select](components/C-zoom-select.md) · [C-zoom-slider](components/C-zoom-slider.md) |
