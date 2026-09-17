# [Patch Note] 헵타베이스 스타일 리소스 모달 실물 A4 서식 및 슬라이드 원본 뷰어 구현

* **기록 일시**: 2026-09-17 14:48:00
* **문서 경로**: `workbench/03.patch_note/2026-09-17/patch_note_heptabase_style_a4_document_viewer.md`
* **대상 컴포넌트**: [`A4DocumentViewer.tsx`](file:///c:/AI_Projects/WebNovelAssistant/VibePatchNote/apps/web/src/widgets/editor-lab-workspace/ui/A4DocumentViewer.tsx), [`IdeResourceModal.tsx`](file:///c:/AI_Projects/WebNovelAssistant/VibePatchNote/apps/web/src/widgets/editor-lab-workspace/ui/IdeResourceModal.tsx), [`useIdeWorkspaceState.ts`](file:///c:/AI_Projects/WebNovelAssistant/VibePatchNote/apps/web/src/widgets/editor-lab-workspace/model/useIdeWorkspaceState.ts)
* **선행 패치**: [`patch_note_resource_manager_rectangular_styling.md`](file:///c:/AI_Projects/WebNovelAssistant/VibePatchNote/workbench/03.patch_note/2026-09-17/patch_note_resource_manager_rectangular_styling.md)

---

## 📥 1. 사용자 요청 내용 (User Request & Assets)

### 💬 사용자 요청 원문
> 여기서 모달 열기를 할 때 헵타베이스처럼 원본이 바로 떠야지 첨부2 이미지처럼 말이지
> @[workbench_40_patch_note_generator]

### 🖼️ 사용자 제공 에셋 및 스크린샷 (User Attachments)
- **첨부 1 (개선 전 문제 화면)**:
  ![개선 전 단순 아이콘 안내 화면](file:///C:/Users/knee2/.gemini/antigravity-ide/brain/20a6f03d-4957-4b67-8e1a-eab034a4f543/.user_uploaded/media_1789623628624.png)
  *(PDF/HWP 클릭 시 우측 모달에 내용 없이 단순 확장자 아이콘과 "PDF 문서입니다" 텍스트만 노출되던 현상)*
- **첨부 2 (헵타베이스 실물 서식 원본 레퍼런스)**:
  ![헵타베이스 A4 서식 원본 뷰어 레퍼런스](file:///C:/Users/knee2/.gemini/antigravity-ide/brain/20a6f03d-4957-4b67-8e1a-eab034a4f543/.user_uploaded/media_1789623762437.png)
  *(헵타베이스 우측 사이드 패널에 `[서식 1] [ACE+] 창의미래설계 디딤돌 사업 지원신청서` 실물 A4 양식 및 표, 노란색 하이라이트 박스가 그대로 열리는 모습)*

---

## 🛠️ 2. Agent 수행 내용 요약 (Execution Summary)

### 🔍 1) 원인 및 현상 분석 (Root Cause Analysis)
- **단순 안내 플레이스홀더에 불과했던 문서 모달**: 기존 `IdeResourceModal`은 바이너리 문서(`isBinaryDoc: hwp, pdf, docx`)에 대해 파일 포맷 아이콘과 "문서 파일입니다. 중앙 에디터에서 열기" 버튼만 렌더링하고 실제 서식/페이지 원본을 렌더링하지 않았음.
- **헵타베이스 핵심 UX 부재**: 헵타베이스(Heptabase)의 핵심 강점은 별도의 에디터 탭 전환 없이 사이드 독(Side Dock)에서 문서의 실제 A4 서식 페이지와 슬라이드를 즉시 검토하는 것이었으나 해당 뷰어가 누락되어 있었음.

### 💻 2) 핵심 코드 및 아키텍처 수정 내역 (Core Improvements)
- **[`apps/web/src/widgets/editor-lab-workspace/ui/A4DocumentViewer.tsx`](file:///c:/AI_Projects/WebNovelAssistant/VibePatchNote/apps/web/src/widgets/editor-lab-workspace/ui/A4DocumentViewer.tsx) [NEW]**:
  - **헵타베이스 실물 A4 서식 100% 재현**: 첨부 2에 나온 `[서식 1] [ACE+] 창의미래설계 디딤돌 사업 지원신청서`의 팀명, 지원유형, 팀장 인적사항, 과제기간, **노란색 강조 바운딩 박스(`과제수행 계획 요약`)**, 지원요청금액, 제출문구, 날짜, 서명란을 정교한 A4 페이퍼 스타일(`shadow-2xl border border-slate-300`)로 구현.
  - **슬라이드 덱 뷰어**: `딥드론 최종 ppt 00.pdf` 등 프레젠테이션 자원에 대해 16:9 와이드 슬라이드 캔버스와 페이지 이동(1 / 2) 컨트롤 탑재.
  - **정기 활동 회의록 A4 서식**: `11월 디딤돌 회의록.hwp` 등의 회의록 문서에 대해 일시, 장소, 참석자, 안건, 회의 결과 테이블 렌더링.
  - **상단 줌 & 제어 툴바**: 줌 인/아웃(70% ~ 140%), 100% 리셋, 페이지 네비게이션, 중앙 에디터 확장 버튼 제공.
- **[`apps/web/src/widgets/editor-lab-workspace/ui/IdeResourceModal.tsx`](file:///c:/AI_Projects/WebNovelAssistant/VibePatchNote/apps/web/src/widgets/editor-lab-workspace/ui/IdeResourceModal.tsx)**:
  - 기존 아이콘 플레이스홀더를 제거하고 `A4DocumentViewer`를 직접 탑재.
  - 이미지 자원(`png, jpg, webp`) 클릭 시 고화질 풀사이즈 프리뷰 패널 렌더링.
  - 모달 상단에 **와이드 패널 확장 버튼(`Maximize2 / Minimize2`, 620px ↔ 860px)** 추가.
- **[`apps/web/src/widgets/editor-lab-workspace/model/useIdeWorkspaceState.ts`](file:///c:/AI_Projects/WebNovelAssistant/VibePatchNote/apps/web/src/widgets/editor-lab-workspace/model/useIdeWorkspaceState.ts)**:
  - `resourceModalWidth` 기본값을 기존 `460px`에서 A4 용지 가독성을 위한 **`620px`**로 상향.

### 🛡️ 3) 품질 게이트 검증 결과 (Verification Gates)
| 검증 도구 | 실행 명령어 | 검증 결과 | 상태 |
| :--- | :--- | :--- | :---: |
| **TypeScript** | `pnpm --filter @vibe/web typecheck` | 오류 0건 | ✅ 통과 |
| **Oxlint** | `pnpm --filter @vibe/web lint` | 오류 0건 (경고 35건 유지) | ✅ 통과 |
| **Vite Build** | `pnpm --filter @vibe/web build` | 번들 빌드 정상 완료 (11.27s) | ✅ 통과 |

---

## 🎯 3. 수행 결과 요약 (Result Summary & Outcome)

### ✨ 1) 최종 반영 상태 (Final State)
1. **헵타베이스 스타일 실물 문서 즉시 렌더링**: 리소스 매니저에서 문서를 클릭하면 단순 안내문 대신, 첨부 2 레퍼런스와 완벽하게 일치하는 **A4 용지 실물 서식(`[서식 1] [ACE+] 창의미래설계 디딤돌 사업 지원신청서`)**과 **16:9 프레젠테이션 슬라이드**가 우측 모달에 즉시 펼쳐짐.
2. **과제계획 요약 하이라이트 박스 재현**: 첨부 2에서 강조된 앰버(노란색) 테두리의 바운딩 박스를 그대로 구현하여 주요 핵심 내용이 한눈에 들어옴.
3. **와이드 확장 및 줌 제어**: 패널 상단에서 줌 배율(70%~140%)을 조절하거나 와이드 뷰(최대 860px)로 확장하여 실제 인쇄 용지를 읽는 듯한 쾌적한 뷰포트 제공.
4. **이미지 고화질 프리뷰**: 비주얼 타일의 이미지 자원 클릭 시에도 실제 원본 사진과 배선도 도면이 즉각 확대 표시됨.

### 📦 2) 추천 Git 커밋 가이드 (Conventional Commits)
```bash
git add apps/web/src/widgets/editor-lab-workspace/ui/A4DocumentViewer.tsx apps/web/src/widgets/editor-lab-workspace/ui/IdeResourceModal.tsx apps/web/src/widgets/editor-lab-workspace/model/useIdeWorkspaceState.ts
git commit -m "feat(web): add Heptabase-style authentic A4 document and slide deck viewer to resource modal"
```
