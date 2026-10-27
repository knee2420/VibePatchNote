/**
 * @file CanvasSelectionSync.ts
 * @description 아웃라인 탭 ↔ 캔버스 카드 선택 맞추기 (실험)
 * - 불릿에 커서를 두거나 불릿을 고르면, 열린 캔버스에서 짝 카드를 골라 그쪽으로 줌인한다.
 * - 캔버스에서 카드 하나를 고르면, 열린 아웃라인 탭에서 짝 불릿을 골라 화면 가운데로 스크롤한다.
 *
 * 짝: 카드 데이터의 `vibeOutline.nodeId` 가 불릿 id 와 같으면 짝이다.
 * 태그가 없는 텍스트 카드는 글자가 똑같은 불릿과 짝으로 본다.
 * 캔버스의 선택·줌·카드 만들기는 옵시디언의 공개 API 밖의 기능이라, 옵시디언이 바뀌면 동작하지 않을 수 있다.
 */

import type { App, EventRef } from 'obsidian';
import { type NodeId, ROOT_ID, getFlatNode, isInSubtree } from '@vibe/outliner-core';
import { VIEW_TYPE_OUTLINE } from '../../document/outlineFiles';
import { OutlineFileView } from '../tab/OutlineFileView';

/** 카드 데이터에 심는 짝 정보. 파일 경로는 사람이 알아보라고 적어 두고, 짝은 nodeId 로만 찾는다. */
export interface OutlineCardLink {
  nodeId: NodeId;
  file?: string;
}

interface CanvasNodeData {
  id: string;
  type: string;
  text?: string;
  vibeOutline?: OutlineCardLink;
  [key: string]: unknown;
}

export interface CanvasNode {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  getData: () => CanvasNodeData;
  setData: (data: CanvasNodeData) => void;
}

interface CanvasBBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export interface CanvasInstance {
  nodes: Map<string, CanvasNode>;
  selection: Set<unknown>;
  selectOnly: (item: CanvasNode) => void;
  zoomToSelection: () => void;
  zoomToBbox?: (bbox: CanvasBBox) => void;
  requestSave: () => void;
  posCenter?: () => { x: number; y: number };
  createTextNode?: (options: {
    pos: { x: number; y: number };
    size: { width: number; height: number };
    text: string;
    focus?: boolean;
    save?: boolean;
  }) => CanvasNode;
}

/** 캔버스의 선택이 바뀌는 길목. 있는 것만 감싼다. */
const SELECTION_METHODS = ['updateSelection', 'selectOnly', 'select', 'deselect', 'deselectAll'];

export function linkOf(card: CanvasNode): NodeId | null {
  const nodeId = card.getData().vibeOutline?.nodeId;
  return typeof nodeId === 'string' && nodeId !== '' ? nodeId : null;
}

function textOf(card: CanvasNode): string | null {
  const data = card.getData();
  return data.type === 'text' && typeof data.text === 'string' ? data.text.trim() : null;
}

/** 열린 캔버스들 (아직 불러오지 않은 탭은 뺀다) */
export function openCanvases(app: App): CanvasInstance[] {
  return app.workspace
    .getLeavesOfType('canvas')
    .map((leaf) => (leaf.view as { canvas?: CanvasInstance }).canvas)
    .filter((canvas): canvas is CanvasInstance => Boolean(canvas?.nodes));
}

/** 고른 것 가운데 카드만 (선은 뺀다) */
export function selectedCards(canvas: CanvasInstance): CanvasNode[] {
  return [...canvas.selection].filter(
    (item): item is CanvasNode => canvas.nodes.get((item as CanvasNode).id) === item
  );
}

export class CanvasSelectionSync {
  private app: App;
  private eventRefs: EventRef[] = [];
  /** 지켜보는 아웃라인 탭 -> 구독 해제 */
  private outlineSubs = new Map<OutlineFileView, () => void>();
  /** 감싼 캔버스 -> 원래대로 돌리기 */
  private canvasRestores = new Map<CanvasInstance, () => void>();
  /** 캔버스마다 마지막으로 본 단일 선택 카드 (같은 선택을 두 번 처리하지 않는다) */
  private lastCard = new Map<CanvasInstance, string | null>();
  private pendingChecks = new Set<CanvasInstance>();
  /** 우리가 불릿을 고르는 중이면 그 변화를 다시 캔버스로 보내지 않는다. */
  private applyingToOutline = false;

