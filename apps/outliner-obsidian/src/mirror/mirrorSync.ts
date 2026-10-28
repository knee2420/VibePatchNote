/**
 * @file mirrorSync.ts
 * @description 미러 글자 맞추기와 미러 켜고 끄기 (실험)
 * - 불릿 글자가 바뀌면 그 불릿의 미러 카드 글자를 모두 바꾼다.
 * - 미러 카드 글자가 바뀌면 불릿 글자를 바꾼다. (그러면 다른 미러 카드도 따라 바뀐다)
 * - 글자로만 이어져 있던 카드는, 글자를 고치는 순간 짝을 잃지 않도록 불릿 id 를 심는다.
 *
 * 열린 화면끼리는 저장을 기다리지 않고 글자를 칠 때마다 바로 주고받는다.
 * - 아웃라인 탭: 문서 상태를 구독해서 바뀐 불릿을 찾는다.
 * - 캔버스: 카드 안에서 글자를 칠 때(input)와 캔버스가 저장을 요청할 때 카드를 다시 읽는다.
 * 파일이 바뀌었다는 소식(색인)은 닫힌 파일에서 온 것만 따른다. 열린 화면의 파일 저장은
 * 이미 주고받은 글자보다 늦게 도착하므로, 그것을 따르면 치고 있는 글자를 옛 글자로 덮어쓴다.
 * 닫힌 파일에 쓰는 것은 잠깐 모았다가 한 번에 쓴다.
 */

import { type App, type EventRef, TFile } from 'obsidian';
import { type NodeId, type OutlineNode, getFlatNode } from '@vibe/outliner-core';
import { parseProjectFile, serializeProjectFile } from '@vibe/outliner-dto';
import type { CanvasInstance, CanvasNode } from '../surfaces/entries/CanvasSelectionSync';
import { OutlineFileView } from '../surfaces/tab/OutlineFileView';
import {
  type MirrorChange,
  type MirrorIndex,
  type MirrorLink,
  type RawCard,
  cardKey,
  toRawCard,
} from './mirrorIndex';

interface CardPatch {
  text?: string;
  /** null 이면 미러 정보를 지운다. */
  link?: MirrorLink | null;
}

/** 캔버스 카드 가운데 이 파일이 읽는 것 (옵시디언 공개 API 밖) */
interface LiveCard extends CanvasNode {
  isEditing?: boolean;
  child?: {
    editMode?: { editor?: { getValue?: () => string } };
    editor?: { getValue?: () => string };
  };
}

interface CanvasLeafView {
  file?: TFile | null;
  canvas?: CanvasInstance;
  containerEl: HTMLElement;
}

/** 닫힌 파일에 쓰기 전에 모으는 시간 */
const FILE_WRITE_DELAY = 400;

/** 불릿은 한 줄이다. 카드 글자와 불릿 글자는 이 모양으로 견준다. */
function toBulletText(text: string): string {
  return text.replace(/\s*\n\s*/g, ' ').trim();
}

function applyCardPatch(data: Record<string, unknown>, patch: CardPatch): Record<string, unknown> {
  const next = { ...data };
  if (patch.text !== undefined) next.text = patch.text;
  if (patch.link === null) delete next.vibeOutline;
  else if (patch.link) next.vibeOutline = patch.link;
  return next;
}

function findNode(nodes: OutlineNode[], nodeId: NodeId): OutlineNode | null {
  for (const node of nodes) {
    if (node.id === nodeId) return node;
    const found = findNode(node.children, nodeId);
    if (found) return found;
  }
  return null;
}

function textsOf(nodes: OutlineNode[], into = new Map<NodeId, string>()): Map<NodeId, string> {
  for (const node of nodes) {
    into.set(node.id, node.text);
    textsOf(node.children, into);
  }
  return into;
}

/** 사용자가 지금 글자를 치고 있는 카드인지 */
function isEditing(card: LiveCard): boolean {
  return Boolean(card.isEditing) || card.nodeEl.contains(card.nodeEl.ownerDocument.activeElement);
}

