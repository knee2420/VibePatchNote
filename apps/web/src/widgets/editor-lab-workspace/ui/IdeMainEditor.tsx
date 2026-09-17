import { useRef, useState } from 'react';
import {
  ChevronRight,
  Save,
  Layers,
  ArrowRightLeft,
} from 'lucide-react';
import { DocumentWireframeEditor } from '@/features/document-wireframe-editor';
import { extractPageHtml } from '../lib/scaffoldPageUtils';
import { IdeTabBar } from './IdeTabBar';
import type { EditorTabItem, DragPayload } from '../model/types';

interface IdeMainEditorProps {
  pane1Tabs: EditorTabItem[];
  pane1ActiveId: string;
  pane1ActiveTab?: EditorTabItem;
  onSelectTab1: (tabId: string) => void;
  onCloseTab1: (tabId: string, e?: React.MouseEvent) => void;
  onContentChange1: (content: string) => void;

  pane2Tabs: EditorTabItem[];
  pane2ActiveId: string;
  pane2ActiveTab?: EditorTabItem;
  onSelectTab2: (tabId: string) => void;
  onCloseTab2: (tabId: string, e?: React.MouseEvent) => void;
  onContentChange2: (content: string) => void;

  isSplitEditor: boolean;
  onToggleSplitEditor: () => void;
  splitRatio: number; // 0 ~ 100
  onMouseDownSplitResizer: (containerWidth: number) => (e: React.MouseEvent) => void;

  onDropItem: (payload: DragPayload, targetPane: 'pane1' | 'pane2') => void;
  onMoveTab: (tabId: string, fromPane: 'pane1' | 'pane2', toPane: 'pane1' | 'pane2') => void;
  onReorderTab: (
    sourceTabId: string,
    targetTabId: string | null,
    sourcePane: 'pane1' | 'pane2',
    targetPane: 'pane1' | 'pane2',
    position: 'before' | 'after'
  ) => void;
  onCursorChange: (line: number, col: number) => void;

  // 실제 와이어프레임 데이터 Props
  scaffoldId?: string;
  scaffoldTitle?: string;
  scaffoldSlotsCount?: number;
  syncState?: string;
  liveHtml?: string;
  onWireframeChangeHtml?: (html: string) => void;
  onPageWireframeChangeHtml?: (pageNumber: number, html: string) => void;
  onWireframeChangeMarkdown?: (md: string) => void;
  onSaveImmediately?: () => Promise<void>;
}

