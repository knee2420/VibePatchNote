/**
 * @file SidePeek.ts
 * @description 불릿 ↔ 미러 카드를 오른쪽 반쪽 화면에 열기, 그리고 미러 메뉴 (노션의 옆으로 열기처럼, 실험)
 * - 불릿 메뉴: "미러 n곳에 있음. 보기" 머리말, "캔버스에서 보기", "미러 끄기" / "미러 다시 켜기"
 * - 카드 도구 막대 단추·우클릭 메뉴: "아웃라인에서 보기", "미러 보기", "미러 끄기" / "미러 켜기"
 * - 미러가 여러 곳이면 미러 창에서 고른다. 하나면 바로 연다.
 * - 미러 카드에는 모서리에 작은 다이아몬드를 붙인다.
 *
 * 무엇이 미러인지는 미러 색인(mirror/mirrorIndex.ts)이 정한다.
 * 고른 곳이 다른 탭 묶음에 이미 열려 있으면 그 칸을 앞으로 가져오고, 아니면 오른쪽 칸에 연다.
 * 오른쪽 칸은 하나를 계속 다시 쓴다. (열 때마다 화면이 반씩 쪼개지지 않게)
 */

import {
  type App,
  type EventRef,
  type Menu,
  type Plugin,
  type WorkspaceLeaf,
  FileView,
  Notice,
  TFile,
  setIcon,
} from 'obsidian';
import type { NodeId } from '@vibe/outliner/core';
import type { OutlineHost, OutlineHostMenuItem } from '@vibe/outliner/editor';
import { VIEW_TYPE_OUTLINE } from '../../document/outlineFiles';
import { type MirrorPlace, MirrorPanelModal, pathSegments } from '../../mirror/MirrorPanelModal';
import { type MirrorIndex, toRawCard } from '../../mirror/mirrorIndex';
import type { MirrorSwitch } from '../../mirror/mirrorSwitch';
import { OutlineFileView } from '../tab/OutlineFileView';
import {
  type CanvasInstance,
  type CanvasNode,
  type CanvasSelectionSync,
  openCanvases,
  waitFor,
  zoomToCard,
} from './CanvasSelectionSync';

const PEEK_BUTTON_CLASS = 'vibe-outliner-peek-button';
const MIRROR_CARD_CLASS = 'vibe-outliner-mirror-card';
/** 막 연 파일이 다 올라오기를 기다리는 프레임 수 (약 2초) */
const LOAD_FRAMES = 120;

interface CanvasNodeMenuEvents {
  on: (name: 'canvas:node-menu', callback: (menu: Menu, card: CanvasNode) => void) => EventRef;
}

function canvasOf(leaf: WorkspaceLeaf): CanvasInstance | null {
  const canvas = (leaf.view as { canvas?: CanvasInstance }).canvas;
  return canvas?.nodes ? canvas : null;
}

function fileOf(leaf: WorkspaceLeaf): TFile | null {
  return leaf.view instanceof FileView ? leaf.view.file : null;
}

function focusCard(canvas: CanvasInstance, card: CanvasNode): void {
  canvas.selectOnly(card);
  zoomToCard(canvas, card);
}

