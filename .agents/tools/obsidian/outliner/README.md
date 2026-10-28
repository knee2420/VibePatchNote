# 🛠️ Obsidian Outliner Tools (`.agents/tools/obsidian/outliner`)

Workflowy 데스크톱 내장 MCP 서버의 핵심 아키텍처(`tree_seek`, `tree_patch`, `lease_*`, `attachments_*`)를 벤치마킹하여, AI 에이전트가 `.outline` JSON 파일을 다룰 때 마주치는 19대 결함(괄호 절단, grep 먹통, 쉼표 에러, 인덱스 시프트, 부모 포인터 부재, 동시성 충돌)을 원천 차단하는 **독립 실행형 CLI 도구 묶음**입니다.

---

## 📂 도구 목록 및 역할

| 도구 스크립트 | Workflowy 대응 | 주요 역할 및 특징 |
| :--- | :--- | :--- |
| **`01_seek_outline_tree.py`** | `tree_seek` | JSON 노이즈 제거, 초경량 들여쓰기 텍스트 스트리밍, 상향(up)/하향(down) 트리 탐색, 텍스트 검색 필터 |
| **`02_patch_outline_tree.py`** | `tree_patch` | 원자적 트랜잭션 기반 노드 수정, 삽입, 서브트리 이동(move/under), 재귀 삭제, 12자리 난수 ID 자동 채번 |
| **`03_lease_guard.py`** | `lease_*` | 작업 임대(Lease) 및 락 획득(`acquire`), 연장(`touch`), 반환(`release`), 사전 점검(`inspect`)으로 실시간 덮어쓰기 유실 방지 |
| **`04_manage_attachments.py`** | `attachments_*` | 이미지/파일을 볼트 에셋 저장소에 자동 복사하고 노드에 바인딩(`attach`), 첨부파일 로컬 캐시 추출(`pull`) |

---

## 💻 빠른 실행 예시 (CLI Usage)

### 1. 트리 탐색 (`01_seek_outline_tree.py`)
```bash
# 전체 트리를 1단계 자식까지만 초경량 텍스트로 조회 (토큰 90% 절약)
python .agents/tools/obsidian/outliner/01_seek_outline_tree.py "경로/파일.outline" --depth 1

# 특정 노드 하위 트리만 텍스트 검색
python .agents/tools/obsidian/outliner/01_seek_outline_tree.py "경로/파일.outline" --node-id "4iTYevj4kiUh" --query "결함"

# 특정 노드의 상위 부모/조상 족보 역방향 추적 (direction up)
python .agents/tools/obsidian/outliner/01_seek_outline_tree.py "경로/파일.outline" --node-id "4iTYevj4kiUh" --direction up
```

### 2. 원자적 트리 편집 (`02_patch_outline_tree.py`)
```bash
# 노드 텍스트 및 메모 수정
python .agents/tools/obsidian/outliner/02_patch_outline_tree.py "경로/파일.outline" --replace "node_id:새로운 텍스트" --note "설명 메모"

# 특정 노드 바로 뒤에 새 노드 생성
python .agents/tools/obsidian/outliner/02_patch_outline_tree.py "경로/파일.outline" --insert "target_id:추가할 문장" --position after

# 특정 노드의 자식으로 삽입 (inside)
python .agents/tools/obsidian/outliner/02_patch_outline_tree.py "경로/파일.outline" --insert "parent_id:자식 노드 문장" --position inside

# ⭐️ 서브트리 한 depth 이동 / 부모 변경 (move & under)
python .agents/tools/obsidian/outliner/02_patch_outline_tree.py "경로/파일.outline" --move "source_node_id:new_parent_id"

# 노드 및 자손 재귀 삭제
python .agents/tools/obsidian/outliner/02_patch_outline_tree.py "경로/파일.outline" --delete "node_id"
```

### 3. 동시성 락 가드 (`03_lease_guard.py`)
```bash
# 작업 전 60초 락 획득
python .agents/tools/obsidian/outliner/03_lease_guard.py "경로/파일.outline" acquire --ttl 60

# 작업 종료 즉시 락 반환
python .agents/tools/obsidian/outliner/03_lease_guard.py "경로/파일.outline" release --token "<획득토큰UUID>"

# 현재 락 상태 사전 점검
python .agents/tools/obsidian/outliner/03_lease_guard.py "경로/파일.outline" inspect
```

### 4. 미디어 첨부파일 관리 (`04_manage_attachments.py`)
```bash
# 특정 노드에 이미지 파일 첨부 (볼트 에셋 폴더 자동 복사 및 바인딩)
python .agents/tools/obsidian/outliner/04_manage_attachments.py "경로/파일.outline" attach --node-id "node_id" --file "로컬/이미지.png"

# 노드에 첨부된 이미지 물리 경로 추출 (Vision LLM 분석용)
python .agents/tools/obsidian/outliner/04_manage_attachments.py "경로/파일.outline" pull --node-id "node_id"
```
