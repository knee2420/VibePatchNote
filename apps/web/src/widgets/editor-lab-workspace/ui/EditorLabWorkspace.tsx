import { useIdeWorkspaceState } from '../model/useIdeWorkspaceState';
import { IdeWindowHeader } from './IdeWindowHeader';
import { IdeActivityBar } from './IdeActivityBar';
import { IdePrimarySidebar } from './IdePrimarySidebar';
import { IdeMainEditor } from './IdeMainEditor';
import { IdeBottomPanel } from './IdeBottomPanel';
import { IdeSecondarySidebar } from './IdeSecondarySidebar';
import { IdeStatusBar } from './IdeStatusBar';

export interface EditorLabWorkspaceProps {
  scaffoldId?: string;
  onBack?: () => void;
}

/**
 * EditorLabWorkspace (FSD Widget Layer)
 *
 * Antigravity IDE의 7대 핵심 영역을 1:1로 완전하게 모사하며:
 * 1. 각 패널 마우스 드래그 크기 조절 (좌/우 사이드바 너비, 하단 패널 높이, 중앙 스플릿 분할 비율)
 * 2. 탭 드래그 앤 드롭 이동 및 탐색기 파일 드롭 오픈
 * 3. 독립된 멀티 Pane 탭 그룹 에디터 제공
 * 4. 실제 백엔드 스캐폴드 아카이브 데이터 연동 및 인터랙티브 와이어프레임 캔버스 렌더링
 */
