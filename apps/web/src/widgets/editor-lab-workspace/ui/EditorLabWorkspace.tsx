import { useCallback, useState } from 'react';
import { User, Settings } from 'lucide-react';
import {
  IdeWindowShell,
  IdeDockLayout,
  IdeResizerHandle,
} from '@vibe/editor-workspace';
import { useIdeWorkspaceState } from '../model/useIdeWorkspaceState';
import { IdeWindowHeader } from './IdeWindowHeader';
import { IdeActivityBar, IdeActivityBarAction } from './IdeActivityBar';
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
    <IdeWindowShell
      isDraggingResizer={isDraggingAnyResizer}
      header={
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
      }
      footer={
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
      }
    >
      <IdeDockLayout
        leftActivityBar={
          <IdeActivityBar
            activeTab={activeActivityTab}
            onSelectTab={(tab) => {
              if (tab === 'resources') {
                setShowResourceManager((v) => !v);
              } else if (tab) {
                handleSelectActivityTab(tab);
              }
            }}
            bottomActions={
              <>
                <IdeActivityBarAction
                  icon={<User className="w-5 h-5" />}
                  title="Accounts"
                />
                <IdeActivityBarAction
                  icon={<Settings className="w-5 h-5" />}
                  title="Settings (Ctrl+,)"
                />
              </>
            }
          />
        }
        showPrimarySidebar={showPrimarySidebar}
        primarySidebarWidth={primarySidebarWidth}
        onMouseDownPrimaryResizer={handleMouseDownPrimaryResizer}
        primarySidebar={
          activeActivityTab === 'recipes' ? (
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
          )
        }
        primaryDrawer={
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
        }
        showResourceManager={showResourceManager}
        resourceManagerWidth={resourceManagerWidth}
        onMouseDownResourceResizer={handleMouseDownResourceResizer}
        resourceManager={
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
        }
        showSecondarySidebar={showSecondarySidebar}
        secondarySidebarWidth={secondarySidebarWidth}
        onMouseDownSecondaryResizer={handleMouseDownSecondaryResizer}
        secondarySidebar={
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
        }
        rightActivityBar={
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
        }
      >
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
          <IdeResizerHandle
            orientation="horizontal"
            onMouseDown={handleMouseDownBottomResizer}
            title="드래그하여 터미널 패널 높이 조절"
          />
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
      </IdeDockLayout>

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
    </IdeWindowShell>
  );
}