/**
 * 카드의 지금 글자. 고치는 중이면 카드 안 편집기의 글자를 읽는다. (카드 데이터는 늦게 따라온다)
 * 편집기는 막 열릴 때 잠깐 비어 있으므로, 빈 글자는 사용자가 그 카드에 친 뒤(`typed`)에만 믿는다.
 */
function liveTextOf(card: LiveCard, typed: boolean): string | undefined {
  const data = card.getData();
  if (data.type !== 'text' || !isEditing(card)) return data.text;
  const editor = card.child?.editMode?.editor ?? card.child?.editor;
  const value = editor?.getValue?.();
  if (typeof value !== 'string' || (value === '' && !typed)) return data.text;
  return value;
}

/** 열린 캔버스 칸에서 그 파일의 캔버스 */
export function openCanvasOf(app: App, canvasPath: string): CanvasInstance | null {
  for (const leaf of app.workspace.getLeavesOfType('canvas')) {
    const view = leaf.view as unknown as CanvasLeafView;
    if (view.file?.path === canvasPath && view.canvas?.nodes) return view.canvas;
  }
  return null;
}

/** 열린 아웃라인 탭 가운데 그 파일을 연 것 (내용을 읽은 것만) */
export function openOutlineViewOf(app: App, outlinePath: string): OutlineFileView | null {
  for (const leaf of app.workspace.getLeavesOfType('vibe-outline')) {
    const view = leaf.view;
    if (view instanceof OutlineFileView && view.file?.path === outlinePath) {
      if (view.outline.getState().project) return view;
    }
  }
  return null;
}

interface SeenCard {
  canvasPath: string;
  cardId: string;
  nodeId: NodeId;
  /** 불릿 모양으로 고친 글자 */
  text: string;
}

interface WatchedCanvas {
  view: CanvasLeafView;
  restore: () => void;
}

export class MirrorSync {
  private app: App;
  private index: MirrorIndex;
  private eventRefs: EventRef[] = [];

  /** 불릿마다 마지막으로 맞춘 글자 (불릿 모양). 같은 글자를 다시 보내지 않는다. */
  private synced = new Map<NodeId, string>();
  /** 카드마다 직전에 본 짝과 글자. 글자로만 이어진 카드가 고쳐져도 짝을 잃지 않게 한다. */
  private seenCards = new Map<string, SeenCard>();
  /** 닫힌 아웃라인 파일의 불릿마다 직전에 본 글자 */
  private seenBullets = new Map<NodeId, string>();
  /** 고치는 중이라 아직 불릿 id 를 심지 못한 카드 -> 불릿 */
  private pendingTags = new Map<string, NodeId>();

  /** 지켜보는 아웃라인 탭 -> 구독 해제, 직전에 본 불릿 글자 */
  private outlineSubs = new Map<OutlineFileView, () => void>();
  private outlineTexts = new Map<OutlineFileView, Map<NodeId, string>>();
  private pendingOutlines = new Set<OutlineFileView>();
  /** 지켜보는 캔버스 -> 그 칸, 원래대로 돌리기 */
  private canvases = new Map<CanvasInstance, WatchedCanvas>();
  /** 다음 프레임에 다시 읽을 카드 (null 이면 캔버스의 모든 카드) */
  private pendingCanvases = new Map<CanvasInstance, Set<LiveCard> | null>();
  /** 이번에 고치기 시작한 뒤 사용자가 글자를 친 카드 */
  private typedCards = new WeakSet<LiveCard>();

  /** 닫힌 파일에 쓸 것: 경로 -> 카드 id -> 고칠 것 / 불릿 id -> 글자 */
  private cardWrites = new Map<string, Map<string, CardPatch>>();
  private bulletWrites = new Map<string, Map<NodeId, string>>();
  private writeTimer: number | null = null;

  constructor(app: App, index: MirrorIndex) {
    this.app = app;
    this.index = index;
  }

