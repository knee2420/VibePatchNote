/**
 * @file outlineCanvas.ts
 * @description 캔버스 뷰: 아웃라인을 짝 캔버스 파일에 마인드맵으로 펼친다. (실험)
 *
 * 한눈에 읽히게 하는 것이 목적이라 Heptabase 화이트보드의 원칙을 따른다.
 * - 마인드맵: 부모 카드 오른쪽에 자식들을 위아래로 붙여 쌓는다. 선은 부모 오른쪽 → 자식 왼쪽이라 서로 엇갈리지 않는다.
 * - 섹션: 자식이 있는 맨 위 불릿은 이름 붙은 섹션(캔버스 그룹)으로 감싼다. 자식이 없으면 카드 하나로 두었다가
 *   자식이 생기면 섹션이 된다. 맨 위 불릿들은 위에서 아래로 쌓는다.
 * - 화살촉 없는 가는 선, 차분한 카드 (모양은 styles.css 의 `.vibe-outliner-canvas-view`)
 *
 * 짝 캔버스: 아웃라인 옆의 같은 이름 `.canvas` 파일. 없으면 만든다.
 * 카드는 모두 미러라 어디서 고쳐도 같은 불릿이다.
 * 불릿 구조가 바뀌면 다시 늘어놓는다. 단, 사용자가 손으로 옮긴 카드는 그 자리에 둔다.
 * (캔버스 뷰가 놓은 자리를 카드에 적어 두고, 지금 자리와 같으면 손대지 않은 카드로 본다)
 * 손으로 옮긴 카드라도 부모나 섹션이 바뀌면 옛 자리는 뜻이 없으므로 새 자리로 옮긴다.
 * 캔버스 뷰가 만든 것은 id 앞머리(`vo-`)로 알아본다. 사용자가 더한 카드·선·그룹은 건드리지 않는다.
 */

import { type App, type EventRef, type WorkspaceLeaf, TFile } from 'obsidian';
import type { NodeId, OutlineNode } from '@vibe/outliner/core';
import type { OutlineDocuments } from '../document/outlineDocuments';
import type { CanvasInstance } from '../surfaces/entries/CanvasSelectionSync';
import { fileHeightOf } from './mirrorCardContent';
import { openCanvasOf } from './mirrorSwitch';

const CARD_PREFIX = 'vo-';
const EDGE_PREFIX = 'vo-e-';
const SECTION_PREFIX = 'vo-g-';
/** 짝 캔버스 화면에 붙여 카드·선·섹션 모양을 바꾸는 클래스 */
const VIEW_CLASS = 'vibe-outliner-canvas-view';

const CARD_WIDTH = 240;
/** 부모 카드와 자식 카드 사이 (가로) */
const COLUMN_GAP = 72;
/** 형제 카드 사이 (세로) */
const SIBLING_GAP = 16;
/** 섹션 안쪽 여백, 섹션 사이 */
const SECTION_PADDING = 40;
const SECTION_GAP = 96;
const MIN_HEIGHT = 52;
const LINE_HEIGHT = 24;
/** 카드 안쪽 위아래 여백 합 */
const PADDING_Y = 24;
/** 글자와 딸린 파일 사이 */
const FILE_GAP = 8;
/** 카드 한 줄에 들어가는 글자 폭 (한글 한 글자 = 1, 영문·숫자 = 0.55) */
const LINE_UNITS = 13;
/** 불릿 구조가 바뀐 뒤 캔버스를 고치기까지 기다리는 시간 */
const SYNC_DELAY = 300;

interface Point {
  x: number;
  y: number;
}

interface CanvasCardData {
  id: string;
  type: string;
  text?: string;
  label?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  /** 카드: 미러 정보와, 캔버스 뷰가 마지막으로 놓은 자리 */
  vibeOutline?: {
    nodeId?: string;
    file?: string;
    off?: boolean;
    /** 캔버스 뷰가 마지막으로 놓은 자리 */
    auto?: Point;
    /** 그때의 부모와 맨 위 조상 (`부모|맨위`) */
    under?: string;
    origin?: Point;
  };
  /** 섹션: 맨 위 불릿과, 마인드맵 전체를 놓는 기준점 */
  vibeOutlineSection?: { nodeId: string; origin: Point };
  [key: string]: unknown;
}

interface CanvasEdgeData {
  id: string;
  fromNode: string;
  toNode: string;
  fromSide?: string;
  toSide?: string;
  toEnd?: string;
  [key: string]: unknown;
}

