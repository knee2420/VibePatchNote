/**
 * @file LivePreviewEmbedWatcher.tsx
 * @description 옵시디언 Live Preview 및 호버 팝오버(.popover.hover-popover) 마크다운 임베드 인터셉터
 * - CodeMirror 6 기반 에디터 내에서 ![[...]] 로 생성된 .file-embed / .internal-embed 회색 박스를 가로채 아웃라인 에디터로 렌더링
 * - Ctrl+Hover 시 나타나는 호버 팝오버 내부의 회색 파일 카드도 감지하여 살아있는 아웃라인 프리뷰로 전환
 */

import { createRoot, type Root } from 'react-dom/client';
import { type App, type EventRef, TFile } from 'obsidian';
import { OutlineInline } from '../inline/OutlineInline';

/** 아웃라인 화면을 이미 올린 임베드 자리의 표시. 읽기 모드 등록기와 함께 쓴다. (같은 자리를 두 번 그리지 않도록) */
export const EMBED_MOUNTED_FLAG = 'vibeLiveEmbedMounted';
const MOUNTED_FLAG = EMBED_MOUNTED_FLAG;

export class LivePreviewEmbedWatcher {
  private app: App;
  private roots = new Map<HTMLElement, { root: Root; container: HTMLElement }>();
  private observer: MutationObserver | null = null;
  private eventRefs: EventRef[] = [];
  private debounceTimer: number | null = null;

  constructor(app: App) {
    this.app = app;
  }