  /** 지켜보기 시작한다. 돌려주는 함수로 그만 본다. */
  init(): () => void {
    const offIndex = this.index.onChange((change) => this.onIndexChange(change));
    this.scan();
    const scan = () => this.scan();
    this.eventRefs.push(
      this.app.workspace.on('layout-change', scan),
      this.app.workspace.on('active-leaf-change', scan),
      this.app.workspace.on('file-open', scan)
    );
    return () => {
      offIndex();
      this.eventRefs.forEach((ref) => this.app.workspace.offref(ref));
      this.eventRefs = [];
      this.outlineSubs.forEach((unsubscribe) => unsubscribe());
      this.outlineSubs.clear();
      this.canvases.forEach(({ restore }) => restore());
      this.canvases.clear();
      void this.flushWrites();
    };
  }

  // ── 켜고 끄기 ──

  /** 카드 하나의 미러를 켜거나 끈다. 켤 때는 불릿 글자로 카드 글자를 맞춘다. */
  async setCardMirror(canvasPath: string, cardId: string, on: boolean): Promise<void> {
    const card = this.cardData(canvasPath, cardId);
    if (!card) return;
    const nodeId = on ? card.link?.nodeId : (this.index.resolve(card) ?? card.link?.nodeId);
    if (!nodeId) return;
    const bulletText = this.bulletText(nodeId);

    const link: MirrorLink = { ...this.linkTo(nodeId), ...(on ? {} : { off: true }) };
    const text =
      on && bulletText !== undefined && bulletText !== toBulletText(card.text ?? '')
        ? bulletText
        : undefined;
    await this.writeCard(canvasPath, cardId, { link, ...(text !== undefined ? { text } : {}) });
  }

  /** 불릿의 미러를 모두 끄거나, 꺼 둔 것을 모두 다시 켠다. 바꾼 카드 수를 돌려준다. */
  async setBulletMirrors(nodeId: NodeId, on: boolean): Promise<number> {
    const cards = on ? this.index.offMirrorsOf(nodeId) : this.index.mirrorsOf(nodeId);
    for (const card of cards) await this.setCardMirror(card.canvasPath, card.cardId, on);
    return cards.length;
  }

  // ── 지켜볼 화면 찾기 ──

  private scan(): void {
    const views = new Set(
      this.app.workspace
        .getLeavesOfType('vibe-outline')
        .map((leaf) => leaf.view)
        .filter((view): view is OutlineFileView => view instanceof OutlineFileView)
    );
    for (const [view, unsubscribe] of this.outlineSubs) {
      if (views.has(view)) continue;
      unsubscribe();
      this.outlineSubs.delete(view);
      this.outlineTexts.delete(view);
    }
    views.forEach((view) => this.watchOutline(view));

    const canvasViews = new Map<CanvasInstance, CanvasLeafView>();
    for (const leaf of this.app.workspace.getLeavesOfType('canvas')) {
      const view = leaf.view as unknown as CanvasLeafView;
      if (view.canvas?.nodes) canvasViews.set(view.canvas, view);
    }
    for (const [canvas, watched] of this.canvases) {
      if (canvasViews.has(canvas)) continue;
      watched.restore();
      this.canvases.delete(canvas);
    }
    canvasViews.forEach((view, canvas) => this.watchCanvas(canvas, view));
  }

  private watchOutline(view: OutlineFileView): void {
    if (this.outlineSubs.has(view)) return;
    const roots = view.outline.getState().project?.rootNodes;
    if (roots) this.outlineTexts.set(view, textsOf(roots));
    const unsubscribe = view.outline.subscribe((state, previous) => {
      if (state.project?.rootNodes !== previous.project?.rootNodes) this.scheduleOutline(view);
    });
    this.outlineSubs.set(view, unsubscribe);
  }

