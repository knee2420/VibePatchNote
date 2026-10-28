/**
 * @file SidePeek.ts
 * @description 불릿 ↔ 캔버스 카드를 오른쪽 반쪽 화면에 열기 (노션의 옆으로 열기처럼, 실험)
 * - 불릿 메뉴 "캔버스에서 보기": 짝 카드가 있는 캔버스를 오른쪽에 열고, 그 카드를 골라 줌인한다.
 * - 카드 도구 막대 단추·우클릭 메뉴 "아웃라인에서 보기": 짝 불릿이 있는 아웃라인을 오른쪽에 열고, 그 불릿을 골라 스크롤한다.
 *
 * 짝을 찾는 규칙은 CanvasSelectionSync 와 같다. (카드의 vibeOutline.nodeId, 없으면 글자가 같은 텍스트 카드)
 * 짝이 여러 개(여러 캔버스, 여러 아웃라인)면 고르는 창을 띄우고, 하나면 바로 연다.
 * 고른 짝이 다른 칸에 이미 열려 있으면 새로 열지 않고 그 칸을 앞으로 가져온다.
 * 오른쪽 화면은 한 칸을 계속 다시 쓴다. (열 때마다 화면이 반씩 쪼개지지 않게)
 */

import {
  type App,
  type EventRef,
  type Menu,
  type Plugin,
  type TFile,
  FileView,
  type WorkspaceLeaf,
  Notice,
  setIcon,
} from 'obsidian';
import {
  type FlatOutlineTree,
  type NodeId,
  type OutlineNode,
  ROOT_ID,
  getFlatNode,
} from '@vibe/outliner-core';
import { parseProjectFile } from '@vibe/outliner-dto';
import type { OutlineHostMenuItem } from '@vibe/outliner-editor';
import { OUTLINE_EXTENSION, VIEW_TYPE_OUTLINE } from '../../document/outlineFiles';
import { PairPickerModal } from '../../host/dialogs/PairPickerModal';
import { OutlineFileView } from '../tab/OutlineFileView';
import {
  type CanvasInstance,
  type CanvasNode,
  type CanvasSelectionSync,
  linkOf,
  textOf,
  waitFor,
  zoomToCard,
} from './CanvasSelectionSync';

const PEEK_BUTTON_CLASS = 'vibe-outliner-peek-button';
const PEEK_LABEL_TO_OUTLINE = '아웃라인에서 보기';
const PEEK_LABEL_TO_CANVAS = '캔버스에서 보기';
/** 막 연 파일이 다 올라오기를 기다리는 프레임 수 (약 2초) */
const LOAD_FRAMES = 120;

/** 우클릭 메뉴로 넘어오는 카드는 자기 캔버스를 안다. */
type CardWithCanvas = CanvasNode & { canvas?: CanvasInstance };

interface CanvasNodeMenuEvents {
  on: (name: 'canvas:node-menu', callback: (menu: Menu, card: CardWithCanvas) => void) => EventRef;
}

/** 캔버스 파일(JSON) 안의 카드가 이 불릿의 짝인지. 0: 아님, 2: 심어 둔 id 가 같음, 1: 글자가 같음 */
function cardMatch(card: unknown, nodeId: NodeId, text: string | undefined): 0 | 1 | 2 {
  const data = card as { type?: unknown; text?: unknown; vibeOutline?: { nodeId?: unknown } };
  const linked = data.vibeOutline?.nodeId;
  if (typeof linked === 'string' && linked !== '') return linked === nodeId ? 2 : 0;
  return text && data.type === 'text' && typeof data.text === 'string' && data.text.trim() === text
    ? 1
    : 0;
}

function canvasOf(leaf: WorkspaceLeaf): CanvasInstance | null {
  const canvas = (leaf.view as { canvas?: CanvasInstance }).canvas;
  return canvas?.nodes ? canvas : null;
}

function findBulletByText(tree: FlatOutlineTree, text: string): NodeId | null {
  for (const node of tree.nodes.values()) {
    if (node.id !== ROOT_ID && node.text.trim() === text) return node.id;
  }
  return null;
}

function findInNodes(nodes: OutlineNode[], match: (node: OutlineNode) => boolean): NodeId | null {
  for (const node of nodes) {
    if (match(node)) return node.id;
    const found = findInNodes(node.children, match);
    if (found) return found;
  }
  return null;
}

