# React Flow UI Components Archive (ui.reactflow.dev)

React Flow (xyflow) 공식 팀이 제공하는 shadcn/ui 기반의 캔버스 전용 완성형 컴포넌트 레지스트리 아카이브입니다.
출처: [ui.reactflow.dev](https://ui.reactflow.dev)

## 디렉토리 구조
- `components/`: 순수 TypeScript (.tsx) 컴포넌트 소스코드 17종
- `registry/`: 의존성 및 메타데이터가 포함된 shadcn 원본 JSON 17종

## 컴포넌트 목록 (17종)

### 1. 노드 (Nodes)
* `base-node.tsx`: 표준 캔버스 카드 (Header, Title, Content, Footer 구조)
* `database-schema-node.tsx`: 테이블/DB 스키마 및 필드 목록 형태의 노드 (TABLE 매핑 최적)
* `labeled-group-node.tsx`: 여러 노드를 시각적으로 묶어주는 라벨 그룹 박스
* `placeholder-node.tsx`: 빈 상태나 로딩 시 표시되는 플레이스홀더 노드

### 2. 인터랙션 & 유틸리티 (Interactions & Utilities)
* `node-tooltip.tsx`: 노드 호버 시 플로팅되는 툴팁
* `node-status-indicator.tsx`: 노드 상태 점 (Running, Success, Error 등)
* `node-search.tsx`: 캔버스 내 노드 검색창 UI
* `node-appendix.tsx`: 노드 외부에 부착되는 부가 정보/설명 패널
* `devtools.tsx`: 캔버스 좌표/상태 디버깅 툴

### 3. 캔버스 뷰포트 컨트롤 (Canvas Controls)
* `zoom-select.tsx`: 줌 배율 선택 드롭다운
* `zoom-slider.tsx`: 줌 슬라이더 컨트롤러

### 4. 엣지 & 핸들 (Edges & Handles)
* `animated-svg-edge.tsx`: 애니메이션 SVG 연결선
* `button-edge.tsx`: 버튼이 달린 연결선
* `data-edge.tsx`: 데이터 흐름 표시 연결선
* `base-handle.tsx`: 표준 연결 포트
* `button-handle.tsx`: 버튼형 연결 포트
* `labeled-handle.tsx`: 라벨이 달린 연결 포트