  private watchCanvas(canvas: CanvasInstance, view: CanvasLeafView): void {
    if (this.canvases.has(canvas)) return;
    const restores: (() => void)[] = [];

    // 카드 안에서 글자를 칠 때마다: 친 자리의 카드만 다시 읽는다.
    const onInput = (event: Event) => {
      const card = this.cardAt(canvas, event.target);
      if (card) this.typedCards.add(card);
      this.scheduleCanvas(canvas, card);
    };
    // 카드에서 빠져나오면: 미뤄 둔 불릿 id 심기를 한다.
    const onBlur = () => this.scheduleCanvas(canvas, null);
    view.containerEl.addEventListener('input', onInput, true);
    view.containerEl.addEventListener('focusout', onBlur, true);
    restores.push(() => {
      view.containerEl.removeEventListener('input', onInput, true);
      view.containerEl.removeEventListener('focusout', onBlur, true);
    });

    // 그 밖의 바뀜(되돌리기, 붙여 넣기 등)은 캔버스가 저장을 요청하는 것으로 안다.
    const target = canvas as unknown as Record<string, unknown>;
    const original = target.requestSave;
    if (typeof original === 'function') {
      const hadOwn = Object.prototype.hasOwnProperty.call(target, 'requestSave');
      const schedule = () => this.scheduleCanvas(canvas, null);
      target.requestSave = function (this: unknown, ...args: unknown[]) {
        const result = (original as (...a: unknown[]) => unknown).apply(this, args);
        schedule();
        return result;
      };
      restores.push(() => {
        if (hadOwn) target.requestSave = original;
        else delete target.requestSave;
      });
    }

    this.canvases.set(canvas, { view, restore: () => restores.forEach((restore) => restore()) });
    this.rememberOpenCanvas(canvas);
  }

  private cardAt(canvas: CanvasInstance, target: EventTarget | null): LiveCard | null {
    if (!(target instanceof Node)) return null;
    for (const card of canvas.nodes.values()) {
      if (card.nodeEl.contains(target)) return card;
    }
    return null;
  }

  // ── 열린 아웃라인 탭 → 미러 카드 ──

  /** 한 번의 입력에 상태가 여러 번 바뀌므로, 다음 프레임에 한 번만 본다. */
  private scheduleOutline(view: OutlineFileView): void {
    if (this.pendingOutlines.has(view)) return;
    this.pendingOutlines.add(view);
    requestAnimationFrame(() => {
      this.pendingOutlines.delete(view);
      this.checkOutline(view);
    });
  }

  private checkOutline(view: OutlineFileView): void {
    const roots = view.outline.getState().project?.rootNodes;
    if (!roots) {
      this.outlineTexts.delete(view);
      return;
    }
    const before = this.outlineTexts.get(view);
    const now = textsOf(roots);
    this.outlineTexts.set(view, now);
    // 처음 읽은 것이면 견줄 것이 없다.
    if (!before) return;

    for (const [nodeId, raw] of now) {
      const old = before.get(nodeId);
      if (old === undefined || old === raw) continue;
      const text = toBulletText(raw);
      if (text === (this.synced.get(nodeId) ?? toBulletText(old))) continue;
      if (this.cardsFor(nodeId).length === 0) continue;
      this.propagate(nodeId, text, null);
    }
  }

  // ── 열린 캔버스 카드 → 불릿 ──

  private scheduleCanvas(canvas: CanvasInstance, card: LiveCard | null): void {
    const pending = this.pendingCanvases.get(canvas);
    if (pending === null) return;
    if (pending) {
      if (card) pending.add(card);
      else this.pendingCanvases.set(canvas, null);
      return;
    }
    this.pendingCanvases.set(canvas, card ? new Set([card]) : null);
    requestAnimationFrame(() => {
      const cards = this.pendingCanvases.get(canvas);
      this.pendingCanvases.delete(canvas);
      this.checkCanvas(canvas, cards ?? canvas.nodes.values());
    });
  }

  private checkCanvas(canvas: CanvasInstance, cards: Iterable<LiveCard>): void {
    const canvasPath = this.canvases.get(canvas)?.view.file?.path;
    if (!canvasPath) return;
    for (const card of cards) {
      if (!isEditing(card)) this.typedCards.delete(card);
      const raw = toRawCard({ ...card.getData(), text: liveTextOf(card, this.typedCards.has(card)) });
      if (raw) this.observeCard(canvasPath, raw, true);
    }
    this.flushPendingTags(canvasPath, canvas);
  }