export function IdeMainEditor({
  pane1Tabs,
  pane1ActiveId,
  pane1ActiveTab,
  onSelectTab1,
  onCloseTab1,
  onContentChange1,

  pane2Tabs,
  pane2ActiveId,
  pane2ActiveTab,
  onSelectTab2,
  onCloseTab2,
  onContentChange2,

  isSplitEditor,
  onToggleSplitEditor,
  splitRatio,
  onMouseDownSplitResizer,

  onDropItem,
  onMoveTab,
  onReorderTab,
  onCursorChange,

  scaffoldId,
  scaffoldTitle,
  scaffoldSlotsCount,
  syncState,
  liveHtml,
  onWireframeChangeHtml,
  onPageWireframeChangeHtml,
  onWireframeChangeMarkdown,
  onSaveImmediately,
}: IdeMainEditorProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  // 드롭 타겟 하이라이트 상태
  const [isDragOverPane1, setIsDragOverPane1] = useState(false);
  const [isDragOverPane2, setIsDragOverPane2] = useState(false);

  // 커서 이동 시 줄/열 계산
  const handleCursorCalc = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    const text = e.currentTarget.value;
    const pos = e.currentTarget.selectionStart;
    const lines = text.slice(0, pos).split('\n');
    onCursorChange(lines.length, lines[lines.length - 1].length + 1);
  };

  // 공통 드롭 핸들러
  const handleGenericDrop = (e: React.DragEvent, targetPane: 'pane1' | 'pane2') => {
    e.preventDefault();
    setIsDragOverPane1(false);
    setIsDragOverPane2(false);

    try {
      const dataStr = e.dataTransfer.getData('application/json');
      if (dataStr) {
        const payload: DragPayload = JSON.parse(dataStr);
        onDropItem(payload, targetPane);
      }
    } catch {
      // ignore
    }
  };

  // 단일 에디터 Pane 렌더러 헬퍼
  const renderEditorPane = (
    pane: 'pane1' | 'pane2',
    tabs: EditorTabItem[],
    activeId: string,
    activeTab: EditorTabItem | undefined,
    onSelectTab: (id: string) => void,
    onCloseTab: (id: string, e?: React.MouseEvent) => void,
    onContentChange: (val: string) => void,
    isDragOver: boolean,
    setIsDragOver: (val: boolean) => void,
    style?: React.CSSProperties
  ) => {
    const linesCount = activeTab ? activeTab.content.split('\n').length : 1;
    const lineNumbers = Array.from({ length: Math.max(linesCount, 25) }, (_, i) => i + 1);

    return (
      <div
        style={style}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(e) => handleGenericDrop(e, pane)}
        className={`h-full flex flex-col overflow-hidden relative select-none ${
          isDragOver ? 'ring-2 ring-indigo-500/80 bg-indigo-950/20' : 'bg-slate-950'
        }`}
      >
        {/* 1. 에디터 탭 바 (모듈화된 전용 컴포넌트) */}
        <IdeTabBar
          pane={pane}
          tabs={tabs}
          activeId={activeId}
          isSplitEditor={isSplitEditor}
          onSelectTab={onSelectTab}
          onCloseTab={onCloseTab}
          onMoveTab={onMoveTab}
          onReorderTab={onReorderTab}
          onToggleSplitEditor={onToggleSplitEditor}
        />

        {/* 2. 브레드크럼 바 */}
        {activeTab && (
          <div className="h-6 px-4 bg-slate-950/90 border-b border-slate-900 flex items-center gap-1 text-[11px] text-slate-400 shrink-0 font-sans">
            <span>workspace</span>
            <ChevronRight className="w-3 h-3 text-slate-600" />
            <span>{activeTab.type === 'wireframe' ? 'wireframes' : 'sources'}</span>
            <ChevronRight className="w-3 h-3 text-slate-600" />
            <span className="text-slate-200 font-medium">{activeTab.name}</span>
          </div>
        )}

        {/* 3. 에디터 뷰포트 (와이어프레임 캔버스 vs 코드 에디터) */}
        {activeTab?.type === 'wireframe' ? (
          <div className="flex-1 flex flex-col overflow-hidden bg-slate-950 select-text">
            {/* 와이어프레임 전용 보조 툴바 */}
            <div className="h-8.5 px-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between text-xs text-slate-300 shrink-0 select-none">
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-purple-950/60 text-purple-300 border border-purple-800/60 font-medium text-[11px]">
                  <Layers className="w-3 h-3 text-purple-400" />
                  <span>
                    {activeTab.pageNumber ? `페이지 #${activeTab.pageNumber} 단독 편집` : '전체 페이지 연속 뷰'}
                  </span>
                </span>
                <span className="text-[11px] text-slate-400 font-sans">
                  {scaffoldTitle || '회의비 사용 내역'} · {activeTab.pageNumber ? 'A4 단일 페이지 규격' : 'A4 다단 연속 규격'}
                </span>
              </div>

              <div className="flex items-center gap-3 font-sans">
                <span className="text-[11px] text-slate-400">
                  {activeTab.pageNumber ? `P.${activeTab.pageNumber} 슬롯` : '총 슬롯'}{' '}
                  <strong className="text-slate-200">{scaffoldSlotsCount ?? 14}</strong>개
                </span>

                {/* 실시간 SSOT 동기화 상태 표시 */}
                <div className="flex items-center gap-1.5 text-[11px]">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      syncState === 'saving'
                        ? 'bg-amber-400 animate-pulse'
                        : syncState === 'saved'
                        ? 'bg-emerald-400'
                        : syncState === 'error'
                        ? 'bg-rose-500'
                        : 'bg-emerald-500'
                    }`}
                  />
                  <span className="text-slate-400">
                    {syncState === 'saving'
                      ? '서버 저장 중...'
                      : syncState === 'saved'
                      ? '저장 완료'
                      : syncState === 'error'
                      ? '저장 오류'
                      : '실시간 동기화됨'}
                  </span>
                </div>

                {onSaveImmediately && (
                  <button
                    type="button"
                    onClick={() => void onSaveImmediately()}
                    className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] border border-slate-700 cursor-pointer shadow-2xs font-sans transition-colors"
                    title="백엔드 저장 즉시 반영"
                  >
                    <Save className="w-3 h-3 text-indigo-400" />
                    <span>저장</span>
                  </button>
                )}
              </div>
            </div>

            {/* A4 캔버스 스크롤러 영역 */}
            <div className="flex-1 overflow-y-auto p-6 flex justify-center items-start bg-slate-900/50">
              <div className="w-full max-w-4xl bg-white text-slate-900 rounded-xl shadow-2xl p-8 border border-slate-200 min-h-[850px]">
                <DocumentWireframeEditor
                  documentKey={
                    activeTab.pageNumber
                      ? `${activeTab.scaffoldId || scaffoldId}-p${activeTab.pageNumber}`
                      : activeTab.scaffoldId || scaffoldId || 'wireframe-canvas'
                  }
                  initialHtml={
                    activeTab.pageNumber
                      ? extractPageHtml(liveHtml || '', activeTab.pageNumber)
                      : liveHtml || activeTab.content || ''
                  }
                  onChangeHtml={(html) =>
                    activeTab.pageNumber
                      ? onPageWireframeChangeHtml?.(activeTab.pageNumber, html)
                      : (onWireframeChangeHtml || onContentChange)(html)
                  }
                  onChangeMarkdown={onWireframeChangeMarkdown || (() => {})}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex overflow-hidden relative select-text font-mono text-[13px] leading-6 bg-slate-950">
            {/* 라인 넘버 거터 */}
            <div className="w-12 bg-slate-950/60 text-slate-600 select-none py-3 text-right pr-3 shrink-0 border-r border-slate-900/60 font-mono text-xs">
              {lineNumbers.map((num) => (
                <div key={num} className="leading-6">
                  {num}
                </div>
              ))}
            </div>

            {/* 텍스트 입력 에어리어 */}
            <div className="flex-1 relative overflow-hidden">
              {activeTab ? (
                <textarea
                  value={activeTab.content}
                  onChange={(e) => onContentChange(e.target.value)}
                  onSelect={handleCursorCalc}
                  onKeyUp={handleCursorCalc}
                  onClick={handleCursorCalc}
                  spellCheck={false}
                  className="w-full h-full p-3 bg-transparent text-slate-200 focus:outline-none resize-none font-mono text-[13px] leading-6 overflow-auto scrollbar-thin whitespace-pre"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 space-y-2 select-none">
                  <ArrowRightLeft className="w-8 h-8 text-slate-700" />
                  <p className="text-xs">열려 있는 파일이 없습니다.</p>
                  <p className="text-[11px] text-slate-500">
                    왼쪽 탐색기나 탭을 이곳으로 드래그하여 배치할 수 있습니다.
                  </p>
                </div>
              )}
            </div>

            {/* 우측 미니맵 */}
            <div className="w-14 bg-slate-950 border-l border-slate-900/80 p-1 hidden xl:block select-none pointer-events-none opacity-30">
              <div className="space-y-1">
                {lineNumbers.slice(0, 30).map((n) => (
                  <div
                    key={n}
                    style={{ width: `${(n * 19) % 75 + 25}%` }}
                    className="h-1 bg-slate-500 rounded-xs"
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      ref={containerRef}
      className="flex-1 h-full flex overflow-hidden relative bg-slate-950"
    >
      {/* 1. Left Editor Pane (Pane 1) */}
      {renderEditorPane(
        'pane1',
        pane1Tabs,
        pane1ActiveId,
        pane1ActiveTab,
        onSelectTab1,
        onCloseTab1,
        onContentChange1,
        isDragOverPane1,
        setIsDragOverPane1,
        isSplitEditor ? { width: `${splitRatio}%` } : { width: '100%' }
      )}

      {/* 2. 분할 스플릿 리사이저 바 (Split Resizer Divider) */}
      {isSplitEditor && (
        <div
          onMouseDown={(e) => {
            if (containerRef.current) {
              onMouseDownSplitResizer(containerRef.current.clientWidth)(e);
            }
          }}
          className="w-1.5 h-full cursor-col-resize z-20 hover:bg-indigo-500 transition-colors flex items-center justify-center group shrink-0 bg-slate-900 border-x border-slate-800"
          title="드래그하여 좌우 에디터 분할 비율 조절"
        >
          <div className="w-[1px] h-full bg-slate-800 group-hover:bg-indigo-400" />
        </div>
      )}

      {/* 3. Right Editor Pane (Pane 2) */}
      {isSplitEditor &&
        renderEditorPane(
          'pane2',
          pane2Tabs,
          pane2ActiveId,
          pane2ActiveTab,
          onSelectTab2,
          onCloseTab2,
          onContentChange2,
          isDragOverPane2,
          setIsDragOverPane2,
          { width: `${100 - splitRatio}%` }
        )}
    </div>
  );
}
