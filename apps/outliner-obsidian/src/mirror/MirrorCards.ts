/**
 * @file MirrorCards.ts
 * @description 미러 카드를 그 불릿을 보여 주고 고치는 창으로 만든다. (실험)
 *
 * 미러 카드에는 글자가 따로 없다. 카드 위에 불릿 입력칸을 덮어씌우고, 그 칸은 불릿 하나를 읽고 고친다.
 * 아웃라인 탭과 카드가 같은 문서(OutlineDocuments)를 보므로, 어디서 치든 다른 쪽이 같은 순간에 바뀐다.
 * - 한 번 누르면 카드를 고르고(끌기·선택 맞추기 그대로), 두 번 누르면 입력칸에 글자를 친다. (캔버스 텍스트 카드와 같다)
 * - 옵시디언이 그리는 카드 내용은 감춰 둔다. 카드 데이터의 글자는 플러그인이 꺼졌을 때 보일 예비용으로만 맞춰 둔다.
 * - 글자만 같아서 미러로 본 카드는 처음 볼 때 불릿 id 를 심어 진짜 미러로 만든다.
 * 캔버스 카드의 내부 구조는 옵시디언의 공개 API 밖이라, 옵시디언이 바뀌면 동작하지 않을 수 있다.
 */

import type { App, EventRef, TFile } from 'obsidian';
import type { NodeId } from '@vibe/outliner-core';
import type { OutlineDocuments } from '../document/outlineDocuments';
import type { CanvasInstance, CanvasNode } from '../surfaces/entries/CanvasSelectionSync';
import { type MirrorIndex, toRawCard } from './mirrorIndex';

/** 입력칸을 올린 카드 (옵시디언의 카드 내용을 감춘다) */
const LIVE_CLASS = 'vibe-outliner-mirror-live';
/** 카드 데이터의 예비 글자를 맞추기 전에 기다리는 시간 */
const CACHE_DELAY = 800;

interface LiveCanvasNode extends CanvasNode {
  contentEl?: HTMLElement;
}

interface CanvasLeafView {
  file?: TFile | null;
  canvas?: CanvasInstance & { deselectAll?: () => void };
  containerEl: HTMLElement;
}

interface Target {
  path: string;
  nodeId: NodeId;
}

/** 불릿은 한 줄이다. */
function toBulletText(text: string): string {
  return text.replace(/\s*\n\s*/g, ' ');
}

/** 카드 하나에 올린 불릿 입력칸 */
class MirrorCardEditor {
  readonly path: string;
  readonly nodeId: NodeId;
  private card: LiveCanvasNode;
  private canvas: CanvasLeafView['canvas'] & object;
  private documents: OutlineDocuments;
  private onMissing: () => void;
  private el: HTMLElement;
  private input: HTMLTextAreaElement;
  private unwatch: () => void;
  private cacheTimer: number | null = null;

  constructor(
    card: LiveCanvasNode,
    canvas: CanvasLeafView['canvas'] & object,
    target: Target,
    documents: OutlineDocuments,
    onMissing: () => void
  ) {
    this.card = card;
    this.canvas = canvas;
    this.path = target.path;
    this.nodeId = target.nodeId;
    this.documents = documents;
    this.onMissing = onMissing;

    const doc = card.nodeEl.ownerDocument;
    this.el = doc.createElement('div');
    this.el.className = 'vibe-outliner-mirror-editor';
    this.input = doc.createElement('textarea');
    this.input.className = 'vibe-outliner-mirror-input';
    this.input.spellcheck = false;
    this.input.tabIndex = -1;
    this.input.value = card.getData().text ?? '';
    this.el.appendChild(this.input);
    this.bindEvents();

    this.ensureMounted();
    this.unwatch = documents.watch(this.path, () => this.render());
    this.render();
  }

  /** 옵시디언이 카드를 다시 그려 입력칸이 떨어졌으면 다시 붙인다. */
  ensureMounted(): void {
    const host = this.card.contentEl?.parentElement ?? this.card.nodeEl;
    if (this.el.parentElement !== host) host.appendChild(this.el);
    this.card.nodeEl.classList.add(LIVE_CLASS);
  }