  /** 열린 캔버스의 카드들을 지금 모습으로 기억한다. (아무것도 보내지 않는다) */
  private rememberOpenCanvas(canvas: CanvasInstance): void {
    const canvasPath = this.canvases.get(canvas)?.view.file?.path;
    if (!canvasPath) return;
    for (const card of canvas.nodes.values()) {
      const raw = toRawCard({ ...card.getData(), text: liveTextOf(card, this.typedCards.has(card)) });
      if (raw) this.observeCard(canvasPath, raw, false);
    }
  }

  /** 카드 하나를 보고 짝과 글자를 기억한다. 짝은 그대로인데 글자가 바뀌었으면 불릿과 다른 미러에 보낸다. */
  private observeCard(canvasPath: string, card: RawCard, send: boolean): void {
    const key = cardKey(canvasPath, card.id);
    const seen = this.seenCards.get(key);
    // 글자로만 이어져 있던 카드는 글자를 고치면 짝을 못 찾으므로, 직전의 짝을 이어서 쓴다.
    const nodeId =
      this.index.resolve(card) ??
      (seen && !card.link && card.type === 'text' ? seen.nodeId : null);
    if (!nodeId) {
      this.seenCards.delete(key);
      this.pendingTags.delete(key);
      return;
    }
    const text = toBulletText(card.text ?? '');
    this.seenCards.set(key, { canvasPath, cardId: card.id, nodeId, text });
    // 글자를 다 지운 것도 바뀐 것이다. (불릿과 다른 미러도 비운다)
    if (!send || !seen || seen.nodeId !== nodeId || seen.text === text) return;

    if (!card.link) this.tagCard(canvasPath, card.id, nodeId);
    if (text !== this.syncedText(nodeId)) this.propagate(nodeId, text, key);
  }

  /** 글자로만 이어진 카드에 불릿 id 를 심는다. 고치는 중인 카드는 다 고친 뒤에 심는다. */
  private tagCard(canvasPath: string, cardId: string, nodeId: NodeId): void {
    const canvas = openCanvasOf(this.app, canvasPath);
    if (canvas) {
      this.pendingTags.set(cardKey(canvasPath, cardId), nodeId);
      return;
    }
    this.queueCardWrite(canvasPath, cardId, { link: this.linkTo(nodeId) });
  }

  private flushPendingTags(canvasPath: string, canvas: CanvasInstance): void {
    for (const [key, nodeId] of this.pendingTags) {
      const seen = this.seenCards.get(key);
      if (seen?.canvasPath !== canvasPath) continue;
      const card = canvas.nodes.get(seen.cardId) as LiveCard | undefined;
      if (!card) {
        this.pendingTags.delete(key);
        continue;
      }
      if (isEditing(card)) continue;
      this.pendingTags.delete(key);
      const data = card.getData();
      if (data.vibeOutline?.nodeId === nodeId) continue;
      card.setData({ ...data, vibeOutline: this.linkTo(nodeId) });
      canvas.requestSave();
    }
  }

  // ── 닫힌 파일이 바뀌었을 때 (색인) ──

  private onIndexChange(change: MirrorChange): void {
    if (change.kind === 'all') this.rememberAll();
    else if (change.kind === 'outline') this.onOutlineFileChanged(change.path);
    else this.onCanvasFileChanged(change.path);
    // 색인이 바뀌면 글자로 새로 이어진 카드가 생길 수 있다. 열린 캔버스의 카드를 다시 기억해 둔다.
    this.canvases.forEach((_, canvas) => this.rememberOpenCanvas(canvas));
  }

  private rememberAll(): void {
    this.seenBullets.clear();
    for (const file of this.app.vault.getFiles()) {
      if (file.extension === 'outline') {
        for (const bullet of this.index.bulletsOf(file.path)) {
          this.seenBullets.set(bullet.nodeId, bullet.text);
        }
      } else if (file.extension === 'canvas') {
        for (const card of this.index.cardsOf(file.path)) this.observeCard(file.path, card, false);
      }
    }
  }