interface CanvasData {
  nodes: CanvasCardData[];
  edges: CanvasEdgeData[];
  [key: string]: unknown;
}

/** 캔버스 화면에서 이 파일이 쓰는 것 (옵시디언 공개 API 밖) */
interface DataCanvas extends CanvasInstance {
  getData?: () => CanvasData;
  setData?: (data: CanvasData) => void;
}

interface Bullet {
  node: OutlineNode;
  parentId: NodeId | null;
  /** 맨 위 조상 (자기가 맨 위면 자기) */
  rootId: NodeId;
}

interface Box extends Point {
  width: number;
  height: number;
}

/** 아웃라인의 짝 캔버스 경로 */
export function companionCanvasPath(outlinePath: string): string {
  return outlinePath.replace(/\.outline$/, '.canvas');
}

function companionOutlinePath(canvasPath: string): string {
  return canvasPath.replace(/\.canvas$/, '.outline');
}

function flatten(
  nodes: OutlineNode[],
  parentId: NodeId | null = null,
  rootId: NodeId | null = null,
  into: Bullet[] = []
): Bullet[] {
  for (const node of nodes) {
    into.push({ node, parentId, rootId: rootId ?? node.id });
    flatten(node.children, node.id, rootId ?? node.id, into);
  }
  return into;
}

/**
 * 캔버스를 다시 그려야 하는 것: 불릿 구조, 딸린 파일(카드 높이가 바뀐다), 섹션 이름(맨 위 불릿 글자).
 * 다른 글자는 미러 카드가 보여 준다.
 */
function structureOf(roots: OutlineNode[]): string {
  const tree = flatten(roots)
    .map((b) => `${b.node.id}<${b.parentId ?? ''}:${b.node.file?.target ?? ''}`)
    .join(',');
  return `${tree}|${roots.map((root) => root.text).join('\u0000')}`;
}

/** 카드 높이: 글자 줄 수로 어림잡고, 딸린 파일(이미지·PDF 미리보기)이 있으면 그만큼 더한다. */
function cardHeight(node: OutlineNode): number {
  let units = 0;
  for (const char of node.text) units += char.charCodeAt(0) > 0x2e80 ? 1 : 0.55;
  const lines = Math.max(1, Math.ceil(units / LINE_UNITS));
  const fileHeight = fileHeightOf(node.file);
  return Math.max(MIN_HEIGHT, PADDING_Y + lines * LINE_HEIGHT + (fileHeight ? fileHeight + FILE_GAP : 0));
}

/**
 * 마인드맵 자리: 맨 위 불릿마다 왼쪽에서 오른쪽으로 뻗는 나무. 부모는 자식 묶음의 세로 가운데에 둔다.
 * 맨 위 불릿들은 기준점에서 위에서 아래로 쌓는다. 섹션이 될 것(자식이 있는 것)만 섹션 여백을 둔다.
 */
function layoutMindMap(roots: OutlineNode[], origin: Point): Map<NodeId, Box> {
  const heights = new Map<NodeId, number>();
  const blockOf = (nodes: OutlineNode[]): number =>
    nodes.reduce((sum, node) => sum + heightOf(node), 0) + SIBLING_GAP * Math.max(0, nodes.length - 1);
  const heightOf = (node: OutlineNode): number => {
    let height = heights.get(node.id);
    if (height === undefined) {
      height = Math.max(cardHeight(node), blockOf(node.children));
      heights.set(node.id, height);
    }
    return height;
  };

  const boxes = new Map<NodeId, Box>();
  const place = (node: OutlineNode, x: number, top: number) => {
    const span = heightOf(node);
    const height = cardHeight(node);
    boxes.set(node.id, { x, y: Math.round(top + (span - height) / 2), width: CARD_WIDTH, height });
    let childTop = top + (span - blockOf(node.children)) / 2;
    for (const child of node.children) {
      place(child, x + CARD_WIDTH + COLUMN_GAP, childTop);
      childTop += heightOf(child) + SIBLING_GAP;
    }
  };

  let top = origin.y;
  for (const root of roots) {
    const padding = hasSection(root) ? SECTION_PADDING : 0;
    place(root, origin.x + SECTION_PADDING, top + padding);
    top += heightOf(root) + padding * 2 + (padding ? SECTION_GAP : SECTION_GAP / 2);
  }
  return boxes;
}

/** 섹션으로 감싸는 맨 위 불릿: 자식이 있을 때만 */
function hasSection(root: OutlineNode): boolean {
  return root.children.length > 0;
}

