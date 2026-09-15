/**
 * @fileoverview FloatingElementRecipeChip (Contextual Chip UI)
 * 
 * 캔버스에서 특정 element(와이어프레임 슬롯, 참조 문서 세그먼트 등)를 클릭했을 때
 * 해당 요소 바로 위에 플로팅되어 저작 규격 상의 역할(Role), 지침(Directive),
 * 그리고 우측 속성 패널(RecipePropertySidebar)로의 원클릭 진입을 제공하는 모던 칩 UI입니다.
 */

import { useEffect, useState, useMemo, useCallback } from 'react';
import { Tag, Sparkles, Sliders, X, Box, FileText, CheckCircle2 } from 'lucide-react';

import { useActiveElementStore, useCanvasSettings } from '@/shared/model';
import { useActiveRecipeProperty } from '../model/useActiveRecipeProperty';

export function FloatingElementRecipeChip() {
  const selectElement = useActiveElementStore((s) => s.selectElement);
  const showRecipeInspector = useCanvasSettings((s) => s.showRecipeInspector);
  const setShowRecipeInspector = useCanvasSettings((s) => s.setShowRecipeInspector);

  const {
    selectedElement,
    mappedBlock,
    recipe,
  } = useActiveRecipeProperty();

  const [position, setPosition] = useState<{ x: number; y: number; isFlipped: boolean } | null>(null);

  // 1. 카드가 아닌 '개별 element' (슬롯, 세그먼트, 아웃라인 필드/테이블/섹션 등)가 선택되었는지 판별
  // 설정에서 '저작 규격 패널 보기(showRecipeInspector)'가 켜져 있을 때 연동 작동
  const isElementSelected = useMemo(() => {
    if (!showRecipeInspector) return false;
    if (!selectedElement) return false;
    const t = selectedElement.type;
    return t !== 'scaffold_card' && t !== 'document_card';
  }, [showRecipeInspector, selectedElement]);

  // 2. 화면 위치 계산 (anchorPos 기반 및 뷰포트 바운드 처리)
  useEffect(() => {
    if (!isElementSelected || !selectedElement) {
      setPosition(null);
      return;
    }

    const rightMargin = showRecipeInspector ? 420 : 180;

    const anchor = selectedElement.anchorPos;
    if (anchor) {
      const isFlipped = anchor.clientY < 75;
      const x = Math.max(180, Math.min(window.innerWidth - rightMargin, anchor.clientX));
      const y = isFlipped
        ? Math.min(window.innerHeight - 60, anchor.clientY + 28)
        : Math.max(70, anchor.clientY - 12);
      setPosition({ x, y, isFlipped });
      return;
    }

    // anchorPos가 없을 때 DOM fallback 검색
    const targetEl =
      document.querySelector(`[data-element-id="${selectedElement.id}"]`) ||
      document.querySelector(`[data-slot-id="${selectedElement.id}"]`) ||
      (selectedElement.slotNumber !== undefined &&
        document.querySelector(`[data-mapping-num="${selectedElement.slotNumber}"]`)) ||
      document.querySelector(`[data-segment-id="${selectedElement.id}"]`);

    if (targetEl) {
      const rect = targetEl.getBoundingClientRect();
      const isFlipped = rect.top < 75;
      const x = Math.max(180, Math.min(window.innerWidth - rightMargin, rect.left + rect.width / 2));
      const y = isFlipped
        ? Math.min(window.innerHeight - 60, rect.bottom + 12)
        : Math.max(70, rect.top - 12);
      setPosition({ x, y, isFlipped });
      return;
    }

    // 기본 위치: 캔버스 작업 공간 중앙 상단
    const defaultX = Math.max(200, (window.innerWidth - (showRecipeInspector ? 384 : 0)) / 2);
    setPosition({
      x: defaultX,
      y: 90,
      isFlipped: false,
    });
  }, [isElementSelected, selectedElement, showRecipeInspector]);

  const handleOpenPropertySidebar = useCallback(() => {
    setShowRecipeInspector(true);
  }, [setShowRecipeInspector]);

  const handleClose = useCallback(() => {
    selectElement(null);
  }, [selectElement]);

  if (!isElementSelected || !selectedElement || !position) {
    return null;
  }

  // 저작 역할 및 지침 텍스트 도출
  const authoringRole = mappedBlock
    ? String(mappedBlock.authoringRole || mappedBlock.role || '저작 블록')
    : recipe
    ? '저작 규격 매핑됨'
    : '저작 역할 미지정';

  const directive = mappedBlock?.directive
    ? String(mappedBlock.directive)
    : selectedElement.purpose || null;

  const repeatPolicy = mappedBlock?.repeatPolicy ? String(mappedBlock.repeatPolicy) : null;

  const isSlot = selectedElement.type === 'wireframe_slot';
  const isSegment = selectedElement.type === 'document_segment';

  return (
    <div
      style={{
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: position.isFlipped
          ? 'translate(-50%, 0)'
          : 'translate(-50%, -100%)',
      }}
      className="z-50 pointer-events-auto animate-in fade-in zoom-in-95 duration-150"
    >
      <div className="flex items-center gap-1.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/90 dark:border-slate-700/90 shadow-xl rounded-xl px-2.5 py-1.5 ring-1 ring-black/5 dark:ring-white/10 text-xs text-slate-800 dark:text-slate-100">
        {/* 1. 슬롯/세그먼트 식별 배지 */}
        <span
          className={`flex items-center gap-1 font-semibold px-2 py-0.5 rounded-lg text-[11px] shrink-0 border ${
            isSlot
              ? 'bg-indigo-50 text-indigo-700 border-indigo-200/80 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800'
              : isSegment
              ? 'bg-violet-50 text-violet-700 border-violet-200/80 dark:bg-violet-950/60 dark:text-violet-300 dark:border-violet-800'
              : 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
          }`}
        >
          {isSlot ? (
            <Tag className="w-3 h-3 text-indigo-500" />
          ) : isSegment ? (
            <Box className="w-3 h-3 text-violet-500" />
          ) : (
            <FileText className="w-3 h-3 text-slate-500" />
          )}
          <span>{selectedElement.label}</span>
        </span>

        {/* 2. 저작 규격 역할 (Authoring Role) 칩 */}
        <span
          className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-200 bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded-lg text-[11px] max-w-[190px] truncate"
          title={`저작 역할: ${authoringRole}`}
        >
          <Sparkles className="w-3 h-3 text-purple-500 shrink-0" />
          <span className="text-slate-400 text-[10px] shrink-0">역할</span>
          <span className="font-semibold truncate">{authoringRole}</span>
        </span>

        {/* 3. 반복 정책 / 지침 칩 */}
        {repeatPolicy && (
          <span className="hidden sm:inline-flex items-center gap-1 text-[10px] text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-1.5 py-0.5 rounded font-medium">
            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500" />
            {repeatPolicy}
          </span>
        )}

        {directive && !repeatPolicy && (
          <span
            className="hidden sm:inline-block text-[10px] text-slate-500 dark:text-slate-400 max-w-[120px] truncate px-1"
            title={directive}
          >
            {directive}
          </span>
        )}

        <div className="h-3.5 w-px bg-slate-200 dark:bg-slate-700 mx-0.5" />

        {/* 4. 빠른 액션: 우측 속성 패널 열기 (WinForm style sidebar) */}
        <button
          onClick={handleOpenPropertySidebar}
          className="flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-200 hover:bg-indigo-50/80 dark:hover:bg-indigo-950/50 px-2 py-1 rounded-lg transition-colors cursor-pointer shrink-0"
          title="우측 저작 규격 속성창 열기"
        >
          <Sliders className="w-3 h-3" />
          <span>속성창</span>
        </button>

        {/* 5. 닫기 버튼 */}
        <button
          onClick={handleClose}
          className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors cursor-pointer shrink-0"
          title="플로팅 칩 닫기"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