function shorten(text: string, max = 24): string {
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

export class SidePeek {
  private app: App;
  private sync: CanvasSelectionSync;
  private index: MirrorIndex;
  private mirrors: MirrorSwitch;
  /** 옆으로 열 때 다시 쓰는 오른쪽 칸 */
  private asideLeaf: WorkspaceLeaf | null = null;

  constructor(app: App, sync: CanvasSelectionSync, index: MirrorIndex, mirrors: MirrorSwitch) {
    this.app = app;
    this.sync = sync;
    this.index = index;
    this.mirrors = mirrors;
  }

  register(plugin: Plugin): void {
    this.sync.onCardMenu = (_canvas, card, menuEl) => this.addPeekButton(card, menuEl);

    const workspace = this.app.workspace as unknown as CanvasNodeMenuEvents;
    plugin.registerEvent(
      workspace.on('canvas:node-menu', (menu, card) => this.addCardMenuItems(menu, card))
    );

    // 미러가 바뀌거나 캔버스를 새로 열면 카드의 다이아몬드를 다시 붙인다.
    plugin.register(this.index.onChange(() => this.decorateCanvases()));
    plugin.registerEvent(this.app.workspace.on('layout-change', () => this.decorateCanvases()));
  }

  /** 아웃라인 탭의 편집 화면에 더해 줄 호스트 기능 (다이아몬드 불릿, 메뉴 머리말, 메뉴 항목) */
  hostFor(view: OutlineFileView): Partial<OutlineHost> {
    return {
      mirrorCount: (nodeId) => 1 + this.index.mirrorsOf(nodeId).length,
      subscribeMirrors: (listener) => this.index.onChange(listener),
      showMirrors: (nodeId) => this.showMirrors(nodeId, view.leaf),
      nodeMenuItems: (nodeId) => this.bulletMenuItems(view, nodeId),
    };
  }

  private bulletMenuItems(view: OutlineFileView, nodeId: NodeId): OutlineHostMenuItem[] {
    const on = this.index.mirrorsOf(nodeId).length;
    const off = this.index.offMirrorsOf(nodeId).length;
    const items: OutlineHostMenuItem[] = [];
    if (on > 0) {
      items.push(
        { label: '캔버스에서 보기', run: () => void this.openCanvasForBullet(view, nodeId) },
        { label: `미러 끄기 (카드 ${on}장)`, run: () => void this.setBulletMirrors(nodeId, false) }
      );
    }
    if (off > 0) {
      items.push({
        label: `미러 다시 켜기 (카드 ${off}장)`,
        run: () => void this.setBulletMirrors(nodeId, true),
      });
    }
    return items;
  }

  private async setBulletMirrors(nodeId: NodeId, on: boolean): Promise<void> {
    const count = await this.mirrors.setBulletMirrors(nodeId, on);
    new Notice(on ? `미러 카드 ${count}장을 다시 켰습니다.` : `미러 카드 ${count}장을 껐습니다.`);
  }

  // ── 카드 쪽 ──

  /** 카드가 있는 칸과 파일, 카드가 미러인 불릿 */
  private cardContext(card: CanvasNode) {
    const leaf =
      this.app.workspace
        .getLeavesOfType('canvas')
        .find((l) => canvasOf(l)?.nodes.get(card.id) === card) ?? null;
    const raw = toRawCard(card.getData());
    return {
      leaf,
      raw,
      canvasPath: leaf ? fileOf(leaf)?.path : undefined,
      nodeId: raw ? this.index.resolve(raw) : null,
    };
  }

  private addCardMenuItems(menu: Menu, card: CanvasNode): void {
    const { leaf, raw, canvasPath, nodeId } = this.cardContext(card);
    if (!raw || !canvasPath || !leaf) return;

    if (nodeId) {
      menu.addItem((item) =>
        item
          .setTitle('아웃라인에서 보기')
          .setIcon('panel-right')
          .onClick(() => void this.openOutlineForCard(card))
      );
      menu.addItem((item) =>
        item
          .setTitle(`미러 ${1 + this.index.mirrorsOf(nodeId).length}곳 보기`)
          .setIcon('diamond')
          .onClick(() => this.showMirrors(nodeId, leaf))
      );
      menu.addItem((item) =>
        item
          .setTitle('미러 끄기')
          .setIcon('x')
          .onClick(() => void this.mirrors.setCardMirror(canvasPath, card.id, false))
      );
    } else if (raw.link?.off && this.index.bullet(raw.link.nodeId)) {
      menu.addItem((item) =>
        item
          .setTitle('미러 켜기')
          .setIcon('diamond')
          .onClick(() => void this.mirrors.setCardMirror(canvasPath, card.id, true))
      );
    }
  }

  /** 카드 도구 막대에 "아웃라인에서 보기" 단추를 더한다. 미러 카드에만 붙는다. */
  private addPeekButton(card: CanvasNode, menuEl: HTMLElement): void {
    menuEl.querySelector(`.${PEEK_BUTTON_CLASS}`)?.remove();
    const raw = toRawCard(card.getData());
    if (!raw || !this.index.resolve(raw)) return;

    const button = menuEl.createEl('button', {
      cls: `clickable-icon ${PEEK_BUTTON_CLASS}`,
      attr: { 'aria-label': '아웃라인에서 보기', 'data-tooltip-position': 'top' },
    });
    setIcon(button, 'panel-right');
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      void this.openOutlineForCard(card);
    });
  }

  /** 열린 캔버스의 미러 카드에 다이아몬드를 붙이고, 미러가 아닌 카드에서는 뗀다. */
  private decorateCanvases(): void {
    for (const canvas of openCanvases(this.app)) {
      canvas.nodes.forEach((card) => {
        const raw = toRawCard(card.getData());
        card.nodeEl.classList.toggle(MIRROR_CARD_CLASS, Boolean(raw && this.index.resolve(raw)));
      });
    }
  }

  // ── 열기 ──

  /** 미러 카드가 하나면 바로 열고, 여러 개면 미러 창을 띄운다. */
  async openCanvasForBullet(view: OutlineFileView, nodeId: NodeId): Promise<void> {
    const cards = this.index.mirrorsOf(nodeId);
    const only = cards.length === 1 ? cards[0] : undefined;
    if (cards.length === 0) new Notice('이 불릿의 미러 카드가 없습니다.');
    else if (only) await this.openCard(view.leaf, only.canvasPath, only.cardId);
    else this.showMirrors(nodeId, view.leaf);
  }

  /** 카드의 원본 불릿을 연다. (원본은 하나뿐이다) */
  async openOutlineForCard(card: CanvasNode): Promise<void> {
    const { leaf, nodeId } = this.cardContext(card);
    const bullet = nodeId ? this.index.bullet(nodeId) : undefined;
    const source = leaf ?? this.app.workspace.getMostRecentLeaf();
    if (!bullet || !source) {
      new Notice('이 카드는 미러가 아닙니다.');
      return;
    }
    await this.openBullet(source, bullet.outlinePath, bullet.nodeId);
  }

  /** 미러 창: 원본 불릿과 미러 카드가 있는 곳을 경로로 보여준다. */
  showMirrors(nodeId: NodeId, fromLeaf: WorkspaceLeaf): void {
    const bullet = this.index.bullet(nodeId);
    if (!bullet) return;
    const cards = this.index.mirrorsOf(nodeId);

    const places: MirrorPlace[] = [
      {
        kind: 'source',
        segments: [...pathSegments(bullet.outlinePath), ...bullet.ancestors, bullet.text],
        isOpen: Boolean(this.openLeafOf(bullet.outlinePath, fromLeaf)),
        open: () => void this.openBullet(fromLeaf, bullet.outlinePath, nodeId),
      },
      ...cards.map(
        (card): MirrorPlace => ({
          kind: 'card',
          segments: [...pathSegments(card.canvasPath), card.text],
          isOpen: Boolean(this.openLeafOf(card.canvasPath, fromLeaf)),
          open: () => void this.openCard(fromLeaf, card.canvasPath, card.cardId),
        })
      ),
    ];
    new MirrorPanelModal(
      this.app,
      `"${shorten(bullet.text)}" 미러 ${places.length}곳`,
      places,
      cards.length > 0
        ? [{ label: '미러 모두 끄기', run: () => void this.setBulletMirrors(nodeId, false) }]
        : []
    ).open();
  }

  /** 캔버스를 오른쪽 칸(또는 이미 열린 칸)에 열고, 카드가 있으면 그 카드로 간다. */
  async openCard(fromLeaf: WorkspaceLeaf, canvasPath: string, cardId: string | null): Promise<void> {
    const file = this.app.vault.getAbstractFileByPath(canvasPath);
    if (!(file instanceof TFile)) return;
    const leaf = await this.leafFor(fromLeaf, file);
    if (!cardId) return;
    const canvas = await waitFor(
      () => (canvasOf(leaf)?.nodes.has(cardId) ? canvasOf(leaf) : null),
      LOAD_FRAMES
    );
    const card = canvas?.nodes.get(cardId);
    if (canvas && card) focusCard(canvas, card);
  }

  private async openBullet(
    fromLeaf: WorkspaceLeaf,
    outlinePath: string,
    nodeId: NodeId
  ): Promise<void> {
    const file = this.app.vault.getAbstractFileByPath(outlinePath);
    if (!(file instanceof TFile)) return;
    const leaf = await this.leafFor(fromLeaf, file);
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
   * 파일을 보여줄 칸: 다른 탭 묶음에 이미 열려 있으면 그 칸을 앞으로,
   * 아니면(안 열렸거나 같은 탭 묶음이라 지금 화면이 가려지면) 오른쪽 칸에 연다.
   */
  private async leafFor(fromLeaf: WorkspaceLeaf, file: TFile): Promise<WorkspaceLeaf> {
    const open = this.openLeafOf(file.path, fromLeaf);
    if (open) {
      await this.app.workspace.revealLeaf(open);
      return open;
    }
    const leaf = this.asideOf(fromLeaf);
    if (fileOf(leaf)?.path !== file.path) await leaf.openFile(file);
    return leaf;
  }

  /** 그 파일을 연 칸 가운데, `fromLeaf` 와 다른 탭 묶음에 있는 것 */
  private openLeafOf(path: string, fromLeaf: WorkspaceLeaf): WorkspaceLeaf | null {
    const leaves = [
      ...this.app.workspace.getLeavesOfType('canvas'),
      ...this.app.workspace.getLeavesOfType(VIEW_TYPE_OUTLINE),
    ];
    return (
      leaves.find((leaf) => fileOf(leaf)?.path === path && leaf.parent !== fromLeaf.parent) ?? null
    );
  }

  /** 옆으로 열 칸: 전에 연 오른쪽 칸이 남아 있으면 다시 쓰고, 없으면 지금 칸을 세로로 나눈다. */
  private asideOf(source: WorkspaceLeaf): WorkspaceLeaf {
    const aside = this.asideLeaf;
    if (aside && aside !== source && aside.view.containerEl.isConnected) return aside;
    this.asideLeaf = this.app.workspace.createLeafBySplit(source, 'vertical');
    return this.asideLeaf;
  }
}
