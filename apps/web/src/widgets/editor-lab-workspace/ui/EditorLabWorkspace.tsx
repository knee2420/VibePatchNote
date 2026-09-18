import { useCallback, useState } from 'react';
import { useIdeWorkspaceState } from '../model/useIdeWorkspaceState';
import { IdeWindowHeader } from './IdeWindowHeader';
import { IdeActivityBar } from './IdeActivityBar';
import { IdeBinderSidebar } from './IdeBinderSidebar';
import { IdeMainEditor } from './IdeMainEditor';
import { IdeResourceManager } from './IdeResourceManager';
import { IdeResourceModal } from './IdeResourceModal';
import { IdeBottomPanel } from './IdeBottomPanel';
import { IdeSecondarySidebar } from './IdeSecondarySidebar';
import { IdeSecondaryActivityBar, type AiPanelMode } from './IdeSecondaryActivityBar';
import { IdeStatusBar } from './IdeStatusBar';
import { IdeReferenceDocDrawer } from './IdeReferenceDocDrawer';
import { FloatingReferenceWindow } from './FloatingReferenceWindow';
import { IdeRecipeSidebar } from './IdeRecipeSidebar';
import { IdeReasoningModal } from './IdeReasoningModal';

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
 * 5. 독립된 파이프라인 백데이터 & 에셋 리소스 매니저 패널 제공
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
    showResourceManager,
    setShowResourceManager,
    primarySidebarWidth,
    secondarySidebarWidth,
    resourceManagerWidth,
    bottomPanelHeight,
    splitRatio,
    isDraggingAnyResizer,

    // 리사이저 마우스 핸들러
    handleMouseDownPrimaryResizer,
    handleMouseDownSecondaryResizer,
    handleMouseDownResourceResizer,
    handleMouseDownBottomResizer,
    handleMouseDownSplitResizer,

    // 리소스 매니저 (다중 디렉토리 묶음 & 뷰 모드)
    bundles,
    resources,
    resourceViewMode,
    setResourceViewMode,
    resourceSearchQuery,
    setResourceSearchQuery,
    linkedFolderName,
    handleAddDirectoryBundle,
    handleRemoveDirectoryBundle,
    handleToggleBundleCollapse,
    handleAddResources,
    handleDisconnectFolder,
    handleOpenResource,

    // 헵타베이스 스타일 우측 리소스 모달
    resourceModalResource,
    resourceModalProvenance,
    isResourceModalOpen,
    resourceModalWidth,
    handleOpenResourceModal,
    handleCloseResourceModal,
    handleMouseDownResourceModalResizer,

    // 좌측 Reasoning 모달 (Prompt + 바인더 아웃라인 맥락 + 레시피 규격)
    isReasoningModalOpen,
    reasoningFocusedSlotId,
    handleOpenReasoningModal,
    handleCloseReasoningModal,

    // 좌측 레퍼런스 원본 패널 & 플로팅 레퍼런스 창
    isLeftReferenceOpen,
    leftReferenceWidth,
    isFloatingReferenceOpen,
    referenceDocuments,
    activeReferenceDoc,
    handleToggleLeftReference,
    handlePopoutToFloating,
    handleDockFloatingToPanel,
    handleCloseReference,
    handleSelectReferenceDoc,
    handleMouseDownLeftReferenceResizer,

    // 탭
    activeActivityTab,
    handleSelectActivityTab,
    activeBottomTab,
    setActiveBottomTab,
    activeSpine,
    setActiveSpine,

    // 파일 트리
    fileTree,
    handleOpenFile,
    handleOpenPageTab,
    handleOpenScrivenings,
    handleOpenArtifactStageTab,

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

    // 슬롯 소켓 바인딩 (스캐폴드 슬롯 ↔ 백데이터 리소스 매핑)
    slotBindings,
    handleBindSlot,
    handleUnbindSlot,
    handleApplySuggested,
    handleApplyAllSuggestions,
    handleResetAllSlots,
    handleOpenSlotProvenance,
  } = useIdeWorkspaceState(scaffoldId);

  // 슬롯 선택 및 포커스 동기화 상태 (바인더 트리 ↔ 메인 캔버스 슬롯 상호작용)
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [selectedSlotNumber, setSelectedSlotNumber] = useState<number | null>(null);
  const [selectedSlotIds, setSelectedSlotIds] = useState<string[]>([]);
  const [aiPanelMode, setAiPanelMode] = useState<AiPanelMode>('audit');

  const handleSelectSlot = useCallback(
    (slotId: string, pageNumber: number, slotNumber?: number) => {
      setSelectedSlotId(slotId);
      setSelectedSlotIds([slotId]);
      const parsed = slotNumber ?? (parseInt(slotId.replace(/\D/g, ''), 10) || null);
      setSelectedSlotNumber(parsed);
      handleOpenPageTab(pageNumber, 'pane1');
    },
    [handleOpenPageTab]
  );

  const handleSelectSlotFromAi = useCallback(
    (slotId: string) => {
      const num = parseInt(slotId.replace(/\D/g, ''), 10) || 1;
      const page = num > 7 ? 2 : 1;
      handleSelectSlot(slotId, page, num);
    },
    [handleSelectSlot]
  );

  const handleJumpToSourceAnchor = useCallback(
    (_slotId: string) => {
      if (!isLeftReferenceOpen) {
        handleToggleLeftReference();
      }
    },
    [isLeftReferenceOpen, handleToggleLeftReference]
  );

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
        showResourceManager={showResourceManager}
        onToggleResourceManager={() => setShowResourceManager((v) => !v)}
        showSecondarySidebar={showSecondarySidebar}
        onToggleSecondarySidebar={() => setShowSecondarySidebar((v) => !v)}
        onBack={onBack}
      />

      {/* 2. 중앙 메인 레이아웃 영역 */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* [좌측 전역 액티비티 바] */}
        <IdeActivityBar
          activeTab={activeActivityTab}
          onSelectTab={(tab) => {
            if (tab === 'resources') {
              setShowResourceManager((v) => !v);
            } else {
              handleSelectActivityTab(tab);
            }
          }}
        />

        {/* [좌측 기본 사이드바 / Explorer & Views] */}
        {showPrimarySidebar && (
          <>
            <aside
              style={{ width: `${primarySidebarWidth}px` }}
              className="h-full shrink-0 border-r border-slate-850 flex flex-col overflow-hidden z-10 transition-none"
            >
              {activeActivityTab === 'recipes' ? (
                <IdeRecipeSidebar
                  onClose={() => handleSelectActivityTab('explorer')}
                  onOpenReferenceDoc={handleToggleLeftReference}
                  currentDocId={detail?.docId}
                  currentScaffoldId={resolvedScaffoldId}
                />
              ) : (
                <IdeBinderSidebar
                  scaffoldId={resolvedScaffoldId}
                  docId={detail?.docId}
                  documentTitle={detail?.title}
                  slots={detail?.slots}
                  fileTree={fileTree}
                  activeNodeId={pane1ActiveId}
                  activeTab={pane1ActiveTab}
                  activePageNumber={pane1ActiveTab?.pageNumber}
                  onOpenFile={(node) => handleOpenFile(node, 'pane1')}
                  onSelectPage={(pageNum) => handleOpenPageTab(pageNum, 'pane1')}
                  onOpenPageTab={(pageNum, pane) => handleOpenPageTab(pageNum, pane || 'pane1')}
                  selectedSlotId={selectedSlotId}
                  onSelectSlot={handleSelectSlot}
                  onOpenScrivenings={handleOpenScrivenings}
                  onOpenResourceModal={handleOpenResourceModal}
                  stagingResources={resources.filter(
                    (r) => r.category === 'linked' || r.format === 'png' || r.format === 'hwp' || r.format === 'pdf'
                  )}
                  slotBindings={slotBindings}
                  onBindSlot={handleBindSlot}
                  onUnbindSlot={handleUnbindSlot}
                  onApplySuggested={handleApplySuggested}
                  onApplyAllSuggestions={handleApplyAllSuggestions}
                  onResetAllSlots={handleResetAllSlots}
                  onOpenSlotProvenance={handleOpenSlotProvenance}
                  onToggleReferenceDoc={handleToggleLeftReference}
                  isReferenceDocOpen={isLeftReferenceOpen}
                  activeSpine={activeSpine}
                  onChangeSpine={setActiveSpine}
                />
              )}
            </aside>

            {/* 좌측 레퍼런스 원본 슬라이드 모달 (BINDER 옆에서 튀어나오는 패널) */}
            <IdeReferenceDocDrawer
              isOpen={isLeftReferenceOpen}
              onClose={handleToggleLeftReference}
              onPopoutToFloating={handlePopoutToFloating}
              referenceDocuments={referenceDocuments}
              currentDoc={activeReferenceDoc}
              onSelectDoc={handleSelectReferenceDoc}
              width={leftReferenceWidth}
              leftOffset={48 + (showPrimarySidebar ? primarySidebarWidth : 0)}
              onMouseDownResizer={handleMouseDownLeftReferenceResizer}
            />

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
            selectedSlotId={selectedSlotId}
            selectedSlotNumber={selectedSlotNumber}
            onSlotClick={handleSelectSlot}
            onBindSlot={handleBindSlot}
            onJumpToSourceAnchor={handleJumpToSourceAnchor}
            onAcceptSlotSuggestion={handleApplySuggested}
            slotBindings={slotBindings}
            onSelectSlotsChange={setSelectedSlotIds}
            onWireframeChangeHtml={handleWireframeChangeHtml}
            onPageWireframeChangeHtml={handlePageWireframeChangeHtml}
            onWireframeChangeMarkdown={handleWireframeChangeMarkdown}
            onSaveImmediately={saveImmediately}
            onUnbindSlot={handleUnbindSlot}
            onOpenSlotProvenance={handleOpenSlotProvenance}
            onOpenReasoning={handleOpenReasoningModal}
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
                activeSpine={activeSpine}
                onChangeSpine={setActiveSpine}
                selectedSlotId={selectedSlotId}
                selectedSlotNumber={selectedSlotNumber}
                onSelectSlot={handleSelectSlot}
                slotBindings={slotBindings}
                onBindSlot={handleBindSlot}
                onOpenSoloTab={(page) => handleOpenPageTab(page, 'pane1')}
                scaffoldId={resolvedScaffoldId}
                docId={detail?.docId}
              />
            </div>
          )}
        </main>

        {/* [리소스 매니저 독립 패널 (중앙 에디터와 우측 AI 패널 사이)] */}
        {showResourceManager && (
          <>
            {/* 리소스 매니저 마우스 리사이저 핸들 */}
            <div
              onMouseDown={handleMouseDownResourceResizer}
              className="w-1.5 -mr-1 h-full cursor-col-resize z-20 hover:bg-amber-500/50 transition-colors flex items-center justify-center group shrink-0"
              title="드래그하여 리소스 매니저 너비 조절"
            >
              <div className="w-[1px] h-full bg-slate-800 group-hover:bg-amber-400" />
            </div>

            <aside
              style={{ width: `${resourceManagerWidth}px` }}
              className="h-full shrink-0 border-l border-slate-850 flex flex-col overflow-hidden z-10 transition-none"
            >
              <IdeResourceManager
                bundles={bundles}
                resources={resources}
                viewMode={resourceViewMode}
                onChangeViewMode={setResourceViewMode}
                searchQuery={resourceSearchQuery}
                onChangeSearchQuery={setResourceSearchQuery}
                onOpenResource={(res) => handleOpenResourceModal(res)}
                onClose={() => setShowResourceManager(false)}
                onAddBundle={handleAddDirectoryBundle}
                onRemoveBundle={handleRemoveDirectoryBundle}
                onToggleBundleCollapse={handleToggleBundleCollapse}
                linkedFolderName={linkedFolderName}
                onAddResources={handleAddResources}
                onDisconnectFolder={handleDisconnectFolder}
              />
            </aside>
          </>
        )}

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
                activeMode={aiPanelMode}
                onSelectMode={setAiPanelMode}
                messages={chatMessages}
                promptInput={promptInput}
                onChangePromptInput={setPromptInput}
                onSendPrompt={handleSendPrompt}
                selectedModel={selectedModel}
                onSelectModel={setSelectedModel}
                isStreaming={isAiStreaming}
                onClose={() => setShowSecondarySidebar(false)}
                slotBindings={slotBindings}
                onApplySuggested={handleApplySuggested}
                onApplyAllSuggestions={handleApplyAllSuggestions}
                onSelectSlot={handleSelectSlotFromAi}
                onBindSlot={handleBindSlot}
                selectedSlotIds={selectedSlotIds}
                onClearSelectedSlots={() => setSelectedSlotIds([])}
                onOpenArtifactStage={handleOpenArtifactStageTab}
              />
            </aside>
          </>
        )}

        {/* [우측 전역 AI 도크 액티비티 바 (Grammarly 스타일)] */}
        <IdeSecondaryActivityBar
          isOpen={showSecondarySidebar}
          activeMode={aiPanelMode}
          onSelectMode={(mode) => {
            setAiPanelMode(mode);
            setShowSecondarySidebar(true);
          }}
          onToggleOpen={() => setShowSecondarySidebar((v) => !v)}
          score={85}
          issueCount={2}
        />

        {/* 헵타베이스 스타일 우측 슬라이드오버 리소스 모달 (중앙 에디터를 덮지 않고 우측에서 열림) */}
        <IdeResourceModal
          resource={resourceModalResource}
          provenance={resourceModalProvenance}
          isOpen={isResourceModalOpen}
          onClose={handleCloseResourceModal}
          width={resourceModalWidth}
          onMouseDownResizer={handleMouseDownResourceModalResizer}
          onOpenInEditor={(res) => {
            handleOpenResource(res, 'pane1');
            handleCloseResourceModal();
          }}
        />

        {/* 좌측 에이전트 추론 근거(Reasoning) 슬라이드 모달: Prompt(Goal) + 바인더 아웃라인(시계열 맥락) + 레시피 규격 */}
        <IdeReasoningModal
          isOpen={isReasoningModalOpen}
          onClose={handleCloseReasoningModal}
          focusedSlotId={reasoningFocusedSlotId}
          onSelectSlot={(slotId) => handleSelectSlot(slotId, 1)}
          onOpenProvenanceDoc={(docName) => {
            const matched = resources.find(
              (r) => r.name.includes(docName) || docName.includes(r.name)
            );
            if (matched) {
              handleOpenResourceModal(matched);
            }
          }}
        />

        {/* 프로크리에이트 스타일 플로팅 레퍼런스 창 (화면 위에 계속 떠 있는 창) */}
        <FloatingReferenceWindow
          isOpen={isFloatingReferenceOpen}
          onClose={handleCloseReference}
          onDockToPanel={handleDockFloatingToPanel}
          referenceDocuments={referenceDocuments}
          currentDoc={activeReferenceDoc}
          onSelectDoc={handleSelectReferenceDoc}
        />
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