  /** 명령이 쓰는 값: 마지막으로 만진 아웃라인 탭과, 탭마다 마지막으로 커서를 둔 불릿 */
  lastView: OutlineFileView | null = null;
  private lastBullet = new Map<OutlineFileView, NodeId>();

  constructor(app: App) {
    this.app = app;
  }

  init(): void {
    this.scan();
    this.eventRefs.push(
      this.app.workspace.on('layout-change', () => this.scan()),
      this.app.workspace.on('active-leaf-change', () => this.scan()),
      this.app.workspace.on('file-open', () => this.scan())
    );
  }

  destroy(): void {
    this.eventRefs.forEach((ref) => this.app.workspace.offref(ref));
    this.eventRefs = [];
    this.outlineSubs.forEach((unsubscribe) => unsubscribe());
    this.outlineSubs.clear();
    this.canvasRestores.forEach((restore) => restore());
    this.canvasRestores.clear();
  }

  /** 탭에서 마지막으로 커서를 둔 불릿. 명령 팔레트를 열면 입력칸 포커스가 떨어져서 따로 기억해 둔다. */
  bulletOf(view: OutlineFileView): NodeId | null {
    const { focusedNodeId } = view.editor.getState();
    return focusedNodeId ?? this.lastBullet.get(view) ?? null;
  }

  // ── 지켜볼 화면 찾기 ──

  private scan(): void {
    const views = new Set(
      this.app.workspace
        .getLeavesOfType(VIEW_TYPE_OUTLINE)
        .map((leaf) => leaf.view)
        .filter((view): view is OutlineFileView => view instanceof OutlineFileView)
    );
    for (const [view, unsubscribe] of this.outlineSubs) {
      if (!views.has(view)) {
        unsubscribe();
        this.outlineSubs.delete(view);
      }
    }
    views.forEach((view) => this.watchOutline(view));

    const canvases = new Set(openCanvases(this.app));
    for (const [canvas, restore] of this.canvasRestores) {
      if (!canvases.has(canvas)) {
        restore();
        this.canvasRestores.delete(canvas);
      }
    }
    canvases.forEach((canvas) => this.watchCanvas(canvas));
  }

  private watchOutline(view: OutlineFileView): void {
    if (this.outlineSubs.has(view)) return;
    const unsubscribe = view.editor.subscribe((state, previous) => {
      let nodeId: NodeId | null = null;
      if (state.focusedNodeId && state.focusedNodeId !== previous.focusedNodeId) {
        nodeId = state.focusedNodeId;
      } else if (
        state.selectedNodeIds !== previous.selectedNodeIds &&
        state.selectedNodeIds.length === 1
      ) {
        nodeId = state.selectedNodeIds[0] ?? null;
      }
      if (!nodeId) return;
      this.lastView = view;
      this.lastBullet.set(view, nodeId);
      if (!this.applyingToOutline) this.revealInCanvases(view, nodeId);
    });
    this.outlineSubs.set(view, unsubscribe);
  }

  private watchCanvas(canvas: CanvasInstance): void {
    if (this.canvasRestores.has(canvas)) return;
    const target = canvas as unknown as Record<string, unknown>;
    const restores: (() => void)[] = [];
    const schedule = () => this.scheduleCanvasCheck(canvas);

    for (const name of SELECTION_METHODS) {
      const original = target[name];
      if (typeof original !== 'function') continue;
      const hadOwn = Object.prototype.hasOwnProperty.call(target, name);
      target[name] = function (this: unknown, ...args: unknown[]) {
        const result = (original as (...a: unknown[]) => unknown).apply(this, args);
        schedule();
        return result;
      };
      restores.push(() => {
        if (hadOwn) target[name] = original;
        else delete target[name];
      });
    }
    this.canvasRestores.set(canvas, () => restores.forEach((restore) => restore()));
  }

  // ── 캔버스 → 아웃라인 ──

