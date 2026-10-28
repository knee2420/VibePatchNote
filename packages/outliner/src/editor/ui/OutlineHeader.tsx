/**
 * @file OutlineHeader.tsx
 * @description 브레드크럼(Breadcrumb) + 동적 줌 HEAD 제목 + 뷰 모드 전환 버튼을 통합한 에디터 헤더 컴포넌트
 *
 * Workflowy 스타일 헤더 사양:
 * - 최상위(Root) 상태:
 *   - 브레드크럼 숨김
 *   - HEAD 제목 = 프로젝트 / 파일 제목 (rootTitle)
 *   - 제목 변경 시 onUpdateRootTitle(title) 호출
 * - 줌인(Zoomed) 상태:
 *   - HEAD 위에 조상 경로 브레드크럼(Home > ... > 현재 노드) 표시
 *   - HEAD 제목 = 현재 줌인된 불릿 노드의 text (activeNode.text)
 *   - 제목 변경 시 실시간 및 blur 시 editorStore.updateText(activeRootId, text) 호출
 * - 우측: 뷰 모드(불릿 vs 보드) 토글 버튼, 호스트가 캔버스를 열 수 있으면 캔버스 단추, 사용자 지정 액션 컨트롤
 */

import React, { useState } from 'react';
import { LayoutGrid, List, Network } from 'lucide-react';
import { OutlineBreadcrumb } from './OutlineBreadcrumb';
import { useZoom } from '../model/useZoom';
import { useOutlineView } from '../model/useOutlineView';
import { useEditorStore, useOutlineHost } from '../session/context';

interface HeadTitleFieldProps {
  initialTitle: string;
  isZoomed: boolean;
  activeRootId: string | null;
  placeholder: string;
  onUpdateRootTitle: (title: string) => void;
  updateNodeText: (nodeId: string, text: string) => void;
}

const HeadTitleField: React.FC<HeadTitleFieldProps> = ({
  initialTitle,
  isZoomed,
  activeRootId,
  placeholder,
  onUpdateRootTitle,
  updateNodeText,
}) => {
  const [draft, setDraft] = useState(initialTitle);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.target.value;
    setDraft(next);
    if (isZoomed && activeRootId) {
      updateNodeText(activeRootId, next);
    }
  };

  const handleBlur = () => {
    if (isZoomed) {
      if (activeRootId) {
        updateNodeText(activeRootId, draft);
      }
    } else {
      const trimmed = draft.trim();
      if (trimmed === '') {
        setDraft(initialTitle);
      } else if (draft !== initialTitle) {
        onUpdateRootTitle(draft);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    } else if (e.key === 'Escape') {
      setDraft(initialTitle);
      e.currentTarget.blur();
    }
  };

  return (
    <input
      type="text"
      value={draft}
      onChange={handleChange}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      className="flex-1 text-xl sm:text-2xl font-bold font-[var(--font-text-theme)] tracking-tight bg-transparent text-(--text-normal) hover:bg-(--background-modifier-hover) focus:bg-(--background-secondary) px-2 py-0.5 rounded-md border border-transparent focus:border-(--interactive-accent) focus:outline-hidden transition-all truncate min-w-0"
    />
  );
};

export interface OutlineHeaderProps {
  /** 최상위(Root) 상태일 때 표시할 문서/프로젝트 제목 */
  rootTitle: string;
  /** 최상위 상태일 때 제목이 변경되면 호출되는 콜백 */
  onUpdateRootTitle: (title: string) => void;
  /** 최상위 상태일 때 input의 placeholder (기본값: "문서 제목") */
  rootPlaceholder?: string;
  /** 줌인 상태일 때 input의 placeholder (기본값: "불릿 제목") */
  zoomPlaceholder?: string;
  /** 헤더 좌측에 붙일 컨트롤 (예: 사이드바 토글 버튼) */
  leading?: React.ReactNode;
  /** 헤더 우측에 붙일 추가 컨트롤 */
  trailing?: React.ReactNode;
  /** 뷰 모드(불릿 vs 보드) 토글 버튼을 헤더 우측에 표시할지 여부 (기본값: true) */
  showViewToggle?: boolean;
  /** 브레드크럼을 헤더 상단에 표시할지 여부 (기본값: true) */
  showBreadcrumb?: boolean;
}