function isGeneratedCard(card: CanvasCardData): boolean {
  return card.type === 'text' && card.id.startsWith(CARD_PREFIX) && Boolean(card.vibeOutline?.nodeId);
}

/** 사용자가 손으로 옮기지 않은 카드인지 (예전에 만든, 자리를 적어 두지 않은 카드도 손대지 않은 것으로 본다) */
function isUntouched(card: CanvasCardData): boolean {
  const auto = card.vibeOutline?.auto;
  return !auto || (Math.abs(auto.x - card.x) < 1 && Math.abs(auto.y - card.y) < 1);
}

function underOf(bullet: Bullet): string {
  return `${bullet.parentId ?? ''}|${bullet.rootId}`;
}

/**
 * 캔버스 데이터를 불릿 구조에 맞춘다. 바꾼 것이 있으면 true.
 * `tidy` 면 손으로 옮긴 카드까지 모두 마인드맵 자리로 되돌린다.
 */
export function syncCanvasData(
  data: CanvasData,
  roots: OutlineNode[],
  outlinePath: string,
  tidy = false
): boolean {
  const before = JSON.stringify(data);
  const bullets = flatten(roots);
  const alive = new Set(bullets.map((b) => b.node.id));

  // 지워진 불릿의 카드·섹션은 캔버스 뷰가 만든 것만 지운다.
  const removed = new Set<string>();
  data.nodes = data.nodes.filter((card) => {
    const nodeId = card.vibeOutlineSection?.nodeId ?? card.vibeOutline?.nodeId;
    if (!card.id.startsWith(CARD_PREFIX) || !nodeId || alive.has(nodeId)) return true;
    removed.add(card.id);
    return false;
  });

  // 기준점: 섹션이나 캔버스 뷰가 만든 카드에 적어 둔 것. 처음이면 사용자가 둔 카드들 오른쪽.
  const origin = data.nodes.find((card) => card.vibeOutlineSection)?.vibeOutlineSection?.origin ??
    data.nodes.find((card) => card.vibeOutline?.origin)?.vibeOutline?.origin ?? {
    x: data.nodes
      .filter((card) => !card.id.startsWith(CARD_PREFIX))
      .reduce((max, card) => Math.max(max, card.x + card.width + SECTION_GAP), 0),
    y: 0,
  };
  const boxes = layoutMindMap(roots, origin);

  // 불릿마다 이 캔버스의 카드 (사용자가 직접 만든 미러 카드도 그 불릿의 카드로 친다)
  // 미러를 끈 카드도 그 불릿의 카드다. 새 카드를 또 만들지 않고, 자리와 선도 그대로 맞춘다.
  const cardOf = new Map<NodeId, CanvasCardData>();
  for (const card of data.nodes) {
    const link = card.vibeOutline;
    if (card.type !== 'text' || !link?.nodeId) continue;
    if (link.file !== undefined && link.file !== outlinePath) continue;
    const current = cardOf.get(link.nodeId);
    if (!current || (current.vibeOutline?.off && !link.off)) cardOf.set(link.nodeId, card);
  }

  for (const bullet of bullets) {
    const box = boxes.get(bullet.node.id);
    if (!box) continue;
    const auto = { x: box.x, y: box.y };
    const under = underOf(bullet);
    const card = cardOf.get(bullet.node.id);
    if (!card) {
      const created: CanvasCardData = {
        id: `${CARD_PREFIX}${bullet.node.id}`,
        type: 'text',
        text: bullet.node.text,
        ...box,
        vibeOutline: { nodeId: bullet.node.id, file: outlinePath, auto, under, origin },
      };
      data.nodes.push(created);
      cardOf.set(bullet.node.id, created);
    } else if (
      isGeneratedCard(card) &&
      (tidy || isUntouched(card) || card.vibeOutline?.under !== under)
    ) {
      Object.assign(card, box);
      card.vibeOutline = { ...card.vibeOutline, auto, under, origin };
    } else if (isGeneratedCard(card)) {
      // 손으로 옮긴 카드도 높이는 내용(딸린 파일)에 맞춘다.
      card.height = box.height;
    }
  }

  // 섹션: 자식이 있는 맨 위 불릿의 마인드맵 카드들을 감싼다. (손으로 옮긴 카드까지 감싸도록 지금 자리로 잰다)
  // 자식이 모두 사라진 맨 위 불릿의 섹션은 지운다. (카드 하나로 돌아간다)
  const sectioned = new Set(roots.filter(hasSection).map((root) => root.id));
  const sections = new Map<NodeId, CanvasCardData>();
  data.nodes = data.nodes.filter((card) => {
    const nodeId = card.vibeOutlineSection?.nodeId;
    if (card.type !== 'group' || !card.id.startsWith(SECTION_PREFIX) || !nodeId) return true;
    if (!sectioned.has(nodeId)) return false;
    sections.set(nodeId, card);
    return true;
  });
  for (const root of roots) {
    if (!sectioned.has(root.id)) continue;
    const cards = bullets.filter((b) => b.rootId === root.id).flatMap((b) => cardOf.get(b.node.id) ?? []);
    if (cards.length === 0) continue;
    const left = Math.min(...cards.map((c) => c.x)) - SECTION_PADDING;
    const top = Math.min(...cards.map((c) => c.y)) - SECTION_PADDING;
    const right = Math.max(...cards.map((c) => c.x + c.width)) + SECTION_PADDING;
    const bottom = Math.max(...cards.map((c) => c.y + c.height)) + SECTION_PADDING;
    const bounds = { x: left, y: top, width: right - left, height: bottom - top };
    const section = sections.get(root.id);
    if (section) {
      Object.assign(section, bounds, { label: root.text, vibeOutlineSection: { nodeId: root.id, origin } });
    } else {
      data.nodes.push({
        id: `${SECTION_PREFIX}${root.id}`,
        type: 'group',
        label: root.text,
        ...bounds,
        vibeOutlineSection: { nodeId: root.id, origin },
      });
    }
  }
  // 섹션은 카드 뒤에 그려지도록 맨 앞에 둔다.
  data.nodes.sort((a, b) => Number(b.type === 'group') - Number(a.type === 'group'));

  // 선: 부모 오른쪽 → 자식 왼쪽, 화살촉 없이. 캔버스 뷰가 만든 선만 불릿 구조로 다시 만든다.
  const edges: CanvasEdgeData[] = [];
  for (const bullet of bullets) {
    const from = bullet.parentId ? cardOf.get(bullet.parentId) : undefined;
    const to = cardOf.get(bullet.node.id);
    if (!from || !to) continue;
    edges.push({
      id: `${EDGE_PREFIX}${from.id}-${to.id}`,
      fromNode: from.id,
      fromSide: 'right',
      toNode: to.id,
      toSide: 'left',
      toEnd: 'none',
    });
  }
  data.edges = [
    ...data.edges.filter(
      (edge) => !edge.id.startsWith(EDGE_PREFIX) && !removed.has(edge.fromNode) && !removed.has(edge.toNode)
    ),
    ...edges,
  ];

  return JSON.stringify(data) !== before;
}

