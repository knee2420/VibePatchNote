/**
 * @file main.ts
 * @description Vibe Outliner 옵시디언 플러그인
 * - .outline 전용 뷰어/에디터 등록
 * - 옵시디언 마크다운 인라인 임베드 (![[...]]) 및 ```vibe-outline``` 코드 블록 지원
 * - 캔버스(Canvas) 파일 카드 직접 연동 (OutlineCanvasInterceptor)
 * - 공식 Resolver(metadataCache.getFirstLinkpathDest) 및 호버 미리보기 지원
 * - 메타데이터 캐시 및 그래프 뷰 / 백링크 색인 (syncOutlineMetadata)
 */

import './styles.css';
import { type TAbstractFile, type TFolder, Notice, Plugin, TFile } from 'obsidian';
import {
  OUTLINE_PROTOCOL_ACTION,
  OutlineFileView,
  VIEW_TYPE_OUTLINE,
} from './OutlineFileView';
import { OUTLINE_EXTENSION, createOutlineFile } from './outlineFiles';
import {
  registerOutlineCodeBlockProcessor,
  registerOutlineMarkdownEmbedProcessor,
} from './embed/markdownPostProcessor';
import { LivePreviewEmbedWatcher } from './embed/livePreviewEmbed';
import { OutlineCanvasInterceptor } from './canvas/OutlineCanvasNode';
import { syncOutlineMetadata } from './indexer/outlineMetadataIndexer';

function isFolder(file: TAbstractFile): file is TFolder {
  return 'children' in file;
}

export default class VibeOutlinerPlugin extends Plugin {
  private canvasInterceptor: OutlineCanvasInterceptor | null = null;
  private livePreviewWatcher: LivePreviewEmbedWatcher | null = null;

  async onload(): Promise<void> {
    // 1. .outline 확장자를 단독 탭 뷰에 등록
    this.registerView(VIEW_TYPE_OUTLINE, (leaf) => new OutlineFileView(leaf));
    this.registerExtensions([OUTLINE_EXTENSION], VIEW_TYPE_OUTLINE);

    // 2. 마크다운 인라인 임베드 (![[...]]) 등록 (Reading 모드)
    registerOutlineMarkdownEmbedProcessor(this.app, (proc) => {
      this.registerMarkdownPostProcessor(proc);
    });

    // 2-1. Live Preview (실시간 미리보기/편집 모드) 임베드 인터셉터 초기화
    this.livePreviewWatcher = new LivePreviewEmbedWatcher(this.app);
    this.livePreviewWatcher.init();

    // 3. ```vibe-outline``` 코드 블록 프로세서 등록
    registerOutlineCodeBlockProcessor(this.app, (lang, handler) => {
      this.registerMarkdownCodeBlockProcessor(lang, handler);
    });

    // 4. 캔버스(Canvas) 파일 카드 직접 연동 인터셉터 초기화
    this.canvasInterceptor = new OutlineCanvasInterceptor(this.app);
    this.canvasInterceptor.init();

    // 5. 호버 링크 미리보기 소스 등록 (Page Preview)
    this.registerHoverLinkSource(VIEW_TYPE_OUTLINE, {
      display: 'Vibe Outliner',
      defaultMod: true,
    });

    // 6. 새 파일을 만드는 진입점: 명령, 리본 아이콘, 폴더 컨텍스트 메뉴
    this.addCommand({
      id: 'new-outline',
      name: '새 아웃라인 만들기',
      callback: () => void this.createAndOpen(this.currentFolder()),
    });
    this.addRibbonIcon('list-tree', '새 아웃라인 만들기', () => {
      void this.createAndOpen(this.currentFolder());
    });
    this.registerEvent(
      this.app.workspace.on('file-menu', (menu, file) => {
        if (!isFolder(file)) return;
        menu.addItem((item) =>
          item
            .setTitle('새 아웃라인')
            .setIcon('list-tree')
            .onClick(() => void this.createAndOpen(file))
        );
      })
    );

    // 7. 현재 열린 탭에 대한 명령
    this.addCommand({
      id: 'toggle-view',
      name: '불릿 / 보드 전환',
      checkCallback: (checking) => {
        const view = this.app.workspace.getActiveViewOfType(OutlineFileView);
        if (!view) return false;
        if (!checking) view.toggleViewMode();
        return true;
      },
    });
    this.addCommand({
      id: 'export-markdown',
      name: 'Markdown 노트로 내보내기',
      checkCallback: (checking) => {
        const view = this.app.workspace.getActiveViewOfType(OutlineFileView);
        if (!view) return false;
        if (!checking) view.exportAsMarkdown();
        return true;
      },
    });

    // 8. "내부 링크 복사" 프로토콜: obsidian://vibe-outline?file=<경로>&node=<불릿 id>
    this.registerObsidianProtocolHandler(OUTLINE_PROTOCOL_ACTION, (params) => {
      void this.openNodeLink(params.file, params.node);
    });

    // 9. 메타데이터 캐시 & 그래프 뷰 색인 이벤트 바인딩
    this.registerEvent(
      this.app.vault.on('modify', (file) => {
        if (file instanceof TFile && file.extension === OUTLINE_EXTENSION) {
          void syncOutlineMetadata(this.app, file);
        }
      })
    );
    this.registerEvent(
      this.app.vault.on('create', (file) => {
        if (file instanceof TFile && file.extension === OUTLINE_EXTENSION) {
          void syncOutlineMetadata(this.app, file);
        }
      })
    );
    this.registerEvent(
      this.app.vault.on('rename', (file) => {
        if (file instanceof TFile && file.extension === OUTLINE_EXTENSION) {
          void syncOutlineMetadata(this.app, file);
        }
      })
    );

    // 10. 초기 로드 시 볼트 내 기존 .outline 파일 색인 1회 실행
    this.app.workspace.onLayoutReady(() => {
      const files = this.app.vault.getFiles();
      for (const file of files) {
        if (file.extension === OUTLINE_EXTENSION) {
          void syncOutlineMetadata(this.app, file);
        }
      }
    });
  }