  public init() {
    this.scan();

    // 1. DOM MutationObserver: document.body 전체를 감시하여
    //    Live Preview 에디터 본문, 호버 팝오버, 캔버스 등 모든 곳의 임베드를 감지
    this.observer = new MutationObserver((mutations) => {
      // 제거된 노드에 대한 React Root 언마운트 클린업
      for (const mut of mutations) {
        if (mut.removedNodes.length > 0) {
          mut.removedNodes.forEach((node) => {
            if (node instanceof HTMLElement) {
              this.cleanupNode(node);
            }
          });
        }
      }
      this.requestScan();
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // 2. 옵시디언 작업공간 이벤트 구독
    this.eventRefs.push(
      this.app.workspace.on('layout-change', () => this.requestScan()),
      this.app.workspace.on('active-leaf-change', () => this.requestScan())
    );
  }

  public destroy() {
    if (this.debounceTimer !== null) {
      window.clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    this.observer?.disconnect();
    this.observer = null;
    this.eventRefs.forEach((ref) => this.app.workspace.offref(ref));
    this.eventRefs = [];
    this.roots.forEach(({ root, container }, embedEl) => {
      try {
        root.unmount();
      } catch {
        // 이미 unmount된 경우 무시
      }
      container.remove();
      this.restoreNativeChildren(embedEl);
      delete embedEl.dataset[MOUNTED_FLAG];
    });
    this.roots.clear();
  }

  private requestScan() {
    if (this.debounceTimer !== null) {
      window.clearTimeout(this.debounceTimer);
    }
    this.debounceTimer = window.setTimeout(() => {
      this.debounceTimer = null;
      requestAnimationFrame(() => {
        if (this.observer) this.scan();
      });
    }, 100);
  }

  private scan() {
    const selector =
      '.internal-embed:not([data-vibe-live-embed-mounted="true"]), .file-embed:not([data-vibe-live-embed-mounted="true"])';
    const targets = document.querySelectorAll<HTMLElement>(selector);

    targets.forEach((embedEl) => {
      this.tryMountEmbed(embedEl);
    });
  }

  private cleanupNode(node: HTMLElement) {
    this.unmountEmbed(node);
    node
      .querySelectorAll<HTMLElement>('[data-vibe-live-embed-mounted="true"]')
      .forEach((child) => this.unmountEmbed(child));
  }

  private restoreNativeChildren(embedEl: HTMLElement) {
    Array.from(embedEl.children).forEach((child) => {
      if (child instanceof HTMLElement && child.classList.contains('vibe-outliner-native-hidden')) {
        child.classList.remove('vibe-outliner-native-hidden');
        child.style.display = '';
      }
    });
  }

  private unmountEmbed(embedEl: HTMLElement) {
    const entry = this.roots.get(embedEl);
    if (!entry) return;
    try {
      entry.root.unmount();
    } catch {
      // 이미 unmount된 경우 무시
    }
    entry.container.remove();
    this.roots.delete(embedEl);
    this.restoreNativeChildren(embedEl);
    delete embedEl.dataset[MOUNTED_FLAG];
  }

  private resolveTarget(embedEl: HTMLElement): { file: TFile; anchor?: string } | null {
    // 1. src 속성 조회
    let raw = embedEl.getAttribute('src');

    // 2. data-href 또는 alt 속성 조회
    if (!raw) raw = embedEl.getAttribute('data-href');
    if (!raw) raw = embedEl.getAttribute('alt');

    // 3. 자식 타이틀 엘리먼트 텍스트 조회
    if (!raw) {
      const titleEl = embedEl.querySelector('.file-embed-title');
      if (titleEl && titleEl.textContent) {
        raw = titleEl.textContent.trim();
      }
    }

    // 4. 전체 텍스트 내에서 .outline 파일명 추출 폴백
    if (!raw) {
      const fullText = embedEl.textContent || '';
      const match = fullText.match(/([^\s\n\r]+\.outline(?:#[^\s\n\r]+)?)/);
      if (match) raw = match[1];
    }

    if (!raw) return null;

    // URL 인코딩 해제 (한글 파일명 등)
    let decoded = raw;
    try {
      decoded = decodeURIComponent(raw);
    } catch {}

    // 파일 경로와 서브 앵커(#nodeId) 분리
    const [pathPart, anchor] = decoded.split('#');
    const cleanPath = pathPart.trim();
    if (!cleanPath) return null;

    const activePath = this.app.workspace.getActiveFile()?.path ?? '';

    // 옵시디언 공식 Resolver 조회
    let targetFile = this.app.metadataCache.getFirstLinkpathDest(cleanPath, activePath);
    if (!targetFile && !cleanPath.endsWith('.outline')) {
      targetFile = this.app.metadataCache.getFirstLinkpathDest(`${cleanPath}.outline`, activePath);
    }
    if (!targetFile) {
      targetFile = this.app.metadataCache.getFirstLinkpathDest(cleanPath, '');
    }

    // Vault getFiles 전체 스캔 폴백
    if (!targetFile) {
      const allFiles = this.app.vault.getFiles();
      const baseOrName = cleanPath.split('/').pop() ?? cleanPath;
      targetFile =
        allFiles.find(
          (f) =>
            f.extension === 'outline' &&
            (f.name === baseOrName ||
              f.basename === baseOrName ||
              f.path === cleanPath ||
              f.path.endsWith(`/${baseOrName}`) ||
              f.path.endsWith(`/${cleanPath}`))
        ) ?? null;
    }

    if (targetFile instanceof TFile && targetFile.extension === 'outline') {
      return { file: targetFile, anchor: anchor?.trim() };
    }

    return null;
  }

  private tryMountEmbed(embedEl: HTMLElement) {
    if (embedEl.dataset[MOUNTED_FLAG] === 'true') return;

    const resolved = this.resolveTarget(embedEl);
    if (!resolved) return;

    const { file, anchor } = resolved;

    // 인터셉트 플래그 설정 및 기존 회색 제네릭 카드 클래스 제거
    embedEl.dataset[MOUNTED_FLAG] = 'true';
    embedEl.addClass('vibe-outliner-embed-container');
    embedEl.removeClass('mod-generic');

    // 인라인 컨테이너 스타일 보정 (본문 폭에 맞추고 적절한 높이 부여)
    embedEl.style.display = 'block';
    embedEl.style.width = '100%';
    embedEl.style.minHeight = '160px';

    // 중요: CodeMirror 6 에디터 DOM 트리 보존을 위해 기존 자식 노드를 지우지 않고 가리기만 합니다.
    Array.from(embedEl.children).forEach((child) => {
      if (child instanceof HTMLElement && !child.classList.contains('vibe-outliner-mount-root')) {
        child.classList.add('vibe-outliner-native-hidden');
        child.style.display = 'none';
      }
    });

    // CodeMirror와 React가 DOM 소유권을 다투지 않도록 독립된 서브 컨테이너 생성
    const mountContainer = document.createElement('div');
    mountContainer.className = 'vibe-outliner-mount-root';
    mountContainer.style.width = '100%';
    mountContainer.style.height = '100%';
    embedEl.appendChild(mountContainer);

    const root = createRoot(mountContainer);
    this.roots.set(embedEl, { root, container: mountContainer });

    root.render(
      <OutlineInline
        app={this.app}
        file={file}
        zoomNodeId={anchor}
        maxHeight="500px"
      />
    );
  }
}
