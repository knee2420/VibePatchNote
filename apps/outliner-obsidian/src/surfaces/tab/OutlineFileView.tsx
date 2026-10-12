/**
 * @file OutlineFileView.tsx
 * @description .outline 파일 하나를 여는 옵시디언 화면 (탭마다 하나)
 *
 * 파일을 읽고 쓰는 일은 옵시디언이 한다. 이 화면은 옵시디언이 넘겨준 글자를 스캐폴드로 올리고(setViewData),
 * 저장할 때 글자를 돌려준다(getViewData). 편집 화면은 `@vibe/outliner-editor` 를 그대로 쓰며,
 * 내용(outlineDocument)과 편집 상태(줌·포커스·선택)를 탭마다 따로 갖는다.
 */

import { type Root, createRoot } from 'react-dom/client';
import {
  type Menu,
  type TFile,
  type ViewStateResult,
  type WorkspaceLeaf,
  TextFileView,
} from 'obsidian';
import { type OutlineNode, type ViewMode, findNode, toOutlineText } from '@vibe/outliner-core';
import {
  type OutlineEditorStore,
  type OutlineHost,
  createOutlineEditorStore,
} from '@vibe/outliner-editor';
import { OutlineFileApp } from './OutlineFileApp';
import { syncOutlineMetadata } from '../../vault/outlineMetadataIndexer';
import { createObsidianHost } from '../../host/obsidianHost';
import {
  type OutlineDocumentStore,
  createOutlineDocumentStore,
  readOutlineText,
  writeOutlineText,
} from '../../document/outlineDocument';
import { VIEW_TYPE_OUTLINE, createSiblingFile, renameOutlineFile } from '../../document/outlineFiles';

/** 우리 화면의 뿌리와 메뉴·대화상자 자리에 붙는 클래스. 스타일이 이 안으로 가둬져 있다. */
const SCOPE_CLASS = 'vibe-outliner';

export class OutlineFileView extends TextFileView {
  readonly outline: OutlineDocumentStore = createOutlineDocumentStore();
  readonly editor: OutlineEditorStore;
  readonly host: OutlineHost;

  private root: Root | null = null;
  private portalEl: HTMLElement | null = null;
  /** 파일을 읽기 전에 받아 둔, 다시 열 때 복원할 줌 위치 */
  private pendingZoomId: string | null = null;

  constructor(leaf: WorkspaceLeaf) {
    super(leaf);

    this.editor = createOutlineEditorStore({
      getRoots: () => this.outline.getState().project?.rootNodes ?? [],
      commitRoots: (rootNodes) => this.updateProject({ rootNodes }),
      setDefaultView: (defaultView) => this.updateProject({ defaultView }),
    });

    this.host = createObsidianHost({
      app: this.app,
      getFile: () => this.file,
      getPortalRoot: () => this.getPortalRoot(),
      component: this,
    });

    // 줌 위치가 바뀌면 옵시디언이 탭 상태를 다시 저장하게 한다. (다시 열 때 그 자리로 돌아온다)
    this.register(
      this.editor.subscribe((state, previous) => {
        if (state.activeRootId !== previous.activeRootId) this.app.workspace.requestSaveLayout();
      })
    );
  }

  getViewType(): string {
    return VIEW_TYPE_OUTLINE;
  }

  getDisplayText(): string {
    return this.file?.basename ?? '아웃라인';
  }

  getIcon(): string {
    return 'list-tree';
  }

  // ── 옵시디언이 파일 글자를 주고받는 자리 ──

  setViewData(data: string, clear: boolean): void {
    if (clear) this.editor.getState().resetView();
    this.outline.setState(readOutlineText(data, this.file?.basename ?? ''), true);

    // 밖에서 파일이 바뀌어 줌인해 있던 불릿이 사라졌으면 맨 위로 돌아간다.
    const { activeRootId } = this.editor.getState();
    if (activeRootId && !findNode(this.roots(), activeRootId)) this.editor.getState().setZoom(null);
    this.applyPendingZoom();
    // 파일이 정해진 뒤에야 제목(파일 이름)을 알 수 있다.
    this.render();
    if (this.file) {
      void syncOutlineMetadata(this.app, this.file);
    }
  }

  getViewData(): string {
    const { project } = this.outline.getState();
    // 읽지 못한 파일은 받은 글자 그대로 돌려준다. (모르는 파일을 덮어쓰지 않는다)
    if (!project) return this.data;
    return writeOutlineText(project, this.file?.basename ?? project.title);
  }

  clear(): void {
    this.outline.setState({ project: null, problem: null }, true);
    this.editor.getState().resetView();
  }

  // 파일 이름이 곧 제목이다. 이름이 바뀌면 파일 안의 제목 칸도 다음 저장 때 따라가게 한다.
  async onRename(file: TFile): Promise<void> {
    await super.onRename(file);
    if (this.outline.getState().project) this.requestSave();
    this.render();
  }

  // ── 탭 상태 (다시 열 때 복원) ──

  getState(): Record<string, unknown> {
    return { ...super.getState(), zoom: this.editor.getState().activeRootId };
  }

