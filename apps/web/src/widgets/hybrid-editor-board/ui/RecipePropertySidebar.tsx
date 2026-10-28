/**
 * @fileoverview RecipePropertySidebar component.
 *
 * Provides a WinForm / Webflow style contextual property inspector sidebar.
 * Outputs properties dynamically based on the selected component and element,
 * strictly following Origin UI design system aesthetics and the Google TypeScript
 * Style Guide.
 */

import { useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Component,
  FileCode,
  FileText,
  Hash,
  Layers,
  Layout,
  Loader2,
  Maximize2,
  MousePointerClick,
  RefreshCw,
  Save,
  ShieldCheck,
  Sliders,
  Sparkles,
  Tag,
  X,
} from 'lucide-react';

import { useActiveRecipeProperty } from '../model/useActiveRecipeProperty';

interface RecipePropertySidebarProps {
  onClose: () => void;
}

export function RecipePropertySidebar({ onClose }: RecipePropertySidebarProps) {
  const {
    activeNode,
    isReferenceDoc,
    isScaffoldDoc,
    docTitle,
    selectedElement,
    mappedBlock,
    recipe,
    missing,
    isReady,
    isLoading,
    isRunning,
    isSaving,
    statusMessage,
    refresh,
    startDistill,
    saveRole,
  } = useActiveRecipeProperty();

  // 역할 텍스트 인라인 수정 상태
  const [roleInput, setRoleInput] = useState<string | null>(null);

  // 접이식 섹션 상태
  const [isCouplingOpen, setIsCouplingOpen] = useState(false);
  const [isRubricOpen, setIsRubricOpen] = useState(false);
  const [isRawMatrixOpen, setIsRawMatrixOpen] = useState(false);

  // Recipe 블록 목록
  const blocks = Array.isArray(recipe?.spec?.blocks)
    ? (recipe.spec.blocks as Array<Record<string, unknown>>)
    : [];

  // 선택된 엘리먼트에 매핑된 블록이 있으면 그 블록을 우선, 없으면 첫 번째 블록
  const activeBlock = mappedBlock ?? blocks[0] ?? null;

  const handleSaveRole = async () => {
    if (!activeBlock || !activeBlock.id) return;
    const currentRole = typeof activeBlock.role === 'string' ? activeBlock.role : '';
    const newRole = roleInput !== null ? roleInput : currentRole;
    await saveRole(String(activeBlock.id), newRole);
    setRoleInput(null);
  };

  return (
    <aside
      className="nodrag nopan flex-shrink-0 w-88 lg:w-96 h-full bg-white text-slate-800 border-l border-slate-200 flex flex-col z-30 shadow-xl overflow-hidden font-sans select-none animate-in slide-in-from-right duration-200"
      data-testid="recipe-property-sidebar"
    >
      {/* 1. 패널 헤더 (Origin UI Header Style) */}
      <div className="h-13 px-4 border-b border-slate-200 bg-white flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-900 tracking-tight">
                속성 인스펙터
              </span>
              <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1 py-0.5 rounded">
                PROPERTIES
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => void refresh()}
            disabled={isLoading || isRunning}
            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-40"
            title="새로고침"
            type="button"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            title="속성 패널 닫기"
            type="button"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. 대상 노드 컨텍스트 헤더 */}
      <div className="px-4 py-2.5 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between text-xs flex-shrink-0">
        <div className="flex items-center gap-2 truncate max-w-[230px]">
          <span className="text-slate-400 text-[11px] font-medium">선택 대상:</span>
          <span className="text-slate-900 font-semibold truncate text-[11px]" title={docTitle}>
            {selectedElement?.label || docTitle}
          </span>
        </div>
        <span
          className={`px-2 py-0.5 rounded-md text-[10px] font-medium border flex-shrink-0 ${
            selectedElement?.type === 'wireframe_slot'
              ? 'bg-purple-50 text-purple-700 border-purple-200'
              : selectedElement?.type === 'document_segment'
              ? 'bg-amber-50 text-amber-700 border-amber-200'
              : selectedElement?.type === 'scaffold_card' || isScaffoldDoc
              ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
              : selectedElement?.type === 'document_card' || isReferenceDoc
              ? 'bg-blue-50 text-blue-700 border-blue-200'
              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
          }`}
        >
          {selectedElement?.type === 'wireframe_slot'
            ? '슬롯'
            : selectedElement?.type === 'document_segment'
            ? '세그먼트'
            : selectedElement?.type === 'scaffold_card' || isScaffoldDoc
            ? '와이어프레임'
            : selectedElement?.type === 'document_card' || isReferenceDoc
            ? '참조 문서'
            : '요소'}
        </span>
      </div>

      {/* 상태 메시지 토스트 배너 */}
      {statusMessage && (
        <div className="px-4 py-2 bg-purple-50 border-b border-purple-100 text-[11px] text-purple-800 flex items-center justify-between">
          <span className="truncate">{statusMessage}</span>
          <button
            onClick={() => {}}
            className="text-purple-600 hover:text-purple-800 text-xs ml-2 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* 3. 본문 스크롤 영역 (WinForm Property Grid Style) */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs select-text bg-slate-50/30">
        {/* CASE A: 아무 노드나 요소도 선택되지 않은 경우 */}
        {!activeNode && !selectedElement && (
          <div className="h-64 flex flex-col items-center justify-center text-center p-6 border border-dashed border-slate-200 rounded-xl bg-white shadow-2xs">
            <div className="p-3 rounded-full bg-slate-100 text-slate-400 mb-3">
              <MousePointerClick className="w-6 h-6" />
            </div>
            <p className="font-semibold text-slate-800 text-xs mb-1">
              컴포넌트 또는 요소를 선택하세요
            </p>
            <p className="text-slate-500 text-[11px] leading-relaxed max-w-[230px]">
              캔버스에서 카드나 아웃라인, 세그먼트, 슬롯 항목을 클릭하면 WinForm 속성창처럼 해당 요소의 세부 속성이 여기에 출력됩니다.
            </p>
          </div>
        )}

        {/* CASE B: 선택된 세부 대상(요소/슬롯/세그먼트/카드)이 있는 경우: WinForm Property Grid! */}
        {selectedElement && (
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs">
            {/* 섹션 헤더 */}
            <div className="px-3.5 py-2.5 bg-slate-100/70 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-slate-800 font-bold text-xs">
                <Component className="w-3.5 h-3.5 text-purple-600" />
                <span>
                  {selectedElement.type === 'wireframe_slot'
                    ? '선택된 슬롯 속성 (Slot Property Grid)'
                    : selectedElement.type === 'document_segment'
                    ? '선택된 세그먼트 속성 (Segment Property Grid)'
                    : selectedElement.type === 'scaffold_card'
                    ? '와이어프레임 서식 속성 (Scaffold Property Grid)'
                    : selectedElement.type === 'document_card'
                    ? '참조 문서 속성 (Document Property Grid)'
                    : '선택된 요소 속성 (Element Property Grid)'}
                </span>
              </div>
              <span className="text-[10px] font-mono text-purple-700 bg-purple-50 border border-purple-200 px-1.5 py-0.5 rounded">
                {selectedElement.type}
              </span>
            </div>

            {/* WinForm 2열 프로퍼티 그리드 테이블 */}
            <div className="divide-y divide-slate-100 text-[11px]">
              <div className="grid grid-cols-3 px-3.5 py-2">
                <span className="text-slate-500 font-medium flex items-center gap-1">
                  <Tag className="w-3 h-3 text-slate-400" /> Name (Label)
                </span>
                <span className="col-span-2 font-bold text-slate-900 truncate" title={selectedElement.label}>
                  {selectedElement.label || '미지정'}
                </span>
              </div>

              <div className="grid grid-cols-3 px-3.5 py-2">
                <span className="text-slate-500 font-medium flex items-center gap-1">
                  <Hash className="w-3 h-3 text-slate-400" /> ID
                </span>
                <span className="col-span-2 font-mono text-slate-700 truncate" title={selectedElement.id}>
                  {selectedElement.id}
                </span>
              </div>

              {selectedElement.slotNumber !== undefined && (
                <div className="grid grid-cols-3 px-3.5 py-2">
                  <span className="text-slate-500 font-medium flex items-center gap-1">
                    <Hash className="w-3 h-3 text-slate-400" /> Slot No.
                  </span>
                  <span className="col-span-2 font-semibold text-purple-700">
                    슬롯 #{selectedElement.slotNumber}
                  </span>
                </div>
              )}

              {selectedElement.segmentType && (
                <div className="grid grid-cols-3 px-3.5 py-2">
                  <span className="text-slate-500 font-medium flex items-center gap-1">
                    <Layers className="w-3 h-3 text-slate-400" /> Block Type
                  </span>
                  <span className="col-span-2 font-medium text-amber-800 capitalize">
                    {selectedElement.segmentType}
                  </span>
                </div>
              )}

              {selectedElement.page !== undefined && (
                <div className="grid grid-cols-3 px-3.5 py-2">
                  <span className="text-slate-500 font-medium flex items-center gap-1">
                    <Layout className="w-3 h-3 text-slate-400" /> Page
                  </span>
                  <span className="col-span-2 font-medium text-slate-800">
                    Page {selectedElement.page}
                  </span>
                </div>
              )}

              {selectedElement.totalPages !== undefined && (
                <div className="grid grid-cols-3 px-3.5 py-2">
                  <span className="text-slate-500 font-medium flex items-center gap-1">
                    <Layout className="w-3 h-3 text-slate-400" /> Total Pages
                  </span>
                  <span className="col-span-2 font-medium text-slate-800">
                    전체 {selectedElement.totalPages}페이지
                  </span>
                </div>
              )}

              {selectedElement.slotsCount !== undefined && (
                <div className="grid grid-cols-3 px-3.5 py-2">
                  <span className="text-slate-500 font-medium flex items-center gap-1">
                    <Sliders className="w-3 h-3 text-slate-400" /> Slots Count
                  </span>
                  <span className="col-span-2 font-semibold text-purple-700">
                    {selectedElement.slotsCount}개
                  </span>
                </div>
              )}

              {selectedElement.difficulty && (
                <div className="grid grid-cols-3 px-3.5 py-2">
                  <span className="text-slate-500 font-medium flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-slate-400" /> Difficulty
                  </span>
                  <span className="col-span-2 font-mono text-[10px] uppercase font-semibold text-slate-700">
                    {selectedElement.difficulty}
                  </span>
                </div>
              )}

              {selectedElement.sourceFile && (
                <div className="grid grid-cols-3 px-3.5 py-2">
                  <span className="text-slate-500 font-medium flex items-center gap-1">
                    <FileText className="w-3 h-3 text-slate-400" /> Source File
                  </span>
                  <span className="col-span-2 text-slate-800 truncate" title={selectedElement.sourceFile}>
                    {selectedElement.sourceFile}
                  </span>
                </div>
              )}

              {selectedElement.box_2d && (
                <div className="grid grid-cols-3 px-3.5 py-2">
                  <span className="text-slate-500 font-medium flex items-center gap-1">
                    <Maximize2 className="w-3 h-3 text-slate-400" /> Bounds (2D)
                  </span>
                  <span className="col-span-2 font-mono text-[10px] text-slate-600">
                    [{selectedElement.box_2d.join(', ')}]
                  </span>
                </div>
              )}

              {selectedElement.content_summary && (
                <div className="grid grid-cols-3 px-3.5 py-2">
                  <span className="text-slate-500 font-medium">Summary</span>
                  <span className="col-span-2 text-slate-700 line-clamp-3 leading-relaxed">
                    {selectedElement.content_summary}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* CASE C: Recipe가 존재하는 경우 (Authoring Role, Blocks, Rubrics) */}
        {recipe && (
          <div className="space-y-4">
            {/* 1. Recipe Meta Bar */}
            <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-xs truncate max-w-[190px]">
                  {recipe.title}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-md text-[10px] font-medium border ${
                    recipe.provenance.origin === 'llm'
                      ? 'bg-purple-50 text-purple-700 border-purple-200'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}
                >
                  {recipe.provenance.origin === 'llm' ? 'AI 추출 완료' : '수동 편집'}
                </span>
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono pt-1 border-t border-slate-100">
                <span>Rev: {recipe.provenance.revisionId.slice(0, 8)}</span>
                <span>{new Date(recipe.provenance.createdAt).toLocaleDateString()}</span>
              </div>
            </div>

            {/* 2. 블록 저작 역할 및 규격 속성창 (Property Editor) */}
            {activeBlock && (
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-purple-600" />
                    저작 블록: {String(activeBlock.name || activeBlock.id)}
                  </span>
                  {selectedElement && (
                    <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded font-semibold">
                      매핑됨
                    </span>
                  )}
                </div>

                {/* A. 역할(Role) 인라인 수정 필드 */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="authoring-role-input" className="text-xs font-semibold text-slate-700">
                      저작 역할 (Authoring Role)
                    </label>
                    <span className="text-[10px] text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-100 font-mono">
                      Editable
                    </span>
                  </div>
                  <textarea
                    id="authoring-role-input"
                    className="w-full min-h-[76px] rounded-lg border border-slate-200 bg-slate-50/40 p-2.5 text-xs leading-relaxed text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all resize-y font-sans shadow-2xs"
                    value={
                      roleInput !== null
                        ? roleInput
                        : typeof activeBlock.role === 'string'
                        ? activeBlock.role
                        : ''
                    }
                    onChange={(e) => setRoleInput(e.target.value)}
                    placeholder="이 요소/블록의 저작 의도 및 역할을 입력하세요..."
                  />
                </div>

                {/* B. Repeat Policy & Required */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-400 block mb-0.5 font-medium">
                      Repeat Policy
                    </span>
                    <span className="font-semibold text-slate-800">
                      {String(activeBlock.repeatPolicy ?? '단일 (single)')}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-400 block mb-0.5 font-medium">
                      필수 여부 (Required)
                    </span>
                    <span className="font-semibold text-slate-800">
                      {activeBlock.required ? '필수 항목 (True)' : '선택 항목 (False)'}
                    </span>
                  </div>
                </div>

                {/* C. 새 Revision 저장 버튼 */}
                <button
                  onClick={() => void handleSaveRole()}
                  disabled={isSaving}
                  className="w-full py-2 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium flex items-center justify-center gap-1.5 transition-all shadow-xs disabled:opacity-50"
                  type="button"
                >
                  {isSaving ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  <span>새 Revision으로 저장</span>
                </button>
              </div>
            )}

            {/* 3. 결합 규칙 (Coupling Rules) */}
            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
              <button
                onClick={() => setIsCouplingOpen(!isCouplingOpen)}
                className="w-full px-3.5 py-2.5 flex items-center justify-between text-xs font-semibold text-slate-700 bg-slate-50/60 hover:bg-slate-100/70 transition-colors"
                type="button"
              >
                <span className="flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5 text-purple-600" />
                  결합 규칙 (Coupling Rules)
                </span>
                {isCouplingOpen ? (
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                )}
              </button>
              {isCouplingOpen && (
                <div className="p-3.5 border-t border-slate-100 space-y-1.5 text-xs text-slate-600 bg-white">
                  {Array.isArray(recipe.spec?.couplingRules) &&
                  recipe.spec.couplingRules.length > 0 ? (
                    <ul className="list-disc list-inside space-y-1">
                      {recipe.spec.couplingRules.map((rule, idx) => (
                        <li key={idx} className="leading-relaxed">
                          {typeof rule === 'string' ? rule : JSON.stringify(rule)}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-slate-400">등록된 결합 규칙이 없습니다.</p>
                  )}
                </div>
              )}
            </div>

            {/* 4. 검증 루브릭 (Validation Rubric) */}
            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
              <button
                onClick={() => setIsRubricOpen(!isRubricOpen)}
                className="w-full px-3.5 py-2.5 flex items-center justify-between text-xs font-semibold text-slate-700 bg-slate-50/60 hover:bg-slate-100/70 transition-colors"
                type="button"
              >
                <span className="flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  검증 루브릭 (Validation Rubric)
                </span>
                {isRubricOpen ? (
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                )}
              </button>
              {isRubricOpen && (
                <div className="p-3.5 border-t border-slate-100 space-y-1.5 text-xs text-slate-600 bg-white">
                  {recipe.spec?.validationRubric &&
                  typeof recipe.spec.validationRubric === 'object' ? (
                    <div className="space-y-2">
                      {Object.entries(recipe.spec.validationRubric as Record<string, unknown>).map(
                        ([key, val]) => (
                          <div key={key} className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                            <span className="font-bold text-slate-800 text-[11px] block capitalize mb-0.5">
                              {key}
                            </span>
                            <span className="text-[11px] text-slate-600 leading-relaxed block">
                              {typeof val === 'string' ? val : JSON.stringify(val)}
                            </span>
                          </div>
                        ),
                      )}
                    </div>
                  ) : (
                    <p className="text-slate-400">등록된 검증 루브릭이 없습니다.</p>
                  )}
                </div>
              )}
            </div>

            {/* 5. 전체 스펙 JSON (Raw Matrix View) */}
            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
              <button
                onClick={() => setIsRawMatrixOpen(!isRawMatrixOpen)}
                className="w-full px-3.5 py-2 flex items-center justify-between text-xs font-medium text-slate-500 hover:bg-slate-50 transition-colors"
                type="button"
              >
                <span className="flex items-center gap-2">
                  <FileCode className="w-3.5 h-3.5 text-slate-400" />
                  전체 Recipe Spec (JSON)
                </span>
                {isRawMatrixOpen ? (
                  <ChevronDown className="w-3.5 h-3.5" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5" />
                )}
              </button>
              {isRawMatrixOpen && (
                <div className="p-3 border-t border-slate-100 bg-slate-50">
                  <pre className="text-[10px] text-slate-600 whitespace-pre-wrap font-mono leading-relaxed max-h-48 overflow-y-auto">
                    {JSON.stringify(recipe.spec, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}

        {/* CASE D: 선택된 참조 문서가 있고, Recipe가 아직 없는 경우에만 추출 버튼 노출 */}
        {activeNode && isReferenceDoc && !recipe && (
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3.5">
              <div className="flex items-center gap-2 text-amber-700 bg-amber-50/80 p-2.5 rounded-lg border border-amber-200/60">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-amber-600" />
                <span className="font-semibold text-xs">저작 규격이 아직 없습니다</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                선택한 문서의 분석 산출물을 종합하여 AI 에이전트가 블록별 저작 역할, 작성 기법, 루브릭을 추출할 수 있습니다.
              </p>

              {/* 4대 선행 조건 체크리스트 */}
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  추출 사전 요구조건
                </p>
                <div className="space-y-1.5 text-[11px]">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-slate-700 flex items-center gap-2 font-medium">
                      <FileText className="w-3.5 h-3.5 text-slate-400" />
                      원본 문서
                    </span>
                    <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> 준비됨
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-slate-700 flex items-center gap-2 font-medium">
                      <Layers className="w-3.5 h-3.5 text-slate-400" />
                      세그먼트
                    </span>
                    {!missing.includes('세그먼트') ? (
                      <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> 준비됨
                      </span>
                    ) : (
                      <span className="text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full text-[10px] font-semibold">
                        미추출
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-slate-700 flex items-center gap-2 font-medium">
                      <FileCode className="w-3.5 h-3.5 text-slate-400" />
                      아웃라인
                    </span>
                    {!missing.includes('아웃라인') ? (
                      <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> 준비됨
                      </span>
                    ) : (
                      <span className="text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full text-[10px] font-semibold">
                        미추출
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-slate-700 flex items-center gap-2 font-medium">
                      <Sliders className="w-3.5 h-3.5 text-slate-400" />
                      와이어프레임
                    </span>
                    {!missing.includes('와이어프레임') ? (
                      <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> 준비됨
                      </span>
                    ) : (
                      <span className="text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full text-[10px] font-semibold">
                        미생성
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* 초안 추출 액션 버튼 */}
              <button
                onClick={() => void startDistill()}
                disabled={!isReady || isRunning}
                className={`w-full mt-3 py-2.5 px-4 rounded-lg font-medium text-xs flex items-center justify-center gap-2 transition-all shadow-xs ${
                  isReady && !isRunning
                    ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-purple-600/20 active:scale-[0.99]'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                }`}
                type="button"
              >
                {isRunning ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>저작 규격 추출 중...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-purple-200" />
                    <span>저작 규격 초안 추출</span>
                  </>
                )}
              </button>

              {!isReady && (
                <p className="text-[10px] text-amber-600 text-center font-medium">
                  필수 누락: {missing.join(', ')}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