/** 짝 후보 하나: 그 파일, 지금 열려 있는 칸(없으면 null), 심어 둔 id 로 이어졌는지 */
interface PairCandidate {
  file: TFile;
  byId: boolean;
  leaf: WorkspaceLeaf | null;
}

interface CanvasCandidate extends PairCandidate {
  cardId: string;
}

interface OutlineCandidate extends PairCandidate {
  nodeId: NodeId;
}

/** 고르는 창에서 제목 아래 보이는 글자 */
function describeCandidate(candidate: PairCandidate): string {
  const folder = candidate.file.parent?.isRoot() ? '/' : (candidate.file.parent?.path ?? '');
  return [folder, candidate.leaf ? '열려 있음' : null, candidate.byId ? 'id로 연결됨' : '글자만 같음']
    .filter(Boolean)
    .join(' · ');
}

function fileOf(leaf: WorkspaceLeaf): TFile | null {
  return leaf.view instanceof FileView ? leaf.view.file : null;
}

function focusCard(canvas: CanvasInstance, card: CanvasNode): void {
  canvas.selectOnly(card);
  zoomToCard(canvas, card);
}

export class SidePeek {
  private app: App;
  private sync: CanvasSelectionSync;
  /** 옆으로 열 때 다시 쓰는 오른쪽 칸 */
  private asideLeaf: WorkspaceLeaf | null = null;

  constructor(app: App, sync: CanvasSelectionSync) {
    this.app = app;
    this.sync = sync;
  }

  register(plugin: Plugin): void {
    this.sync.onCardMenu = (canvas, card, menuEl) => this.addPeekButton(canvas, card, menuEl);

    const workspace = this.app.workspace as unknown as CanvasNodeMenuEvents;
    plugin.registerEvent(
      workspace.on('canvas:node-menu', (menu, card) => {
        if (!linkOf(card) && !textOf(card)) return;
        menu.addItem((item) =>
          item
            .setTitle(PEEK_LABEL_TO_OUTLINE)
            .setIcon('panel-right')
            .onClick(() => void this.openOutlineForCard(card, card.canvas))
        );
      })
    );
  }

  /** 불릿 메뉴에 더할 항목 */
  bulletMenuItems(view: OutlineFileView, nodeId: NodeId): OutlineHostMenuItem[] {
    return [{ label: PEEK_LABEL_TO_CANVAS, run: () => void this.openCanvasForBullet(view, nodeId) }];
  }

  // ── 불릿 → 캔버스 ──

  /** 짝 카드가 있는 캔버스가 하나면 바로 열고, 여러 개면 고르게 한다. */
  async openCanvasForBullet(view: OutlineFileView, nodeId: NodeId): Promise<void> {
    const text = getFlatNode(view.editor.getState().getTree(), nodeId)?.text.trim();
    const candidates = this.sortCandidates(await this.findCanvasCandidates(nodeId, text));
    const open = (candidate: CanvasCandidate) => void this.openCanvasCandidate(view, candidate);

    if (candidates.length === 0) {
      new Notice('이 불릿과 짝인 캔버스 카드가 없습니다.');
    } else if (candidates.length === 1 && candidates[0]) {
      open(candidates[0]);
    } else {
      new PairPickerModal(
        this.app,
        `${PEEK_LABEL_TO_CANVAS} — 짝 카드가 있는 캔버스 ${candidates.length}개`,
        candidates.map((candidate) => ({
          value: candidate,
          title: candidate.file.basename,
          note: describeCandidate(candidate),
        })),
        open
      ).open();
    }
  }