  private onOutlineFileChanged(outlinePath: string): void {
    const bullets = this.index.bulletsOf(outlinePath);
    // 열린 탭의 저장은 이미 주고받은 글자다. 기억만 고친다.
    const open = openOutlineViewOf(this.app, outlinePath) !== null;
    for (const bullet of bullets) {
      const before = this.seenBullets.get(bullet.nodeId);
      this.seenBullets.set(bullet.nodeId, bullet.text);
      if (open || before === undefined) continue;
      const text = toBulletText(bullet.text);
      if (text === toBulletText(before) || text === this.syncedText(bullet.nodeId)) continue;
      this.propagate(bullet.nodeId, text, null);
    }
  }

  private onCanvasFileChanged(canvasPath: string): void {
    // 열린 캔버스의 저장은 이미 주고받은 글자다. (열린 캔버스는 위에서 화면으로 다시 기억한다)
    if (openCanvasOf(this.app, canvasPath)) return;
    for (const card of this.index.cardsOf(canvasPath)) this.observeCard(canvasPath, card, true);
  }

  // ── 보내기 ──

  /** 불릿 하나의 글자를 불릿과 모든 미러 카드에 맞춘다. `from` 은 글자가 바뀐 카드 (불릿이면 null) */
  private propagate(nodeId: NodeId, text: string, from: string | null): void {
    this.synced.set(nodeId, text);
    if (from !== null) this.pushToBullet(nodeId, text);
    const link = this.linkTo(nodeId);
    for (const card of this.cardsFor(nodeId)) {
      if (cardKey(card.canvasPath, card.cardId) !== from) {
        this.pushToCard(card.canvasPath, card.cardId, text, link);
      }
    }
  }

  private pushToBullet(nodeId: NodeId, text: string): void {
    const bullet = this.index.bullet(nodeId);
    if (!bullet) return;
    const view = openOutlineViewOf(this.app, bullet.outlinePath);
    if (view) {
      const current = getFlatNode(view.editor.getState().getTree(), nodeId)?.text;
      if (current === undefined || toBulletText(current) === text) return;
      // 이 변화가 구독으로 돌아와도 다시 보내지 않도록 먼저 기억해 둔다.
      this.outlineTexts.get(view)?.set(nodeId, text);
      view.editor.getState().updateText(nodeId, text);
      return;
    }
    this.seenBullets.set(nodeId, text);
    let writes = this.bulletWrites.get(bullet.outlinePath);
    if (!writes) this.bulletWrites.set(bullet.outlinePath, (writes = new Map()));
    writes.set(nodeId, text);
    this.scheduleWrites();
  }

  private pushToCard(canvasPath: string, cardId: string, text: string, link: MirrorLink): void {
    const key = cardKey(canvasPath, cardId);
    const canvas = openCanvasOf(this.app, canvasPath);
    const card = canvas?.nodes.get(cardId) as LiveCard | undefined;
    if (canvas && card) {
      // 누군가 그 카드를 고치는 중이면 건드리지 않는다. (나중에 친 글자가 이긴다)
      if (isEditing(card)) return;
      this.seenCards.set(key, { canvasPath, cardId, nodeId: link.nodeId, text });
      this.pendingTags.delete(key);
      const data = card.getData();
      if (toBulletText(data.text ?? '') === text && data.vibeOutline?.nodeId === link.nodeId) return;
      card.setData({ ...data, text, vibeOutline: link });
      canvas.requestSave();
      return;
    }
    this.seenCards.set(key, { canvasPath, cardId, nodeId: link.nodeId, text });
    this.queueCardWrite(canvasPath, cardId, { text, link });
  }

  /** 불릿의 미러 카드들: 색인이 아는 것과, 글자로 이어졌다가 지금 막 고쳐진 것 */
  private cardsFor(nodeId: NodeId): { canvasPath: string; cardId: string }[] {
    const cards = new Map<string, { canvasPath: string; cardId: string }>();
    for (const card of this.index.mirrorsOf(nodeId)) {
      cards.set(cardKey(card.canvasPath, card.cardId), card);
    }
    for (const [key, card] of this.seenCards) {
      if (card.nodeId === nodeId) cards.set(key, card);
    }
    return [...cards.values()];
  }

