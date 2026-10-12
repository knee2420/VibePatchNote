/**
 * @file OutlineCanvasNode.ts
 * @description 옵시디언 캔버스(Canvas) 파일 노드 인터셉터
 * - 캔버스에 .outline 파일을 직접 드롭했을 때, 회색 링크 대신 살아있는 아웃라인 캔버스로 렌더링
 */

import { createRoot, type Root } from 'react-dom/client';
import type { App, View, WorkspaceLeaf } from 'obsidian';
import { OutlineMarkdownEmbed } from '../embed/OutlineMarkdownEmbed';

const MOUNTED_FLAG = 'vibeOutlineMounted';

interface CanvasNode {
  id: string;
  file?: { path: string; extension: string; basename: string; name: string };
  nodeEl: HTMLElement;
  contentEl: HTMLElement;
}

interface CanvasInstance {
  nodes: Map<string, CanvasNode>;
}

interface CanvasView extends View {
  canvas?: CanvasInstance;
}

export class OutlineCanvasInterceptor {
  private app: App;
  private mountedRoots = new Map<string, Root>();
  private observer: MutationObserver | null = null;

  constructor(app: App) {
    this.app = app;
  }

  public init() {
    // 1. 활성 탭 전환 및 레이아웃 변경 시 캔버스 스캔
    this.scanCurrentCanvas();

    this.app.workspace.on('layout-change', () => {
      this.scanCurrentCanvas();
    });

    this.app.workspace.on('active-leaf-change', () => {
      this.scanCurrentCanvas();
    });
  }

  public destroy() {
    this.observer?.disconnect();
    this.observer = null;
    this.unmountAll();
  }

  private scanCurrentCanvas() {
    const leaves = this.app.workspace.getLeavesOfType('canvas');
    for (const leaf of leaves) {
      this.hookCanvasLeaf(leaf);
    }
  }

  private hookCanvasLeaf(leaf: WorkspaceLeaf) {
    const view = leaf.view as CanvasView;
    const canvas = view.canvas;
    if (!canvas || !canvas.nodes) return;

    // 캔버스 내의 모든 노드 순회
    canvas.nodes.forEach((node) => {
      this.patchCanvasNode(node);
    });

    // 캔버스 컨테이너에 DOM MutationObserver 연결 (동적으로 추가되거나 스크롤 인 될 때 감지)
    const container = view.containerEl;
    if (container && !container.dataset.vibeCanvasObserved) {
      container.dataset.vibeCanvasObserved = 'true';
      const observer = new MutationObserver(() => {
        if (canvas.nodes) {
          canvas.nodes.forEach((n) => this.patchCanvasNode(n));
        }
      });
      observer.observe(container, { childList: true, subtree: true });
    }
  }

  private patchCanvasNode(node: CanvasNode) {
    if (!node.file || node.file.extension !== 'outline') return;
    if (node.nodeEl.dataset[MOUNTED_FLAG] === 'true') return;

    // 실제 Vault 상의 TFile 조회
    const tFile = this.app.metadataCache.getFirstLinkpathDest(node.file.path, '');
    if (!tFile) return;

    // 중복 마운트 방지 플래그 설정
    node.nodeEl.dataset[MOUNTED_FLAG] = 'true';

    // 캔버스 노드의 내용물 컨테이너
    const contentEl = node.contentEl;
    contentEl.empty();
    contentEl.addClass('vibe-outliner-canvas-node-content');
    contentEl.style.height = '100%';
    contentEl.style.display = 'flex';
    contentEl.style.flexDirection = 'column';
    contentEl.style.overflow = 'hidden';

    // 캔버스 판 자체의 줌/패닝과 아웃라인 조작 이벤트 충돌 방지
    contentEl.addEventListener('pointerdown', (e) => e.stopPropagation());
    contentEl.addEventListener('wheel', (e) => e.stopPropagation(), { passive: true });

    const root = createRoot(contentEl);
    this.mountedRoots.set(node.id, root);

    root.render(
      <OutlineMarkdownEmbed
        app={this.app}
        file={tFile}
        maxHeight="100%"
      />
    );
  }

  private unmountAll() {
    this.mountedRoots.forEach((root) => {
      try {
        root.unmount();
      } catch {
        // 이미 언마운트된 경우 무시
      }
    });
    this.mountedRoots.clear();
  }
}