  destroy(): void {
    this.writeCache();
    if (this.cacheTimer !== null) window.clearTimeout(this.cacheTimer);
    this.unwatch();
    this.el.remove();
    this.card.nodeEl.classList.remove(LIVE_CLASS);
  }

  private get focused(): boolean {
    return this.input.ownerDocument.activeElement === this.input;
  }

  /** 불릿 글자를 입력칸에 보인다. 치고 있는 입력칸은 건드리지 않는다. (그 글자가 곧 불릿 글자다) */
  private render(): void {
    const text = this.documents.textOf(this.path, this.nodeId);
    if (text === undefined) {
      // 문서를 읽었는데 불릿이 없으면 지워진 불릿이다. 카드는 보통 카드로 돌아간다.
      if (this.documents.loaded(this.path)) this.onMissing();
      this.input.readOnly = true;
      return;
    }
    this.input.readOnly = false;
    if (!this.focused && this.input.value !== text) this.input.value = text;
    if (!this.focused) this.scheduleCache();
  }

  private bindEvents(): void {
    const { el, input } = this;
    // 두 번 누르면 옵시디언의 카드 편집 대신 불릿 입력칸에 글자를 친다.
    el.addEventListener('dblclick', (event) => {
      event.stopPropagation();
      event.preventDefault();
      if (input.readOnly) return;
      input.focus();
      input.setSelectionRange(input.value.length, input.value.length);
    });
    // 치는 동안에는 캔버스가 누르기·휠·키를 가져가지 않게 한다. (끌기, 카드 지우기 단축키 등)
    for (const type of ['pointerdown', 'mousedown', 'wheel'] as const) {
      el.addEventListener(type, (event) => {
        if (this.focused) event.stopPropagation();
      });
    }
    input.addEventListener('focus', () => {
      // 고른 카드가 있으면 지우기 키가 카드를 지운다. 치는 동안에는 고른 것을 비워 둔다.
      this.canvas.deselectAll?.();
    });
    input.addEventListener('keydown', (event) => {
      event.stopPropagation();
      if (event.isComposing) return;
      if (event.key === 'Escape' || (event.key === 'Enter' && !event.shiftKey)) {
        event.preventDefault();
        input.blur();
      }
    });
    input.addEventListener('input', () => {
      const text = toBulletText(input.value);
      if (text !== input.value) input.value = text;
      this.documents.setText(this.path, this.nodeId, text);
    });
    input.addEventListener('blur', () => this.writeCache());
  }

  private scheduleCache(): void {
    if (this.cacheTimer !== null) window.clearTimeout(this.cacheTimer);
    this.cacheTimer = window.setTimeout(() => this.writeCache(), CACHE_DELAY);
  }

  /** 카드 데이터의 예비 글자를 불릿 글자로 맞춘다. (플러그인이 꺼져도 카드에 글자가 보이게) */
  private writeCache(): void {
    if (this.cacheTimer !== null) window.clearTimeout(this.cacheTimer);
    this.cacheTimer = null;
    if (this.focused || !this.card.nodeEl.isConnected) return;
    const text = this.documents.textOf(this.path, this.nodeId);
    const data = this.card.getData();
    if (text === undefined || data.text === text) return;
    this.card.setData({ ...data, text });
    this.canvas.requestSave();
  }
}

export class MirrorCards {
  private app: App;
  private index: MirrorIndex;
  private documents: OutlineDocuments;
  private editors = new Map<LiveCanvasNode, MirrorCardEditor>();
  /** 가리키는 불릿이 지워진 카드 -> 그 불릿 (색인이 바뀔 때까지 다시 올리지 않는다) */
  private orphans = new Map<LiveCanvasNode, NodeId>();
  private observers = new Map<HTMLElement, MutationObserver>();
  private eventRefs: EventRef[] = [];
  private scanPending = false;

  constructor(app: App, index: MirrorIndex, documents: OutlineDocuments) {
    this.app = app;
    this.index = index;
    this.documents = documents;
  }