function readCanvasData(text: string): CanvasData {
  try {
    const parsed = JSON.parse(text) as Partial<CanvasData>;
    return {
      ...parsed,
      nodes: Array.isArray(parsed.nodes) ? parsed.nodes : [],
      edges: Array.isArray(parsed.edges) ? parsed.edges : [],
    };
  } catch {
    return { nodes: [], edges: [] };
  }
}

interface Watch {
  unwatch: () => void;
  /** 마지막으로 캔버스에 맞춘 불릿 구조 */
  structure: string | null;
  timer: number | null;
}

/** 캔버스를 오른쪽 칸에 열고 카드로 가는 창구 (SidePeek) */
export interface CanvasOpener {
  openCard: (fromLeaf: WorkspaceLeaf, canvasPath: string, cardId: string | null) => Promise<void>;
}

export class OutlineCanvas {
  private app: App;
  private documents: OutlineDocuments;
  private opener: CanvasOpener;
  /** 열려 있는 짝 캔버스 -> 그 아웃라인 문서 지켜보기 */
  private watches = new Map<string, Watch>();
  private eventRefs: EventRef[] = [];

  constructor(app: App, documents: OutlineDocuments, opener: CanvasOpener) {
    this.app = app;
    this.documents = documents;
    this.opener = opener;
  }

  init(): () => void {
    this.scan();
    this.eventRefs.push(this.app.workspace.on('layout-change', () => this.scan()));
    return () => {
      this.eventRefs.forEach((ref) => this.app.workspace.offref(ref));
      this.eventRefs = [];
      this.watches.forEach((watch) => this.stop(watch));
      this.watches.clear();
      for (const leaf of this.app.workspace.getLeavesOfType('canvas')) {
        leaf.view.containerEl.classList.remove(VIEW_CLASS);
      }
    };
  }

