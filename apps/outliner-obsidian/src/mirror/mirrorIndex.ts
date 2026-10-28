/**
 * @file mirrorIndex.ts
 * @description 보관함 전체의 미러 색인: 아웃라인 불릿과, 그 불릿을 가리키는 캔버스 카드 (실험)
 *
 * 미러: 캔버스 카드가 불릿 하나를 가리키면 그 카드는 불릿의 미러다. 미러는 기본으로 켜져 있다.
 * - 카드 데이터의 `vibeOutline.nodeId` 가 있으면 그 불릿의 미러다. (`off: true` 면 미러를 끈 카드)
 * - 태그가 없는 텍스트 카드는, 글자가 같은 불릿이 보관함에 딱 하나면 그 불릿의 미러로 본다.
 *   (같은 글자의 불릿이 여러 개면 어느 것인지 모르므로 미러로 보지 않는다)
 * - 가리키는 불릿이 지워졌으면 미러가 아니다. (카드는 글자만 남은 보통 카드가 된다)
 *
 * 색인은 파일 내용으로 만든다. 열린 화면의 저장 전 내용은 저장된 뒤에 반영된다.
 */

import { type App, type TAbstractFile, TFile } from 'obsidian';
import type { NodeId, OutlineNode } from '@vibe/outliner/core';
import { parseProjectFile } from '@vibe/outliner/dto';
import { OUTLINE_EXTENSION } from '../document/outlineFiles';

/** 카드 데이터에 심는 미러 정보. 파일 경로는 사람이 알아보라고 적어 두고, 짝은 nodeId 로만 찾는다. */
export interface MirrorLink {
  nodeId: NodeId;
  file?: string;
  /** 사용자가 미러를 끈 카드. nodeId 는 다시 켤 때를 위해 남겨 둔다. */
  off?: boolean;
}

/** 색인이 아는 불릿 하나 */
export interface BulletEntry {
  nodeId: NodeId;
  outlinePath: string;
  text: string;
  /** 위에서부터 조상 불릿들의 글자 */
  ancestors: string[];
}

/** 캔버스 파일 안의 카드 하나 (색인에 필요한 것만) */
export interface RawCard {
  id: string;
  type: string;
  text?: string;
  link?: MirrorLink;
}

/** 불릿 하나의 미러 카드 */
export interface MirrorCard {
  canvasPath: string;
  cardId: string;
  text: string;
  /** 심어 둔 id 로 이어졌는지 (아니면 글자가 같아서 이어진 것) */
  byId: boolean;
}

export type MirrorChange = { kind: 'outline' | 'canvas'; path: string } | { kind: 'all' };

export function cardKey(canvasPath: string, cardId: string): string {
  return `${canvasPath}#${cardId}`;
}

function readLink(value: unknown): MirrorLink | undefined {
  const link = value as Partial<MirrorLink> | undefined;
  if (!link || typeof link.nodeId !== 'string' || link.nodeId === '') return undefined;
  return {
    nodeId: link.nodeId,
    ...(typeof link.file === 'string' ? { file: link.file } : {}),
    ...(link.off === true ? { off: true } : {}),
  };
}

/** 카드 데이터(화면의 것이든 파일의 것이든)를 색인용으로 읽는다. */
export function toRawCard(data: unknown): RawCard | null {
  const card = data as { id?: unknown; type?: unknown; text?: unknown; vibeOutline?: unknown };
  if (typeof card.id !== 'string' || typeof card.type !== 'string') return null;
  return {
    id: card.id,
    type: card.type,
    ...(typeof card.text === 'string' ? { text: card.text } : {}),
    ...(readLink(card.vibeOutline) ? { link: readLink(card.vibeOutline) } : {}),
  };
}

export class MirrorIndex {
  private app: App;
  private bullets = new Map<NodeId, BulletEntry>();
  private bulletIdsByText = new Map<string, NodeId[]>();
  private outlineBullets = new Map<string, NodeId[]>();
  private canvasCards = new Map<string, RawCard[]>();
  /** 위 두 가지에서 다시 계산하는 것: 불릿마다 켜진 미러 카드, 꺼 둔 카드 */
  private mirrorsByNode = new Map<NodeId, MirrorCard[]>();
  private offByNode = new Map<NodeId, MirrorCard[]>();
  private listeners = new Set<(change: MirrorChange) => void>();
  ready = false;

  constructor(app: App) {
    this.app = app;
  }

  // ── 읽기 ──

  bullet(nodeId: NodeId): BulletEntry | undefined {
    return this.bullets.get(nodeId);
  }

  bulletsOf(outlinePath: string): BulletEntry[] {
    return (this.outlineBullets.get(outlinePath) ?? []).flatMap((id) => this.bullets.get(id) ?? []);
  }

