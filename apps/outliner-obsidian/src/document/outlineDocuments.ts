/**
 * @file outlineDocuments.ts
 * @description 아웃라인 문서를 파일마다 메모리에 하나만 둔다. (미러 카드가 불릿을 직접 읽고 고치는 창구)
 *
 * 문서의 주인은 언제나 하나다.
 * - 그 파일을 연 아웃라인 탭이 있으면 탭의 문서가 주인이다. 고치면 탭이 바로 다시 그리고, 저장도 탭이 한다.
 * - 열린 탭이 없으면 여기서 파일을 읽어 문서를 들고 있고, 고치면 잠깐 모았다가 파일에 쓴다.
 * 탭이 열리고 닫히면 주인이 바뀌고, 지켜보는 쪽에는 그대로 알린다. 지켜보는 쪽은 주인이 누구인지 몰라도 된다.
 */

import { type App, type EventRef, type TAbstractFile, TFile } from 'obsidian';
import type { NodeId, OutlineNode } from '@vibe/outliner/core';
import { type OutlineEditorStore, createOutlineEditorStore } from '@vibe/outliner/editor';
import {
  type OutlineDocumentStore,
  createOutlineDocumentStore,
  readOutlineText,
  writeOutlineText,
} from './outlineDocument';
import { VIEW_TYPE_OUTLINE } from './outlineFiles';
import { OutlineFileView } from '../surfaces/tab/OutlineFileView';

/** 열린 탭이 없을 때 고친 것을 파일에 쓰기 전에 모으는 시간 */
const SAVE_DELAY = 500;

/** 열린 탭이 없을 때 여기서 들고 있는 문서 */
interface HeldDocument {
  file: TFile;
  outline: OutlineDocumentStore;
  editor: OutlineEditorStore;
  /** 마지막으로 파일에 쓴 글자 (그 저장이 돌아와도 다시 읽지 않는다) */
  lastWritten: string | null;
  saveTimer: number | null;
}

interface Entry {
  listeners: Set<() => void>;
  view: OutlineFileView | null;
  held: HeldDocument | null;
  /** 지금 주인의 구독 해제 */
  detach: (() => void) | null;
}

function findNode(nodes: OutlineNode[], nodeId: NodeId): OutlineNode | null {
  for (const node of nodes) {
    if (node.id === nodeId) return node;
    const found = findNode(node.children, nodeId);
    if (found) return found;
  }
  return null;
}

export class OutlineDocuments {
  private app: App;
  private entries = new Map<string, Entry>();
  private workspaceRefs: EventRef[] = [];
  private vaultRefs: EventRef[] = [];

  constructor(app: App) {
    this.app = app;
  }

  /** 탭이 열리고 닫히는 것, 파일이 바뀌는 것을 따라가기 시작한다. 돌려주는 함수로 그만둔다. */
  init(): () => void {
    const reattach = () => this.entries.forEach((entry, path) => this.attach(path, entry));
    this.workspaceRefs.push(
      this.app.workspace.on('layout-change', reattach),
      this.app.workspace.on('file-open', reattach)
    );
    this.vaultRefs.push(
      this.app.vault.on('modify', (file) => void this.onModify(file)),
      this.app.vault.on('rename', (file, oldPath) => this.onRename(file, oldPath))
    );
    return () => {
      this.workspaceRefs.forEach((ref) => this.app.workspace.offref(ref));
      this.vaultRefs.forEach((ref) => this.app.vault.offref(ref));
      this.workspaceRefs = [];
      this.vaultRefs = [];
      this.entries.forEach((entry) => this.release(entry));
      this.entries.clear();
    };
  }

  /** 파일의 문서를 지켜본다. 불릿이 바뀔 때마다 `listener` 를 부른다. 돌려주는 함수로 그만 본다. */
  watch(path: string, listener: () => void): () => void {
    let entry = this.entries.get(path);
    if (!entry) {
      entry = { listeners: new Set(), view: null, held: null, detach: null };
      this.entries.set(path, entry);
    }
    entry.listeners.add(listener);
    if (!entry.detach) this.attach(path, entry);
    return () => {
      const current = this.entries.get(path);
      if (!current) return;
      current.listeners.delete(listener);
      if (current.listeners.size > 0) return;
      this.release(current);
      this.entries.delete(path);
    };
  }

  /** 문서를 읽었는지 (읽었는데 불릿이 없으면 그 불릿은 지워진 것이다) */
  loaded(path: string): boolean {
    return Boolean(this.storeOf(path)?.getState().project);
  }

  /** 문서의 지금 불릿 트리. 아직 읽지 못했으면 undefined */
  rootsOf(path: string): OutlineNode[] | undefined {
    return this.storeOf(path)?.getState().project?.rootNodes;
  }