  async setState(state: unknown, result: ViewStateResult): Promise<void> {
    const zoom = (state as { zoom?: unknown } | null)?.zoom;
    this.pendingZoomId = typeof zoom === 'string' ? zoom : null;
    await super.setState(state, result);
    this.applyPendingZoom();
  }

  /** 주소 또는 내부 링크(#nodeId)로 들어왔을 때: 그 불릿으로 줌인/포커스한다. */
  setEphemeralState(state: unknown): void {
    super.setEphemeralState(state);
    const typed = state as { nodeId?: unknown; subpath?: unknown } | null;
    let targetNodeId: string | null = null;
    if (typeof typed?.nodeId === 'string') {
      targetNodeId = typed.nodeId;
    } else if (typeof typed?.subpath === 'string') {
      targetNodeId = typed.subpath.replace(/^#/, '').trim();
    }
    if (targetNodeId) {
      this.revealNode(targetNodeId);
    }
  }

  revealNode(nodeId: string): void {
    if (findNode(this.roots(), nodeId)) this.editor.getState().setZoom(nodeId);
    else this.pendingZoomId = nodeId;
  }

  // ── 화면 붙이고 떼기 ──

  protected async onOpen(): Promise<void> {
    this.contentEl.empty();
    const container = this.contentEl.createDiv({ cls: SCOPE_CLASS });
    this.root = createRoot(container);
    this.render();

    this.addAction('layout-grid', '불릿 / 보드 전환', () => this.toggleViewMode());
    // 탭을 다른 창으로 떼어 내면 메뉴·대화상자 자리도 그 창으로 옮긴다.
    this.register(
      this.containerEl.onWindowMigrated(() => {
        this.portalEl?.remove();
        this.portalEl = null;
        this.render();
      })
    );
  }

  protected async onClose(): Promise<void> {
    this.root?.unmount();
    this.root = null;
    this.portalEl?.remove();
    this.portalEl = null;
  }

  onPaneMenu(menu: Menu, source: string): void {
    super.onPaneMenu(menu, source);
    menu.addItem((item) =>
      item
        .setTitle('불릿 / 보드 전환')
        .setIcon('layout-grid')
        .onClick(() => this.toggleViewMode())
    );
    menu.addItem((item) =>
      item
        .setTitle('Markdown 노트로 내보내기')
        .setIcon('file-output')
        .onClick(() => this.exportAsMarkdown())
    );
  }

  // ── 명령 ──

  /** 줌인한 불릿이 있으면 그 불릿의 보기 방식을, 없으면 스캐폴드의 기본 보기 방식을 바꾼다. */
  toggleViewMode(): void {
    const project = this.outline.getState().project;
    if (!project) return;

    const { activeRootId, setNodesViewMode, setDefaultView } = this.editor.getState();
    const zoomed = activeRootId ? findNode(project.rootNodes, activeRootId) : null;
    const current: ViewMode = zoomed?.viewMode ?? project.defaultView ?? 'bullets';
    const next: ViewMode = current === 'bullets' ? 'board' : 'bullets';

    if (zoomed) setNodesViewMode([zoomed.id], next);
    else setDefaultView(next);
  }

  /** 파일 이름을 바꾼다. (헤더의 제목 칸에서 부른다) */
  async renameTo(title: string): Promise<void> {
    if (!this.file) return;
    // 바꾸지 못했으면 제목 칸을 원래 파일 이름으로 되돌린다.
    if ((await renameOutlineFile(this.app, this.file, title)) === 'conflict') this.render();
  }

  exportAsMarkdown(): void {
    const project = this.outline.getState().project;
    if (!project || !this.file) return;
    void createSiblingFile(
      this.app,
      this.file,
      `${this.file.basename}.md`,
      toOutlineText(project.rootNodes)
    );
  }

  // ── 내부 ──

  private roots(): OutlineNode[] {
    return this.outline.getState().project?.rootNodes ?? [];
  }

  /** 스캐폴드를 바꾸는 유일한 길. 바꾸면 옵시디언에 저장을 요청한다. */
  private updateProject(patch: { rootNodes?: OutlineNode[]; defaultView?: ViewMode }): void {
    const { project } = this.outline.getState();
    if (!project) return;
    this.outline.setState({ project: { ...project, ...patch, updatedAt: Date.now() } });
    this.requestSave();
  }

  private applyPendingZoom(): void {
    const id = this.pendingZoomId;
    if (!id || !findNode(this.roots(), id)) return;
    this.pendingZoomId = null;
    this.editor.getState().setZoom(id);
  }

  private render(): void {
    this.root?.render(<OutlineFileApp view={this} title={this.file?.basename ?? ''} />);
  }

  private getPortalRoot(): HTMLElement {
    const doc = this.containerEl.ownerDocument;
    if (!this.portalEl || this.portalEl.ownerDocument !== doc) {
      this.portalEl?.remove();
      this.portalEl = doc.body.createDiv({ cls: SCOPE_CLASS });
    }
    return this.portalEl;
  }
}