  /** 불릿의 지금 글자 (열린 탭이 있으면 탭의 것) */
  private bulletText(nodeId: NodeId): string | undefined {
    const bullet = this.index.bullet(nodeId);
    if (!bullet) return undefined;
    const view = openOutlineViewOf(this.app, bullet.outlinePath);
    const live = view ? getFlatNode(view.editor.getState().getTree(), nodeId)?.text : undefined;
    return toBulletText(live ?? bullet.text);
  }

  private syncedText(nodeId: NodeId): string | undefined {
    return this.synced.get(nodeId) ?? this.bulletText(nodeId);
  }

  private linkTo(nodeId: NodeId): MirrorLink {
    const bullet = this.index.bullet(nodeId);
    return { nodeId, ...(bullet ? { file: bullet.outlinePath } : {}) };
  }

  /** 카드 데이터 (열린 캔버스면 화면의 것) */
  private cardData(canvasPath: string, cardId: string): RawCard | null {
    const card = openCanvasOf(this.app, canvasPath)?.nodes.get(cardId);
    if (card) return toRawCard(card.getData());
    return this.index.cardsOf(canvasPath).find((c) => c.id === cardId) ?? null;
  }

  // ── 쓰기 ──

  async writeCard(canvasPath: string, cardId: string, patch: CardPatch): Promise<void> {
    const canvas = openCanvasOf(this.app, canvasPath);
    const node = canvas?.nodes.get(cardId);
    if (canvas && node) {
      node.setData(applyCardPatch(node.getData(), patch) as ReturnType<typeof node.getData>);
      canvas.requestSave();
      return;
    }
    this.queueCardWrite(canvasPath, cardId, patch);
    await this.flushWrites();
  }

  private queueCardWrite(canvasPath: string, cardId: string, patch: CardPatch): void {
    let writes = this.cardWrites.get(canvasPath);
    if (!writes) this.cardWrites.set(canvasPath, (writes = new Map()));
    writes.set(cardId, { ...writes.get(cardId), ...patch });
    this.scheduleWrites();
  }

  private scheduleWrites(): void {
    if (this.writeTimer !== null) window.clearTimeout(this.writeTimer);
    this.writeTimer = window.setTimeout(() => void this.flushWrites(), FILE_WRITE_DELAY);
  }

  private async flushWrites(): Promise<void> {
    if (this.writeTimer !== null) window.clearTimeout(this.writeTimer);
    this.writeTimer = null;
    const cardWrites = this.cardWrites;
    const bulletWrites = this.bulletWrites;
    this.cardWrites = new Map();
    this.bulletWrites = new Map();

    for (const [canvasPath, patches] of cardWrites) {
      const file = this.app.vault.getAbstractFileByPath(canvasPath);
      if (!(file instanceof TFile)) continue;
      await this.app.vault.process(file, (content) => {
        try {
          const data = JSON.parse(content) as { nodes?: Record<string, unknown>[] };
          const nodes = data.nodes ?? [];
          for (const [cardId, patch] of patches) {
            const index = nodes.findIndex((n) => n.id === cardId);
            const current = nodes[index];
            if (current) nodes[index] = applyCardPatch(current, patch);
          }
          return JSON.stringify(data, null, '\t');
        } catch {
          return content;
        }
      });
    }

    for (const [outlinePath, texts] of bulletWrites) {
      const file = this.app.vault.getAbstractFileByPath(outlinePath);
      if (!(file instanceof TFile)) continue;
      await this.app.vault.process(file, (content) => {
        const parsed = parseProjectFile(content);
        if (!parsed.success) return content;
        for (const [nodeId, text] of texts) {
          const node = findNode(parsed.project.rootNodes, nodeId);
          if (!node) continue;
          node.text = text;
          node.updatedAt = Date.now();
        }
        return serializeProjectFile(parsed.project);
      });
    }
  }
}