  /** 불릿의 지금 글자. 문서를 아직 읽지 못했거나 불릿이 없으면 undefined */
  textOf(path: string, nodeId: NodeId): string | undefined {
    const roots = this.storeOf(path)?.getState().project?.rootNodes;
    return roots ? findNode(roots, nodeId)?.text : undefined;
  }

  /** 불릿 글자를 고친다. 주인이 탭이면 탭에서 고친 것과 똑같다. (실행 취소도 탭에 쌓인다) */
  setText(path: string, nodeId: NodeId, text: string): boolean {
    const entry = this.entries.get(path);
    const editor = entry?.view?.editor ?? entry?.held?.editor;
    if (!editor || this.textOf(path, nodeId) === undefined) return false;
    editor.getState().updateText(nodeId, text);
    return true;
  }

  // ── 주인 정하기 ──

  private storeOf(path: string): OutlineDocumentStore | null {
    const entry = this.entries.get(path);
    return entry?.view?.outline ?? entry?.held?.outline ?? null;
  }

  private openViewOf(path: string): OutlineFileView | null {
    for (const leaf of this.app.workspace.getLeavesOfType(VIEW_TYPE_OUTLINE)) {
      const view = leaf.view;
      if (view instanceof OutlineFileView && view.file?.path === path) return view;
    }
    return null;
  }

  /** 지금 주인을 찾아 구독한다. 주인이 그대로면 아무것도 하지 않는다. */
  private attach(path: string, entry: Entry): void {
    const view = this.openViewOf(path);
    if (view && view === entry.view && entry.detach) return;
    if (!view && !entry.view && entry.held && entry.detach) return;

    entry.detach?.();
    entry.detach = null;
    const notify = () => entry.listeners.forEach((listener) => listener());

    if (view) {
      // 여기서 들고 있던 문서는 탭에 넘긴다. 아직 쓰지 않은 것이 있으면 먼저 써 둔다. (탭은 파일이 바뀌면 다시 읽는다)
      if (entry.held) void this.flush(entry.held);
      entry.held = null;
      entry.view = view;
      entry.detach = view.outline.subscribe(notify);
      notify();
      return;
    }

    entry.view = null;
    const file = this.app.vault.getAbstractFileByPath(path);
    if (!(file instanceof TFile)) return;
    const held = this.hold(file);
    entry.held = held;
    entry.detach = held.outline.subscribe(notify);
    void this.app.vault.read(file).then((text) => {
      if (entry.held !== held || held.outline.getState().project) return;
      held.outline.setState(readOutlineText(text, file.basename), true);
    });
  }

  private hold(file: TFile): HeldDocument {
    const outline = createOutlineDocumentStore();
    const held: HeldDocument = {
      file,
      outline,
      editor: createOutlineEditorStore({
        getRoots: () => outline.getState().project?.rootNodes ?? [],
        commitRoots: (rootNodes) => update({ rootNodes }),
        setDefaultView: (defaultView) => update({ defaultView }),
      }),
      lastWritten: null,
      saveTimer: null,
    };
    const update = (patch: Partial<NonNullable<ReturnType<typeof outline.getState>['project']>>) => {
      const { project } = outline.getState();
      if (!project) return;
      outline.setState({ project: { ...project, ...patch, updatedAt: Date.now() } });
      if (held.saveTimer !== null) window.clearTimeout(held.saveTimer);
      held.saveTimer = window.setTimeout(() => void this.flush(held), SAVE_DELAY);
    };
    return held;
  }

  private async flush(held: HeldDocument): Promise<void> {
    if (held.saveTimer === null) return;
    window.clearTimeout(held.saveTimer);
    held.saveTimer = null;
    const { project } = held.outline.getState();
    if (!project) return;
    const text = writeOutlineText(project, held.file.basename);
    held.lastWritten = text;
    await this.app.vault.modify(held.file, text);
  }

  private release(entry: Entry): void {
    entry.detach?.();
    entry.detach = null;
    if (entry.held) void this.flush(entry.held);
    entry.held = null;
    entry.view = null;
  }

  // ── 파일이 바뀌었을 때 ──

  /** 들고 있는 문서의 파일이 밖에서 바뀌었으면 다시 읽는다. (탭이 주인이면 탭이 알아서 다시 읽는다) */
  private async onModify(file: TAbstractFile): Promise<void> {
    const held = this.entries.get(file.path)?.held;
    if (!held || !(file instanceof TFile)) return;
    const text = await this.app.vault.read(file);
    if (text === held.lastWritten || held.saveTimer !== null) return;
    held.outline.setState(readOutlineText(text, file.basename), true);
  }

  private onRename(file: TAbstractFile, oldPath: string): void {
    const entry = this.entries.get(oldPath);
    if (!entry) return;
    this.entries.delete(oldPath);
    this.entries.set(file.path, entry);
    if (entry.held && file instanceof TFile) entry.held.file = file;
  }
}