  onunload(): void {
    this.canvasInterceptor?.destroy();
    this.canvasInterceptor = null;
    this.livePreviewWatcher?.destroy();
    this.livePreviewWatcher = null;
  }

  /** 새 파일을 둘 폴더: 지금 보는 파일의 폴더(없으면 옵시디언 설정의 새 파일 위치) */
  private currentFolder(): TFolder {
    const active = this.app.workspace.getActiveFile();
    return this.app.fileManager.getNewFileParent(active?.path ?? '');
  }

  private async createAndOpen(folder: TFolder): Promise<void> {
    try {
      const file = await createOutlineFile(this.app, folder);
      await this.app.workspace.getLeaf(false).openFile(file);
    } catch (err) {
      console.error('아웃라인 만들기 실패:', err);
      new Notice('아웃라인 파일을 만들지 못했습니다.');
    }
  }

  /**
   * 공식 Resolver(metadataCache.getFirstLinkpathDest)를 사용하여
   * 파일이 어느 하위 폴더로 이동했든 이름만으로 안전하게 탐색
   */
  private async openNodeLink(path: string | undefined, nodeId: string | undefined): Promise<void> {
    if (!path) {
      new Notice('주소에 파일 정보가 없습니다.');
      return;
    }

    // 옵시디언 공식 Resolver 우선 조회
    let file: TAbstractFile | null = this.app.metadataCache.getFirstLinkpathDest(path, '');
    if (!file) {
      file = this.app.vault.getAbstractFileByPath(path);
    }

    if (!(file instanceof TFile)) {
      new Notice(`아웃라인 파일을 찾지 못했습니다: ${path}`);
      return;
    }

    const leaf = this.app.workspace.getLeaf(false);
    await leaf.openFile(file);
    if (nodeId && leaf.view instanceof OutlineFileView) {
      leaf.view.revealNode(nodeId);
    }
  }
}
