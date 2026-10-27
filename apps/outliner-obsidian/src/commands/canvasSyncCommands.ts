/**
 * @file canvasSyncCommands.ts
 * @description 불릿과 캔버스 카드를 짝짓는 명령 (실험)
 * - 불릿을 캔버스 카드로 보내기: 고른 불릿들(없으면 커서를 둔 불릿)을 열린 캔버스에 텍스트 카드로 만든다.
 * - 고른 캔버스 카드를 불릿과 연결: 캔버스에서 고른 카드 하나에 커서를 둔 불릿의 id 를 심는다.
 */

import { type Plugin, Notice } from 'obsidian';
import { getFlatNode } from '@vibe/outliner-core';
import {
  type CanvasSelectionSync,
  type OutlineCardLink,
  openCanvases,
  selectedCards,
  zoomToCard,
} from '../surfaces/entries/CanvasSelectionSync';
import { OutlineFileView } from '../surfaces/tab/OutlineFileView';

const CARD_WIDTH = 260;
const CARD_HEIGHT = 60;
const CARD_GAP = 20;

export function registerCanvasSyncCommands(plugin: Plugin, sync: CanvasSelectionSync): void {
  const { app } = plugin;

  /** 명령 대상 탭: 지금 활성인 아웃라인 탭, 아니면 마지막으로 만진 탭 */
  const targetView = (): OutlineFileView | null =>
    app.workspace.getActiveViewOfType(OutlineFileView) ?? sync.lastView;

  plugin.addCommand({
    id: 'send-bullets-to-canvas',
    name: '불릿을 캔버스 카드로 보내기',
    checkCallback: (checking) => {
      const view = targetView();
      const canvas = openCanvases(app)[0];
      if (!view || !canvas?.createTextNode) return false;
      const { selectedNodeIds, getTree } = view.editor.getState();
      const bullet = sync.bulletOf(view);
      const ids = selectedNodeIds.length > 0 ? selectedNodeIds : bullet ? [bullet] : [];
      if (ids.length === 0) return false;
      if (checking) return true;

      const tree = getTree();
      const center = canvas.posCenter?.() ?? { x: 0, y: 0 };
      let y = center.y - CARD_HEIGHT / 2;
      let last = null;
      for (const nodeId of ids) {
        const node = getFlatNode(tree, nodeId);
        if (!node) continue;
        const card = canvas.createTextNode({
          pos: { x: center.x - CARD_WIDTH / 2, y },
          size: { width: CARD_WIDTH, height: CARD_HEIGHT },
          text: node.text,
          focus: false,
          save: false,
        });
        const link: OutlineCardLink = { nodeId, file: view.file?.path };
        card.setData({ ...card.getData(), vibeOutline: link });
        y += CARD_HEIGHT + CARD_GAP;
        last = card;
      }
      canvas.requestSave();
      if (last) {
        canvas.selectOnly(last);
        zoomToCard(canvas, last);
      }
      new Notice(`캔버스에 카드 ${ids.length}개를 만들었습니다.`);
      return true;
    },
  });

  plugin.addCommand({
    id: 'link-canvas-card-to-bullet',
    name: '고른 캔버스 카드를 불릿과 연결',
    checkCallback: (checking) => {
      const view = targetView();
      const bullet = view ? sync.bulletOf(view) : null;
      const canvas = openCanvases(app).find((c) => selectedCards(c).length === 1);
      if (!view || !bullet || !canvas) return false;
      if (checking) return true;

      const card = selectedCards(canvas)[0];
      if (!card) return false;
      const link: OutlineCardLink = { nodeId: bullet, file: view.file?.path };
      card.setData({ ...card.getData(), vibeOutline: link });
      canvas.requestSave();
      const text = getFlatNode(view.editor.getState().getTree(), bullet)?.text ?? '';
      new Notice(`카드를 불릿 "${text}" 과 연결했습니다.`);
      return true;
    },
  });
}