  /**
   * 짝 카드가 있는 캔버스를 모두 찾는다. 캔버스 하나에 후보 하나 (id 로 이어진 카드를 먼저 쓴다).
   * 열린 캔버스는 저장 전 내용까지 보이도록 화면에서 찾고, 나머지는 파일에서 찾는다.
   */
  private async findCanvasCandidates(
    nodeId: NodeId,
    text: string | undefined
  ): Promise<CanvasCandidate[]> {
    const byPath = new Map<string, CanvasCandidate>();
    const consider = (candidate: CanvasCandidate) => {
      const current = byPath.get(candidate.file.path);
      if (!current || (candidate.byId && !current.byId)) byPath.set(candidate.file.path, candidate);
    };

    const openPaths = new Set<string>();
    for (const leaf of this.app.workspace.getLeavesOfType('canvas')) {
      const canvas = canvasOf(leaf);
      const file = fileOf(leaf);
      if (!canvas || !file) continue;
      openPaths.add(file.path);
      for (const card of canvas.nodes.values()) {
        const match = cardMatch(card.getData(), nodeId, text);
        if (match > 0) consider({ file, cardId: card.id, byId: match === 2, leaf });
      }
    }

    for (const file of this.app.vault.getFiles()) {
      if (file.extension !== 'canvas' || openPaths.has(file.path)) continue;
      let nodes: unknown[] = [];
      try {
        const data = JSON.parse(await this.app.vault.cachedRead(file)) as { nodes?: unknown[] };
        nodes = Array.isArray(data.nodes) ? data.nodes : [];
      } catch {
        continue;
      }
      for (const card of nodes) {
        const match = cardMatch(card, nodeId, text);
        const cardId = (card as { id?: unknown }).id;
        if (match > 0 && typeof cardId === 'string') {
          consider({ file, cardId, byId: match === 2, leaf: null });
        }
      }
    }
    return [...byPath.values()];
  }

  /** 다른 칸에 열려 있으면 그 칸에서, 아니면(같은 탭 묶음이라 아웃라인이 가려지면) 옆 칸에 연다. */
  private async openCanvasCandidate(
    view: OutlineFileView,
    candidate: CanvasCandidate
  ): Promise<void> {
    const { leaf: openLeaf, file, cardId } = candidate;
    const leaf =
      openLeaf && openLeaf.parent !== view.leaf.parent ? openLeaf : this.asideOf(view.leaf);
    if (leaf === openLeaf) await this.app.workspace.revealLeaf(leaf);
    else if (fileOf(leaf)?.path !== file.path) await leaf.openFile(file);

    const canvas = await waitFor(
      () => (canvasOf(leaf)?.nodes.has(cardId) ? canvasOf(leaf) : null),
      LOAD_FRAMES
    );
    const card = canvas?.nodes.get(cardId);
    if (canvas && card) focusCard(canvas, card);
  }

  // ── 카드 → 아웃라인 ──

  /** 짝 불릿이 있는 아웃라인이 하나면 바로 열고, 여러 개면 고르게 한다. */
  async openOutlineForCard(card: CanvasNode, canvas?: CanvasInstance): Promise<void> {
    const linkedId = linkOf(card);
    const text = linkedId ? null : textOf(card);
    if (!linkedId && !text) return;

    const source =
      this.app.workspace.getLeavesOfType('canvas').find((leaf) => canvasOf(leaf) === canvas) ??
      this.app.workspace.getMostRecentLeaf();
    if (!source) return;

    const candidates = this.sortCandidates(
      await this.findOutlineCandidates(linkedId, text),
      card.getData().vibeOutline?.file
    );
    const open = (candidate: OutlineCandidate) => void this.openOutlineCandidate(source, candidate);

    if (candidates.length === 0) {
      new Notice('이 카드와 짝인 불릿이 없습니다.');
    } else if (candidates.length === 1 && candidates[0]) {
      open(candidates[0]);
    } else {
      new PairPickerModal(
        this.app,
        `${PEEK_LABEL_TO_OUTLINE} — 짝 불릿이 있는 아웃라인 ${candidates.length}개`,
        candidates.map((candidate) => ({
          value: candidate,
          title: candidate.file.basename,
          note: describeCandidate(candidate),
        })),
        open
      ).open();
    }
  }