  cardsOf(canvasPath: string): RawCard[] {
    return this.canvasCards.get(canvasPath) ?? [];
  }

  /** 불릿의 켜진 미러 카드들 */
  mirrorsOf(nodeId: NodeId): MirrorCard[] {
    return this.mirrorsByNode.get(nodeId) ?? [];
  }

  /** 불릿을 가리키지만 미러를 꺼 둔 카드들 */
  offMirrorsOf(nodeId: NodeId): MirrorCard[] {
    return this.offByNode.get(nodeId) ?? [];
  }

  /** 카드가 미러인 불릿. 미러가 아니면(꺼 둠, 짝 없음, 불릿이 지워짐) null */
  resolve(card: RawCard): NodeId | null {
    if (card.link) {
      return !card.link.off && this.bullets.has(card.link.nodeId) ? card.link.nodeId : null;
    }
    if (card.type !== 'text' || !card.text) return null;
    const ids = this.bulletIdsByText.get(card.text.trim());
    return ids?.length === 1 ? (ids[0] ?? null) : null;
  }

  onChange(listener: (change: MirrorChange) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // ── 만들기 ──

  async build(): Promise<void> {
    for (const file of this.app.vault.getFiles()) {
      if (file.extension === OUTLINE_EXTENSION) await this.readOutline(file);
      else if (file.extension === 'canvas') await this.readCanvas(file);
    }
    this.ready = true;
    this.recompute({ kind: 'all' });
  }

  /** 파일이 만들어지거나 바뀌었을 때 */
  async update(file: TAbstractFile): Promise<void> {
    if (!(file instanceof TFile) || !this.ready) return;
    if (file.extension === OUTLINE_EXTENSION) {
      await this.readOutline(file);
      this.recompute({ kind: 'outline', path: file.path });
    } else if (file.extension === 'canvas') {
      await this.readCanvas(file);
      this.recompute({ kind: 'canvas', path: file.path });
    }
  }

  /** 파일이 지워졌을 때 */
  remove(path: string): void {
    if (this.outlineBullets.has(path)) {
      this.dropOutline(path);
      this.recompute({ kind: 'outline', path });
    } else if (this.canvasCards.delete(path)) {
      this.recompute({ kind: 'canvas', path });
    }
  }

  private async readOutline(file: TFile): Promise<void> {
    this.dropOutline(file.path);
    const parsed = parseProjectFile(await this.app.vault.cachedRead(file));
    if (!parsed.success) return;

    const ids: NodeId[] = [];
    const visit = (nodes: OutlineNode[], ancestors: string[]) => {
      for (const node of nodes) {
        ids.push(node.id);
        this.bullets.set(node.id, {
          nodeId: node.id,
          outlinePath: file.path,
          text: node.text,
          ancestors,
        });
        visit(node.children, [...ancestors, node.text]);
      }
    };
    visit(parsed.project.rootNodes, []);
    this.outlineBullets.set(file.path, ids);
  }

  private dropOutline(path: string): void {
    for (const id of this.outlineBullets.get(path) ?? []) {
      if (this.bullets.get(id)?.outlinePath === path) this.bullets.delete(id);
    }
    this.outlineBullets.delete(path);
  }

  private async readCanvas(file: TFile): Promise<void> {
    try {
      const data = JSON.parse(await this.app.vault.cachedRead(file)) as { nodes?: unknown[] };
      const nodes = Array.isArray(data.nodes) ? data.nodes : [];
      this.canvasCards.set(
        file.path,
        nodes.flatMap((node) => toRawCard(node) ?? [])
      );
    } catch {
      this.canvasCards.delete(file.path);
    }
  }

  private recompute(change: MirrorChange): void {
    this.bulletIdsByText.clear();
    for (const bullet of this.bullets.values()) {
      const text = bullet.text.trim();
      if (!text) continue;
      const ids = this.bulletIdsByText.get(text);
      if (ids) ids.push(bullet.nodeId);
      else this.bulletIdsByText.set(text, [bullet.nodeId]);
    }

    this.mirrorsByNode.clear();
    this.offByNode.clear();
    for (const [canvasPath, cards] of this.canvasCards) {
      for (const card of cards) {
        const entry: MirrorCard = {
          canvasPath,
          cardId: card.id,
          text: card.text ?? '',
          byId: Boolean(card.link),
        };
        const nodeId = this.resolve(card);
        if (nodeId) push(this.mirrorsByNode, nodeId, entry);
        else if (card.link?.off && this.bullets.has(card.link.nodeId)) {
          push(this.offByNode, card.link.nodeId, entry);
        }
      }
    }
    this.listeners.forEach((listener) => listener(change));
  }
}

function push<K, V>(map: Map<K, V[]>, key: K, value: V): void {
  const list = map.get(key);
  if (list) list.push(value);
  else map.set(key, [value]);
}