  init(): () => void {
    this.scan();
    const schedule = () => this.scheduleScan();
    this.eventRefs.push(
      this.app.workspace.on('layout-change', schedule),
      this.app.workspace.on('active-leaf-change', schedule)
    );
    const offIndex = this.index.onChange(() => {
      this.orphans.clear();
      this.scheduleScan();
    });
    return () => {
      offIndex();
      this.eventRefs.forEach((ref) => this.app.workspace.offref(ref));
      this.eventRefs = [];
      this.observers.forEach((observer) => observer.disconnect());
      this.observers.clear();
      this.editors.forEach((editor) => editor.destroy());
      this.editors.clear();
    };
  }

  /** 캔버스가 카드를 그리고 지우는 동안 여러 번 불리므로, 다음 프레임에 한 번만 본다. */
  private scheduleScan(): void {
    if (this.scanPending) return;
    this.scanPending = true;
    requestAnimationFrame(() => {
      this.scanPending = false;
      this.scan();
    });
  }

  private scan(): void {
    const present = new Set<LiveCanvasNode>();
    const containers = new Set<HTMLElement>();
    for (const leaf of this.app.workspace.getLeavesOfType('canvas')) {
      const view = leaf.view as unknown as CanvasLeafView;
      const canvas = view.canvas;
      if (!canvas?.nodes) continue;
      containers.add(view.containerEl);
      this.observe(view.containerEl);
      for (const card of canvas.nodes.values()) {
        present.add(card);
        this.update(canvas, card);
      }
    }
    for (const [card, editor] of this.editors) {
      if (present.has(card)) continue;
      editor.destroy();
      this.editors.delete(card);
    }
    for (const [container, observer] of this.observers) {
      if (containers.has(container)) continue;
      observer.disconnect();
      this.observers.delete(container);
    }
  }

  /** 카드가 새로 그려지거나 화면 안으로 들어오면 입력칸을 다시 본다. */
  private observe(container: HTMLElement): void {
    if (this.observers.has(container)) return;
    const observer = new MutationObserver(() => this.scheduleScan());
    observer.observe(container, { childList: true, subtree: true });
    this.observers.set(container, observer);
  }

  private update(canvas: CanvasLeafView['canvas'] & object, card: LiveCanvasNode): void {
    const target = this.targetOf(canvas, card);
    const current = this.editors.get(card);
    if (current && (!target || current.path !== target.path || current.nodeId !== target.nodeId)) {
      current.destroy();
      this.editors.delete(card);
    }
    if (!target || this.orphans.get(card) === target.nodeId) return;

    const existing = this.editors.get(card);
    if (existing) {
      existing.ensureMounted();
      return;
    }
    const editor = new MirrorCardEditor(card, canvas, target, this.documents, () => {
      this.orphans.set(card, target.nodeId);
      this.editors.get(card)?.destroy();
      this.editors.delete(card);
    });
    // 만드는 동안 지워진 불릿으로 밝혀졌으면 바로 내린다.
    if (this.orphans.get(card) === target.nodeId) editor.destroy();
    else this.editors.set(card, editor);
  }

  /** 카드가 미러인 불릿과 그 파일. 미러가 아니면 null */
  private targetOf(canvas: CanvasLeafView['canvas'] & object, card: LiveCanvasNode): Target | null {
    const raw = toRawCard(card.getData());
    if (!raw || raw.type !== 'text') return null;
    if (raw.link) {
      if (raw.link.off) return null;
      // 아직 저장 안 된 새 불릿은 색인에 없으니, 카드에 적어 둔 파일을 쓴다.
      const path = this.index.bullet(raw.link.nodeId)?.outlinePath ?? raw.link.file;
      return path ? { path, nodeId: raw.link.nodeId } : null;
    }
    const nodeId = this.index.resolve(raw);
    const bullet = nodeId ? this.index.bullet(nodeId) : undefined;
    if (!nodeId || !bullet) return null;
    // 글자만 같아서 미러로 본 카드: 처음 볼 때 한 번 불릿 id 를 심어 진짜 미러로 만든다.
    card.setData({ ...card.getData(), vibeOutline: { nodeId, file: bullet.outlinePath } });
    canvas.requestSave();
    return { path: bullet.outlinePath, nodeId };
  }
}