  /** 짝 불릿이 있는 아웃라인을 모두 찾는다. 파일 하나에 후보 하나 (같은 글자가 여러 번 있으면 맨 위의 것). */
  private async findOutlineCandidates(
    linkedId: NodeId | null,
    text: string | null
  ): Promise<OutlineCandidate[]> {
    const byId = linkedId !== null;
    const candidates: OutlineCandidate[] = [];

    const openPaths = new Set<string>();
    for (const leaf of this.app.workspace.getLeavesOfType(VIEW_TYPE_OUTLINE)) {
      const view = leaf.view;
      if (!(view instanceof OutlineFileView) || !view.file || !view.outline.getState().project) {
        continue;
      }
      if (openPaths.has(view.file.path)) continue;
      openPaths.add(view.file.path);
      const tree = view.editor.getState().getTree();
      const nodeId = linkedId
        ? getFlatNode(tree, linkedId)
          ? linkedId
          : null
        : findBulletByText(tree, text ?? '');
      if (nodeId) candidates.push({ file: view.file, nodeId, byId, leaf });
    }

    const match = (node: OutlineNode) =>
      linkedId ? node.id === linkedId : node.text.trim() === text;
    for (const file of this.app.vault.getFiles()) {
      if (file.extension !== OUTLINE_EXTENSION || openPaths.has(file.path)) continue;
      const parsed = parseProjectFile(await this.app.vault.cachedRead(file));
      if (!parsed.success) continue;
      const nodeId = findInNodes(parsed.project.rootNodes, match);
      if (nodeId) candidates.push({ file, nodeId, byId, leaf: null });
    }
    return candidates;
  }

  /** 다른 칸에 열려 있으면 그 칸에서, 아니면(같은 탭 묶음이라 캔버스가 가려지면) 옆 칸에 연다. */
  private async openOutlineCandidate(
    source: WorkspaceLeaf,
    candidate: OutlineCandidate
  ): Promise<void> {
    const { leaf: openLeaf, file, nodeId } = candidate;
    const leaf = openLeaf && openLeaf.parent !== source.parent ? openLeaf : this.asideOf(source);
    if (leaf === openLeaf) await this.app.workspace.revealLeaf(leaf);
    else if (fileOf(leaf)?.path !== file.path) await leaf.openFile(file);

    const view = await waitFor(
      () =>
        leaf.view instanceof OutlineFileView && leaf.view.outline.getState().project
          ? leaf.view
          : null,
      LOAD_FRAMES
    );
    if (view) this.sync.revealBullet(view, nodeId);
  }

  /**
   * 후보 순서: 지금 열린 것 → 최근에 연 것 → id 로 이어진 것 → 글자만 같은 것 → 이름순.
   * `preferredPath` (카드에 적힌 아웃라인 파일) 가 있으면 맨 앞에 둔다.
   */
  private sortCandidates<T extends PairCandidate>(candidates: T[], preferredPath?: string): T[] {
    const recent = this.app.workspace.getLastOpenFiles();
    const recency = (candidate: T) => {
      const index = recent.indexOf(candidate.file.path);
      return index === -1 ? Number.MAX_SAFE_INTEGER : index;
    };
    return [...candidates].sort(
      (a, b) =>
        Number(b.file.path === preferredPath) - Number(a.file.path === preferredPath) ||
        Number(Boolean(b.leaf)) - Number(Boolean(a.leaf)) ||
        recency(a) - recency(b) ||
        Number(b.byId) - Number(a.byId) ||
        a.file.basename.localeCompare(b.file.basename)
    );
  }

  // ── 화면 ──

  /** 옆으로 열 칸: 전에 연 오른쪽 칸이 남아 있으면 다시 쓰고, 없으면 지금 칸을 세로로 나눈다. */
  private asideOf(source: WorkspaceLeaf): WorkspaceLeaf {
    const aside = this.asideLeaf;
    if (aside && aside !== source && aside.view.containerEl.isConnected) return aside;
    this.asideLeaf = this.app.workspace.createLeafBySplit(source, 'vertical');
    return this.asideLeaf;
  }

  /** 카드 도구 막대에 "아웃라인에서 보기" 단추를 더한다. */
  private addPeekButton(canvas: CanvasInstance, card: CanvasNode, menuEl: HTMLElement): void {
    menuEl.querySelector(`.${PEEK_BUTTON_CLASS}`)?.remove();
    if (!linkOf(card) && !textOf(card)) return;

    const button = menuEl.createEl('button', {
      cls: `clickable-icon ${PEEK_BUTTON_CLASS}`,
      attr: { 'aria-label': PEEK_LABEL_TO_OUTLINE, 'data-tooltip-position': 'top' },
    });
    setIcon(button, 'panel-right');
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      void this.openOutlineForCard(card, canvas);
    });
  }
}
