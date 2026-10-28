# [Patch Note] 스크리브너식 바인더 패널 교체 및 Outline-Segment-Wireframe 실데이터 3자 연동

* **기록 일시**: 2026-09-17 16:35:00
* **문서 경로**: `workbench/03.patch_note/2026-09-17/patch_note_scrivener_binder_outline_segment_wireframe_integration.md`
* **대상 컴포넌트**: [`IdeBinderSidebar.tsx`](file:///c:/AI_Projects/WebNovelAssistant/VibePatchNote/apps/web/src/widgets/editor-lab-workspace/ui/IdeBinderSidebar.tsx), [`EditorLabWorkspace.tsx`](file:///c:/AI_Projects/WebNovelAssistant/VibePatchNote/apps/web/src/widgets/editor-lab-workspace/ui/EditorLabWorkspace.tsx), [`useIdeWorkspaceState.ts`](file:///c:/AI_Projects/WebNovelAssistant/VibePatchNote/apps/web/src/widgets/editor-lab-workspace/model/useIdeWorkspaceState.ts)
* **선행 패치**: [`patch_note_heptabase_style_a4_document_viewer.md`](file:///c:/AI_Projects/WebNovelAssistant/VibePatchNote/workbench/03.patch_note/2026-09-17/patch_note_heptabase_style_a4_document_viewer.md)

---

## 📥 1. 사용자 요청 내용 (User Request & Assets)

### 💬 사용자 요청 원문 (1차 & 2차)
> **[1차 요청]**  
> packages 를 우선적으로 활용한다는 점만 다시 한 번 숙지를 하고 지금은 binder 파트를 손볼 차례야.  
> 먼저, 사양부터 아이데이션해보자. 저쪽 binder 는 스크리브너에서 따온거야. 즉, 저쪽은 현재 작업물의 아웃라이너 이면서 동시에 조합 형태가 되어야하지.  
> 자 현재 data 쪽 내용을 봐봐 그 중에서도 wireframe, segment, outline 을 집중해서 봐봐. 한 문서를 기준으로 이미 쪼개놨어. 방금 니가 얘기한 스크리브너의 핵심 컨셉과 결합시켜서 내가 무슨 얘기를 한건지 파악해봐.  
> 오케이 좋았어! 잘 파악했어! 그러면 한 번 왼쪽 사이드 패널을 교체해봐.

> **[2차 요청 (수정 지시)]**  
> 1) 실제 데이터를 불러온 것 맞나? 내용이 안맞는데  
> 2) 세그먼트만 있는게 아니라 하위 element 들도 있을텐데  
> 3) wireframe 마찬가지 트리구조 일텐데  
> 그리고 왜 다들 전체적으로 매핑 정보가 표시가 안되지? wireframe의 매핑 표시 정보가 없나?  
> @[workbench_40_patch_note_generator] 이전 내용이랑 같이 패치 노트에 내용 작성해줘