export const OutlineHeader: React.FC<OutlineHeaderProps> = ({
  rootTitle,
  onUpdateRootTitle,
  rootPlaceholder = '문서 제목',
  zoomPlaceholder = '불릿 제목',
  leading,
  trailing,
  showViewToggle = true,
  showBreadcrumb = true,
}) => {
  const { isZoomed, activeNode, activeRootId } = useZoom();
  const { view, toggleView } = useOutlineView();
  const updateText = useEditorStore((s) => s.updateText);
  const { openCanvasView } = useOutlineHost();

  // 줌인 여부에 따라 표시할 제목 결정
  const targetTitle = isZoomed ? (activeNode?.text ?? '') : rootTitle;
  const resetKey = isZoomed ? (activeRootId ?? 'zoomed') : `root-${rootTitle}`;

  return (
    <div className="w-full mb-3 select-none">
      {/* 1. 상단 빵가루 경로 (줌인 상태일 때 HEAD 위에 배치) */}
      {showBreadcrumb && <OutlineBreadcrumb className="mb-2" />}

      {/* 2. 메인 HEAD 컨트롤 바 */}
      <div className="pb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-(--background-modifier-border)/50">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {/* 좌측 슬롯 (예: 사이드바 토글 버튼) */}
          {leading}

          {/* HEAD 제목 인라인 편집 인풋 (key 변경으로 줌 상태 전환 시 자동 초기화) */}
          <HeadTitleField
            key={resetKey}
            initialTitle={targetTitle}
            isZoomed={isZoomed}
            activeRootId={activeRootId}
            placeholder={isZoomed ? zoomPlaceholder : rootPlaceholder}
            onUpdateRootTitle={onUpdateRootTitle}
            updateNodeText={updateText}
          />
        </div>

        {/* 우측 컨트롤 영역 */}
        <div className="flex items-center gap-2 shrink-0">
          {/* 불릿 뷰 / 보드 뷰 토글 버튼 */}
          {showViewToggle && (
            <button
              type="button"
              onClick={toggleView}
              title={`현재: ${view === 'board' ? '칸반 보드 뷰' : '불릿 아웃라인 뷰'}`}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-(--background-secondary) border border-(--background-modifier-border) hover:border-(--background-modifier-border-hover) text-(--text-muted) hover:text-(--text-normal) text-xs transition-colors cursor-pointer"
            >
              {view === 'board' ? (
                <>
                  <LayoutGrid className="w-3.5 h-3.5 text-(--interactive-accent)" />
                  <span className="hidden sm:inline">보드 뷰</span>
                </>
              ) : (
                <>
                  <List className="w-3.5 h-3.5 text-(--interactive-accent)" />
                  <span className="hidden sm:inline">불릿 뷰</span>
                </>
              )}
            </button>
          )}

          {/* 캔버스로 펼쳐 보기 (호스트가 열 수 있을 때만) */}
          {showViewToggle && openCanvasView && (
            <button
              type="button"
              onClick={() => openCanvasView(activeRootId)}
              title="캔버스로 펼쳐 보기 (카드는 이 불릿들의 미러)"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-(--background-secondary) border border-(--background-modifier-border) hover:border-(--background-modifier-border-hover) text-(--text-muted) hover:text-(--text-normal) text-xs transition-colors cursor-pointer"
            >
              <Network className="w-3.5 h-3.5 text-(--interactive-accent)" />
              <span className="hidden sm:inline">캔버스 뷰</span>
            </button>
          )}

          {/* 추가 우측 슬롯 */}
          {trailing}
        </div>
      </div>
    </div>
  );
};