  /** 캔버스 뷰 열기: 짝 캔버스를 (없으면 만들어) 불릿 구조에 맞추고 오른쪽 칸에 연다. */
  async open(
    leaf: WorkspaceLeaf,
    outlineFile: TFile,
    roots: OutlineNode[],
    focusId: NodeId | null
  ): Promise<void> {
    const canvasPath = companionCanvasPath(outlineFile.path);
    const existing = this.app.vault.getAbstractFileByPath(canvasPath);
    let data: CanvasData;
    if (existing instanceof TFile) {
      data = await this.apply(canvasPath, outlineFile.path, roots);
    } else {
      data = { nodes: [], edges: [] };
      syncCanvasData(data, roots, outlineFile.path);
      await this.app.vault.create(canvasPath, JSON.stringify(data, null, '\t'));
    }
    const card = focusId
      ? data.nodes.find((c) => c.vibeOutline?.nodeId === focusId && !c.vibeOutline.off)
      : undefined;
    await this.opener.openCard(leaf, canvasPath, card?.id ?? null);
  }

  /** 손으로 옮긴 카드까지 모두 마인드맵 자리로 다시 늘어놓는다. */
  async tidy(outlineFile: TFile, roots: OutlineNode[]): Promise<boolean> {
    const canvasPath = companionCanvasPath(outlineFile.path);
    if (!(this.app.vault.getAbstractFileByPath(canvasPath) instanceof TFile)) return false;
    await this.apply(canvasPath, outlineFile.path, roots, true);
    return true;
  }

  // ── 열려 있는 짝 캔버스 따라가기 ──

  private scan(): void {
    const open = new Set<string>();
    for (const leaf of this.app.workspace.getLeavesOfType('canvas')) {
      const canvasPath = (leaf.view as { file?: TFile | null }).file?.path;
      const outlinePath = canvasPath ? companionOutlinePath(canvasPath) : null;
      const isCompanion =
        canvasPath !== undefined &&
        outlinePath !== null &&
        this.app.vault.getAbstractFileByPath(outlinePath) instanceof TFile;
      leaf.view.containerEl.classList.toggle(VIEW_CLASS, isCompanion);
      if (!isCompanion || !canvasPath || !outlinePath) continue;

      open.add(canvasPath);
      if (this.watches.has(canvasPath)) continue;
      const watch: Watch = { unwatch: () => {}, structure: null, timer: null };
      this.watches.set(canvasPath, watch);
      watch.unwatch = this.documents.watch(outlinePath, () =>
        this.schedule(watch, canvasPath, outlinePath)
      );
      this.schedule(watch, canvasPath, outlinePath);
    }
    for (const [canvasPath, watch] of this.watches) {
      if (open.has(canvasPath)) continue;
      this.stop(watch);
      this.watches.delete(canvasPath);
    }
  }

  private stop(watch: Watch): void {
    watch.unwatch();
    if (watch.timer !== null) window.clearTimeout(watch.timer);
  }

  /** 불릿 구조가 바뀌었을 때만 캔버스를 고친다. (글자만 바뀐 것은 미러 카드가 이미 보여 준다) */
  private schedule(watch: Watch, canvasPath: string, outlinePath: string): void {
    if (watch.timer !== null) window.clearTimeout(watch.timer);
    watch.timer = window.setTimeout(() => {
      watch.timer = null;
      const roots = this.documents.rootsOf(outlinePath);
      if (!roots) return;
      const structure = structureOf(roots);
      if (structure === watch.structure) return;
      watch.structure = structure;
      void this.apply(canvasPath, outlinePath, roots);
    }, SYNC_DELAY);
  }

  /** 짝 캔버스를 불릿 구조에 맞춘다. 열려 있으면 화면에서, 닫혀 있으면 파일에서 고친다. */
  private async apply(
    canvasPath: string,
    outlinePath: string,
    roots: OutlineNode[],
    tidy = false
  ): Promise<CanvasData> {
    const canvas = openCanvasOf(this.app, canvasPath) as DataCanvas | null;
    if (canvas?.getData && canvas.setData) {
      const data = readCanvasData(JSON.stringify(canvas.getData()));
      if (syncCanvasData(data, roots, outlinePath, tidy)) {
        canvas.setData(data);
        canvas.requestSave();
      }
      return data;
    }

    let result: CanvasData = { nodes: [], edges: [] };
    const file = this.app.vault.getAbstractFileByPath(canvasPath);
    if (!(file instanceof TFile)) return result;
    await this.app.vault.process(file, (text) => {
      result = readCanvasData(text);
      return syncCanvasData(result, roots, outlinePath, tidy)
        ? JSON.stringify(result, null, '\t')
        : text;
    });
    return result;
  }
}