  /** 한 동작 안에서 선택이 여러 번 바뀌므로, 다음 프레임에 한 번만 본다. */
  private scheduleCanvasCheck(canvas: CanvasInstance): void {
    if (this.pendingChecks.has(canvas)) return;
    this.pendingChecks.add(canvas);
    requestAnimationFrame(() => {
      this.pendingChecks.delete(canvas);
      this.checkCanvasSelection(canvas);
    });
  }

  private checkCanvasSelection(canvas: CanvasInstance): void {
    const cards = selectedCards(canvas);
    const card = cards.length === 1 ? cards[0] : undefined;
    if (!card) {
      this.lastCard.set(canvas, null);
      return;
    }
    if (this.lastCard.get(canvas) === card.id) return;
    this.lastCard.set(canvas, card.id);

    const link = linkOf(card);
    const text = link ? null : textOf(card);
    for (const view of this.outlineSubs.keys()) {
      const nodeId = link ?? (text ? this.findBulletByText(view, text) : null);
      if (nodeId && getFlatNode(view.editor.getState().getTree(), nodeId)) {
        this.revealBullet(view, nodeId);
      }
    }
  }

  private findBulletByText(view: OutlineFileView, text: string): NodeId | null {
    for (const node of view.editor.getState().getTree().nodes.values()) {
      if (node.id !== ROOT_ID && node.text.trim() === text) return node.id;
    }
    return null;
  }

  /** 불릿이 보이게(줌 밖이면 줌아웃, 접힌 조상은 펼침) 한 뒤 골라 두고 가운데로 스크롤한다. 입력 포커스는 가져오지 않는다. */
  private revealBullet(view: OutlineFileView, nodeId: NodeId): void {
    const state = view.editor.getState();
    const tree = state.getTree();
    if (state.activeRootId && !isInSubtree(tree, state.activeRootId, nodeId)) state.setZoom(null);

    const folded: NodeId[] = [];
    for (let id = getFlatNode(tree, nodeId)?.parentId; id && id !== ROOT_ID; ) {
      const parent = getFlatNode(tree, id);
      if (parent?.isFolded) folded.push(id);
      id = parent?.parentId ?? null;
    }

    this.applyingToOutline = true;
    try {
      if (folded.length > 0) {
        state.applyPatch(folded.map((id) => ({ op: 'set_fold', id, isFolded: false }) as const));
      }
      state.selectNodes([nodeId]);
    } finally {
      this.applyingToOutline = false;
    }
    this.lastView = view;
    this.lastBullet.set(view, nodeId);

    requestAnimationFrame(() => {
      const row = view.contentEl.querySelector(`[data-node-id="${CSS.escape(nodeId)}"]`);
      row?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    });
  }

  // ── 아웃라인 → 캔버스 ──

  private revealInCanvases(view: OutlineFileView, nodeId: NodeId): void {
    const text = getFlatNode(view.editor.getState().getTree(), nodeId)?.text.trim();
    for (const canvas of this.canvasRestores.keys()) {
      const cards = [...canvas.nodes.values()];
      const card =
        cards.find((c) => linkOf(c) === nodeId) ??
        (text ? cards.find((c) => !linkOf(c) && textOf(c) === text) : undefined);
      if (!card) continue;
      if (canvas.selection.size === 1 && canvas.selection.has(card)) continue;

      // 우리가 고른 카드는 캔버스 → 아웃라인으로 되돌려 보내지 않는다.
      this.lastCard.set(canvas, card.id);
      canvas.selectOnly(card);
      zoomToCard(canvas, card);
    }
  }
}

/** 카드가 화면의 1/3쯤 차지하게 주변까지 넣어 줌한다. (카드만 꽉 차게 줌하면 너무 크다) */
export function zoomToCard(canvas: CanvasInstance, card: CanvasNode): void {
  if (!canvas.zoomToBbox) {
    canvas.zoomToSelection();
    return;
  }
  const pad = Math.max(card.width, card.height);
  canvas.zoomToBbox({
    minX: card.x - pad,
    minY: card.y - pad,
    maxX: card.x + card.width + pad,
    maxY: card.y + card.height + pad,
  });
}