### 🖼️ 사용자 제공 에셋 및 스크린샷 (User Attachments)
- **첨부 1 (목차 아웃라인 내 하위 세부 엘리먼트 누락 문제)**:  
  ![목차 아웃라인 하위 엘리먼트 누락 화면](file:///C:/Users/knee2/.gemini/antigravity-ide/brain/cfab6867-67f7-4436-98e7-e4902050f73b/.user_uploaded/media_1789630246409.png)  
  *(사용자가 빨간색 사각 박스와 물음표 `?`로 지적한 부분: `1차 회의비 사용 내역 (P.1)` 하위에 `일시`, `장소`, `참석자`, `안건`, `회의내용`, `지출금액` 등 실제 서식의 행(Row) 단위 세부 항목들이 누락되어 있었던 현상)*
- **첨부 2 (세그먼트 뷰 내 매핑 태그 부재 및 증빙 체크 누락)**:  
  ![세그먼트 뷰 매핑 태그 부재 화면](file:///C:/Users/knee2/.gemini/antigravity-ide/brain/cfab6867-67f7-4436-98e7-e4902050f73b/.user_uploaded/media_1789630287903.png)  
  *(사용자가 빨간 체크 표시 `V`로 지적한 부분: 각 세그먼트 블록이 어떤 아웃라인 엘리먼트 및 와이어프레임 슬롯과 연결되어 있는지에 대한 상호 매핑 정보가 시각적으로 표시되지 않던 문제)*

---

## 🛠️ 2. Agent 수행 내용 요약 (Execution Summary)

### 🔍 1) 원인 및 현상 분석 (Root Cause Analysis)
1. **백엔드 정본 파이프라인 미호출 및 하드코딩된 목업 데이터**:  
   초기 교체 작업 시 백엔드 엔티티 API(`useSegmentStructure(docId)`)를 통한 실제 `outlineElements`, `segments`, `mappings` 조회를 생략하고 정적 데이터셋을 바인딩하여, 실제 문서의 세부 내용과 불일치 발생.
2. **아웃라인 계층의 단락별 Element 트리 누락**:  
   백엔드 `elements.json` 및 `tree.json`에는 각 페이지별로 `elem-p1-1`(일시), `elem-p1-2`(장소), `elem-p1-3`(참석자), `elem-p1-4`(안건), `elem-p1-5`(회의내용), `elem-p1-6`(지출금액), `elem-p1-7`(증빙자료) 등의 구체적 리프 노드가 정밀하게 정의되어 있으나, UI에서는 폴더 레벨 2개로 뭉뚱그려 표시됨.
3. **와이어프레임 계층 구조 및 3자 교차 매핑(Cross-mapping) 배지 부재**:  
   와이어프레임 역시 단순 플랫 14개 목록이 아닌 `Page 1` ➔ `테이블 슬롯 그룹(#1~#6)` + `증빙 첨부(#7)`의 컨테이너 트리 구조여야 하며, `Outline ↔ Segment ↔ Wireframe Slot` 간의 상호 참조 태그가 누락되어 있었음.

### 💻 2) 핵심 코드 및 아키텍처 수정 내역 (Core Improvements)
- **[`apps/web/src/widgets/editor-lab-workspace/ui/IdeBinderSidebar.tsx`](file:///c:/AI_Projects/WebNovelAssistant/VibePatchNote/apps/web/src/widgets/editor-lab-workspace/ui/IdeBinderSidebar.tsx) [NEW & REFACTORED]**:
  - **3대 척추 스위처(SpineSwitcher)**: `목차 아웃라인`, `세그먼트`, `와이어 슬롯` 3가지 관점으로 문서를 조망하는 탭 전환 바 탑재.
  - **아웃라인 하위 세부 Elements 트리 복원**: 실제 `elements.json`의 14개 엘리먼트(`일시`, `장소`, `참석자`, `안건`, `회의내용`, `지출금액`, `증빙자료`)를 값(Value)과 함께 3단계 깊이의 트리로 100% 시각화.
  - **세그먼트 하위 매핑 블록 인라인 전개**: 8개 세그먼트 블록 하위에 해당 영역에 속한 아웃라인 엘리먼트들을 인라인 전개하고 슬롯 번호(`slotNumber`) 매핑.
  - **와이어프레임 슬롯 계층 트리**: 페이지별 슬롯 그룹(기본정보 테이블 그룹 vs 증빙자료 첨부 그룹)으로 구조화하고, 각 슬롯마다 연결된 아웃라인 엘리먼트명과 매핑 신뢰도(Confidence) 표시.
  - **선명한 교차 매핑 태그 노출**: 각 노드 옆에 `[seg-2]`, `[#1~#6]`, `[s1]`, `[elem-p1-1]` 등 3자 연결 관계를 시각적인 인디고/블루/에메랄드 배지로 명시.
  - **백엔드 실데이터 연동**: `useSegmentStructure(docId, true)`를 호출하여 백엔드 `/api/v1/segments/{docId}/structure`와 실시간 동기화.
- **[`apps/web/src/widgets/editor-lab-workspace/ui/EditorLabWorkspace.tsx`](file:///c:/AI_Projects/WebNovelAssistant/VibePatchNote/apps/web/src/widgets/editor-lab-workspace/ui/EditorLabWorkspace.tsx)**:
  - 기존의 단순 파일 탐색기(`IdePrimarySidebar`)를 제거하고 신규 `IdeBinderSidebar`로 전면 교체.
  - `handleOpenPageTab` 및 `handleOpenScrivenings` 핸들러를 바인더와 직결.
- **[`apps/web/src/widgets/editor-lab-workspace/model/useIdeWorkspaceState.ts`](file:///c:/AI_Projects/WebNovelAssistant/VibePatchNote/apps/web/src/widgets/editor-lab-workspace/model/useIdeWorkspaceState.ts)**:
  - 바인더에서 개별 페이지/슬롯 클릭 시 중앙 에디터에 단독 탭(`Page 1.canvas`, `Page 2.canvas`)을 동적 생성하여 포커스하는 `handleOpenPageTab` 추가.
  - 아웃라인 루트 또는 조합 뷰 클릭 시 전체 연속 결합 뷰(`tab-wireframe-canvas`)를 활성화하는 `handleOpenScrivenings` 추가.

### 🛡️ 3) 품질 게이트 검증 결과 (Verification Gates)
| 검증 도구 | 실행 명령어 | 검증 결과 | 상태 |
| :--- | :--- | :--- | :---: |
| **TypeScript** | `pnpm --filter @vibe/web typecheck` | 오류 0건 (`tsc -b` 통과) | ✅ 통과 |
| **Oxlint** | `pnpm --filter @vibe/web lint` | 오류 0건 (기존 경고 35건 유지) | ✅ 통과 |
| **Vite Build** | `pnpm --filter @vibe/web build` | 번들 빌드 정상 완료 (2.79s) | ✅ 통과 |

---

## 🎯 3. 수행 결과 요약 (Result Summary & Outcome)

### ✨ 1) 최종 반영 상태 (Final State)
1. **스크리브너형 아웃라이너 & 조합기 완성**: 좌측 패널이 단순 파일 목록이 아닌, 백엔드가 분석해 둔 **`Outline` ➔ `Segment` ➔ `Wireframe Slots`의 3자 결합 아웃라이너**로 완벽하게 변모함.
2. **세부 행(Row) 단위 Elements 완전 복원**: 첨부 1에서 누락되었던 표 내부의 일시, 장소, 참석자, 안건, 회의내용, 지출금액, 증빙자료 등 모든 하위 노드가 정본 데이터와 일치하게 트리에 출력됨.
3. **와이어프레임 및 세그먼트 상호 매핑 정보 상시 노출**: 첨부 2에서 지적된 매핑 정보가 각 노드 옆에 컬러 배지(`seg-2`, `elem-p1-1`, `#1~#6`)로 선명하게 표시되어 어떤 세그먼트와 슬롯이 서로 연결되어 있는지 즉시 파악 가능.
4. **스크리브닝스(Scrivenings) 연동**: 바인더 상단의 `[조합 뷰]` 클릭 시 전체 결합 에디터로 전환되며, 단위 노드 클릭 시 개별 페이지 단독 탭으로 고속 포커스 이동 지원.

### 📦 2) 추천 Git 커밋 가이드 (Conventional Commits)
```bash
git add apps/web/src/widgets/editor-lab-workspace/ui/IdeBinderSidebar.tsx apps/web/src/widgets/editor-lab-workspace/ui/EditorLabWorkspace.tsx apps/web/src/widgets/editor-lab-workspace/model/useIdeWorkspaceState.ts
git commit -m "feat(web): integrate Scrivener-style binder with authentic outline, segment, and wireframe slot cross-mappings"
```
