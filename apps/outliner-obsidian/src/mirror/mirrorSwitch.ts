/**
 * @file mirrorSwitch.ts
 * @description 미러 켜고 끄기 (실험)
 * - 미러를 끄면: 카드는 그 순간의 불릿 글자를 가진 보통 텍스트 카드가 된다. 그때부터 따로 입력하고 따로 보인다.
 * - 다시 켜면: 카드는 다시 그 불릿을 보여 주고 고치는 창이 된다. (MirrorCards)
 * 미러인 동안 글자는 불릿 하나뿐이라 맞출 것이 없다. 카드 데이터의 글자는 플러그인이 꺼져 있을 때 보일 예비용이다.
 */

import { type App, TFile } from 'obsidian';
import type { NodeId } from '@vibe/outliner/core';
import type { OutlineDocuments } from '../document/outlineDocuments';
import type { CanvasInstance } from '../surfaces/entries/CanvasSelectionSync';
import { type MirrorIndex, type MirrorLink, type RawCard, toRawCard } from './mirrorIndex';

interface CardPatch {
  text?: string;
  link?: MirrorLink;
}

function applyCardPatch(data: Record<string, unknown>, patch: CardPatch): Record<string, unknown> {
  const next = { ...data };
  if (patch.text !== undefined) next.text = patch.text;
  if (patch.link) next.vibeOutline = patch.link;
  return next;
}

/** 열린 캔버스 칸에서 그 파일의 캔버스 */
export function openCanvasOf(app: App, canvasPath: string): CanvasInstance | null {
  for (const leaf of app.workspace.getLeavesOfType('canvas')) {
    const view = leaf.view as { file?: TFile | null; canvas?: CanvasInstance };
    if (view.file?.path === canvasPath && view.canvas?.nodes) return view.canvas;
  }
  return null;
}

export class MirrorSwitch {
  private app: App;
  private index: MirrorIndex;
  private documents: OutlineDocuments;

  constructor(app: App, index: MirrorIndex, documents: OutlineDocuments) {
    this.app = app;
    this.index = index;
    this.documents = documents;
  }

  /** 카드 하나의 미러를 켜거나 끈다. */
  async setCardMirror(canvasPath: string, cardId: string, on: boolean): Promise<void> {
    const card = this.cardData(canvasPath, cardId);
    if (!card) return;
    const nodeId = on ? card.link?.nodeId : (this.index.resolve(card) ?? card.link?.nodeId);
    if (!nodeId) return;
    const bullet = this.index.bullet(nodeId);
    const outlinePath = bullet?.outlinePath ?? card.link?.file;
    const link: MirrorLink = {
      nodeId,
      ...(outlinePath ? { file: outlinePath } : {}),
      ...(on ? {} : { off: true }),
    };
    // 끌 때는 그 순간의 불릿 글자를 카드에 남긴다. (메모리에 올라와 있으면 아직 저장 안 된 글자까지)
    const live = outlinePath ? this.documents.textOf(outlinePath, nodeId) : undefined;
    const text = live ?? bullet?.text;
    await this.writeCard(canvasPath, cardId, { link, ...(text !== undefined ? { text } : {}) });
  }

  /** 불릿의 미러를 모두 끄거나, 꺼 둔 것을 모두 다시 켠다. 바꾼 카드 수를 돌려준다. */
  async setBulletMirrors(nodeId: NodeId, on: boolean): Promise<number> {
    const cards = on ? this.index.offMirrorsOf(nodeId) : this.index.mirrorsOf(nodeId);
    for (const card of cards) await this.setCardMirror(card.canvasPath, card.cardId, on);
    return cards.length;
  }

  /** 카드 데이터 (열린 캔버스면 화면의 것) */
  private cardData(canvasPath: string, cardId: string): RawCard | null {
    const card = openCanvasOf(this.app, canvasPath)?.nodes.get(cardId);
    if (card) return toRawCard(card.getData());
    return this.index.cardsOf(canvasPath).find((c) => c.id === cardId) ?? null;
  }

  private async writeCard(canvasPath: string, cardId: string, patch: CardPatch): Promise<void> {
    const canvas = openCanvasOf(this.app, canvasPath);
    const node = canvas?.nodes.get(cardId);
    if (canvas && node) {
      node.setData(applyCardPatch(node.getData(), patch) as ReturnType<typeof node.getData>);
      canvas.requestSave();
      return;
    }

    const file = this.app.vault.getAbstractFileByPath(canvasPath);
    if (!(file instanceof TFile)) return;
    await this.app.vault.process(file, (content) => {
      try {
        const data = JSON.parse(content) as { nodes?: Record<string, unknown>[] };
        const nodes = data.nodes ?? [];
        const index = nodes.findIndex((n) => n.id === cardId);
        const current = nodes[index];
        if (index === -1 || !current) return content;
        nodes[index] = applyCardPatch(current, patch);
        return JSON.stringify(data, null, '\t');
      } catch {
        return content;
      }
    });
  }
}