export function EditorLabWorkspace({ scaffoldId, onBack }: EditorLabWorkspaceProps) {
  const {
    // 실제 백엔드 스캐폴드/와이어프레임 데이터 및 핸들러
    scaffoldId: resolvedScaffoldId,
    detail,
    syncState,
    liveHtml,
    handleWireframeChangeHtml,
    handlePageWireframeChangeHtml,
    handleWireframeChangeMarkdown,
    saveImmediately,
    // 패널 가시성 및 너비/높이
    showPrimarySidebar,
    setShowPrimarySidebar,
    showSecondarySidebar,
    setShowSecondarySidebar,
    showBottomPanel,
    setShowBottomPanel,
    primarySidebarWidth,
    secondarySidebarWidth,
    bottomPanelHeight,
    splitRatio,
    isDraggingAnyResizer,

    // 리사이저 마우스 핸들러
    handleMouseDownPrimaryResizer,
    handleMouseDownSecondaryResizer,
    handleMouseDownBottomResizer,
    handleMouseDownSplitResizer,

    // 탭
    activeActivityTab,
    handleSelectActivityTab,
    activeBottomTab,
    setActiveBottomTab,

    // 파일 트리
    fileTree,
    handleToggleFolder,
    handleOpenFile,

    // 멀티 Pane 에디터
    isSplitEditor,
    setIsSplitEditor,
    pane1Tabs,
    pane1ActiveId,
    setPane1ActiveId,
    pane1ActiveTab,
    pane2Tabs,
    pane2ActiveId,
    setPane2ActiveId,
    pane2ActiveTab,
    handleCloseTab,
    handleMoveTab,
    handleReorderTab,
    handleDropItem,
    handleContentChange,
    cursorPosition,
    setCursorPosition,

    // 터미널
    terminalSessions,
    activeTerminalId,
    setActiveTerminalId,
    terminalCommandInput,
    setTerminalCommandInput,
    handleTerminalSubmit,
    handleAddTerminalSession,

    // AI
    chatMessages,
    promptInput,
    setPromptInput,
    selectedModel,
    setSelectedModel,
    isAiStreaming,
    handleSendPrompt,
  } = useIdeWorkspaceState(scaffoldId);

  return (
    <div
      className={`w-full h-screen flex flex-col bg-slate-950 text-slate-100 font-sans overflow-hidden ${
        isDraggingAnyResizer ? 'select-none cursor-col-resize' : 'select-none'
      }`}
    >
      {/* 1. 최상단 윈도우 프레임 & 메뉴바 */}
      <IdeWindowHeader
        activeFileName={
          detail?.title
            ? `${detail.title} · ${pane1ActiveTab?.name || pane2ActiveTab?.name || 'Canvas'}`
            : pane1ActiveTab?.name || pane2ActiveTab?.name
        }
        showPrimarySidebar={showPrimarySidebar}
        onTogglePrimarySidebar={() => setShowPrimarySidebar((v) => !v)}
        showBottomPanel={showBottomPanel}
        onToggleBottomPanel={() => setShowBottomPanel((v) => !v)}
        showSecondarySidebar={showSecondarySidebar}
        onToggleSecondarySidebar={() => setShowSecondarySidebar((v) => !v)}
        onBack={onBack}
      />

      {/* 2. 중앙 메인 레이아웃 영역 */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* [좌측 전역 액티비티 바] */}
        <IdeActivityBar
          activeTab={activeActivityTab}
          onSelectTab={handleSelectActivityTab}
        />

        {/* [좌측 기본 사이드바 / Explorer & Views] */}
        {showPrimarySidebar && (
          <>
            <aside
              style={{ width: `${primarySidebarWidth}px` }}
              className="h-full shrink-0 border-r border-slate-850 flex flex-col overflow-hidden z-10 transition-none"
            >
              <IdePrimarySidebar
                activeTab={activeActivityTab}
                fileTree={fileTree}
                activeFileId={pane1ActiveId}
                onOpenFile={(node) => handleOpenFile(node, 'pane1')}
                onToggleFolder={handleToggleFolder}
              />
            </aside>

            {/* 좌측 사이드바 마우스 리사이저 핸들 */}
            <div
              onMouseDown={handleMouseDownPrimaryResizer}
              className="w-1.5 -ml-1 h-full cursor-col-resize z-20 hover:bg-indigo-500/50 transition-colors flex items-center justify-center group shrink-0"
              title="드래그하여 탐색기 패널 너비 조절"
            >
              <div className="w-[1px] h-full bg-slate-800 group-hover:bg-indigo-400" />
            </div>
          </>
        )}

        {/* [중앙 작업 영역: 멀티 Pane 에디터 + 하단 패널] */}
        <main className="flex-1 h-full flex flex-col min-w-0 overflow-hidden relative">
          {/* 중앙 멀티 Pane 코드 & 와이어프레임 에디터 */}
          <IdeMainEditor
            pane1Tabs={pane1Tabs}
            pane1ActiveId={pane1ActiveId}
            pane1ActiveTab={pane1ActiveTab}
            onSelectTab1={setPane1ActiveId}
            onCloseTab1={(id, e) => handleCloseTab(id, 'pane1', e)}
            onContentChange1={(val) => handleContentChange(val, 'pane1')}

            pane2Tabs={pane2Tabs}
            pane2ActiveId={pane2ActiveId}
            pane2ActiveTab={pane2ActiveTab}
            onSelectTab2={setPane2ActiveId}
            onCloseTab2={(id, e) => handleCloseTab(id, 'pane2', e)}
            onContentChange2={(val) => handleContentChange(val, 'pane2')}

            isSplitEditor={isSplitEditor}
            onToggleSplitEditor={() => setIsSplitEditor((v) => !v)}
            splitRatio={splitRatio}
            onMouseDownSplitResizer={handleMouseDownSplitResizer}

            onDropItem={handleDropItem}
            onMoveTab={handleMoveTab}
            onReorderTab={handleReorderTab}
            onCursorChange={(line, col) => setCursorPosition({ line, col })}

            scaffoldId={resolvedScaffoldId}
            scaffoldTitle={detail?.title}
            scaffoldSlotsCount={detail?.slots?.length}
            syncState={syncState}
            liveHtml={liveHtml}
            onWireframeChangeHtml={handleWireframeChangeHtml}
            onPageWireframeChangeHtml={handlePageWireframeChangeHtml}
            onWireframeChangeMarkdown={handleWireframeChangeMarkdown}
            onSaveImmediately={saveImmediately}
          />

          {/* 하단 패널 리사이저 핸들 (가로) */}
          {showBottomPanel && (
            <div
              onMouseDown={handleMouseDownBottomResizer}
              className="h-1.5 -mt-1 w-full cursor-row-resize z-20 hover:bg-indigo-500/50 transition-colors flex items-center justify-center group shrink-0"
              title="드래그하여 터미널 패널 높이 조절"
            >
              <div className="h-[1px] w-full bg-slate-800 group-hover:bg-indigo-400" />
            </div>
          )}

          {/* 하단 도킹 패널 (Terminal, Problems, Output, Ports) */}
          {showBottomPanel && (
            <div style={{ height: `${bottomPanelHeight}px` }} className="shrink-0 flex flex-col overflow-hidden">
              <IdeBottomPanel
                activeTab={activeBottomTab}
                onSelectTab={setActiveBottomTab}
                sessions={terminalSessions}
                activeSessionId={activeTerminalId}
                onSelectSession={setActiveTerminalId}
                onAddSession={handleAddTerminalSession}
                commandInput={terminalCommandInput}
                onChangeCommandInput={setTerminalCommandInput}
                onSubmitCommand={handleTerminalSubmit}
                onClose={() => setShowBottomPanel(false)}
              />
            </div>
          )}
        </main>

        {/* [우측 보조 사이드바 / Antigravity AI 패널] */}
        {showSecondarySidebar && (
          <>
            {/* 우측 AI 패널 마우스 리사이저 핸들 */}
            <div
              onMouseDown={handleMouseDownSecondaryResizer}
              className="w-1.5 -mr-1 h-full cursor-col-resize z-20 hover:bg-indigo-500/50 transition-colors flex items-center justify-center group shrink-0"
              title="드래그하여 AI 패널 너비 조절"
            >
              <div className="w-[1px] h-full bg-slate-800 group-hover:bg-indigo-400" />
            </div>

            <aside
              style={{ width: `${secondarySidebarWidth}px` }}
              className="h-full shrink-0 border-l border-slate-850 flex flex-col overflow-hidden z-10 transition-none"
            >
              <IdeSecondarySidebar
                messages={chatMessages}
                promptInput={promptInput}
                onChangePromptInput={setPromptInput}
                onSendPrompt={handleSendPrompt}
                selectedModel={selectedModel}
                onSelectModel={setSelectedModel}
                isStreaming={isAiStreaming}
                onClose={() => setShowSecondarySidebar(false)}
              />
            </aside>
          </>
        )}
      </div>

      {/* 3. 최하단 전역 상태 표시줄 */}
      <IdeStatusBar
        cursorLine={cursorPosition.line}
        cursorCol={cursorPosition.col}
        branchName="add-document-editor*"
        language={
          pane1ActiveTab?.type === 'wireframe'
            ? 'Interactive Wireframe'
            : pane1ActiveTab?.language === 'typescript'
            ? 'TypeScript JSX'
            : pane1ActiveTab?.language || 'Text'
        }
        syncState={syncState}
      />
    </div>
  );
}
