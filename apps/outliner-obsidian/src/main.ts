/**
 * @file main.ts
 * @description Vibe Outliner 옵시디언 플러그인 — 등록만 한다. 실제 일은 각 폴더가 갖는다.
 * - surfaces/ 아웃라인이 보이는 자리 (탭, 노트 임베드, 코드 블록, 캔버스 카드)
 * - commands/ 명령·리본·폴더 메뉴·주소로 들어오는 진입점
 * - host/     편집 화면이 옵시디언에 부탁하는 일
 * - document/ 파일 ↔ 내용
 * - vault/    아웃라인 밖의 옵시디언(그래프·백링크·노트 편집기)에 아웃라인을 알리는 일
 * - mirror/   불릿과 그 미러인 캔버스 카드 (색인, 카드 안 불릿 입력칸, 켜고 끄기, 미러 창)
 */

import './styles.css';
import { type TAbstractFile, Plugin, TFile } from 'obsidian';
import { OutlineSettingTab } from './commands/OutlineSettingTab';
import { registerNodeLinkProtocol } from './commands/nodeLinkProtocol';
import { registerOutlineCommands } from './commands/outlineCommands';
import { OUTLINE_EXTENSION, VIEW_TYPE_OUTLINE } from './document/outlineFiles';
import { loadPluginSettings } from './host/pluginSettings';
import { MirrorIndex, toRawCard } from './mirror/mirrorIndex';
import { MirrorCards } from './mirror/MirrorCards';
import { MirrorSwitch } from './mirror/mirrorSwitch';
import { OutlineDocuments } from './document/outlineDocuments';
import { registerCanvasSyncCommands } from './commands/canvasSyncCommands';
import { CanvasCardWatcher } from './surfaces/entries/CanvasCardWatcher';
import { CanvasSelectionSync } from './surfaces/entries/CanvasSelectionSync';
import { SidePeek } from './surfaces/entries/SidePeek';
import { LivePreviewEmbedWatcher } from './surfaces/entries/LivePreviewEmbedWatcher';
import { registerOutlineCodeBlockProcessor } from './surfaces/entries/codeBlock';
import { registerOutlineMarkdownEmbedProcessor } from './surfaces/entries/readingEmbed';
import { OutlineFileView } from './surfaces/tab/OutlineFileView';
import { retargetOutlineFiles } from './vault/fileTargetTracker';
import { clearOutlineMetadata, syncOutlineMetadata } from './vault/outlineMetadataIndexer';

export default class VibeOutlinerPlugin extends Plugin {
  private canvasCardWatcher: CanvasCardWatcher | null = null;
  private livePreviewWatcher: LivePreviewEmbedWatcher | null = null;
  private canvasSelectionSync: CanvasSelectionSync | null = null;
  private sidePeek: SidePeek | null = null;

  async onload(): Promise<void> {
    // 0. 설정을 먼저 불러 둔다. (화면이 뜨자마자 딸린 파일의 기본 크기를 묻는다)
    await loadPluginSettings(this);
    this.addSettingTab(new OutlineSettingTab(this.app, this));

    // 1. .outline 확장자를 단독 탭 뷰에 등록
    this.registerView(
      VIEW_TYPE_OUTLINE,
      (leaf) =>
        new OutlineFileView(leaf, {
          extendHost: (view) => this.sidePeek?.hostFor(view) ?? {},
        })
    );
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
    this.canvasCardWatcher = new CanvasCardWatcher(this.app);
    this.canvasCardWatcher.init();

    // 4-1. 아웃라인 탭 ↔ 캔버스 카드 선택 맞추기 (실험)
    this.canvasSelectionSync = new CanvasSelectionSync(this.app);
    this.canvasSelectionSync.init();
    registerCanvasSyncCommands(this, this.canvasSelectionSync);

    // 4-2. 미러: 불릿을 보여 주고 고치는 캔버스 카드. 아웃라인 문서는 파일마다 하나만 메모리에 두고,
    //      탭과 미러 카드가 같은 문서를 본다. 선택 맞추기도 미러를 따른다. (실험)
    const mirrorIndex = new MirrorIndex(this.app);
    const documents = new OutlineDocuments(this.app);
    this.register(documents.init());
    const mirrorCards = new MirrorCards(this.app, mirrorIndex, documents);
    this.register(mirrorCards.init());
    const mirrorSwitch = new MirrorSwitch(this.app, mirrorIndex, documents);
    this.canvasSelectionSync.resolveCard = (data) => {
      const card = toRawCard(data);
      return card ? mirrorIndex.resolve(card) : null;
    };

    // 4-3. 불릿 ↔ 미러 카드를 오른쪽 반쪽 화면에 열기, 미러 메뉴와 미러 창 (실험)
    this.sidePeek = new SidePeek(this.app, this.canvasSelectionSync, mirrorIndex, mirrorSwitch);
    this.sidePeek.register(this);

    // 5. 호버 링크 미리보기 소스 등록 (Page Preview)
    this.registerHoverLinkSource(VIEW_TYPE_OUTLINE, {
      display: 'Vibe Outliner',
      defaultMod: true,
    });

    // 6. 명령·리본·폴더 메뉴, 그리고 "내부 링크 복사" 주소
    registerOutlineCommands(this);
    registerNodeLinkProtocol(this);

    // 8. 메타데이터 캐시 & 그래프 뷰 색인 이벤트 바인딩
    const isOutlinePath = (path: string) => path.endsWith(`.${OUTLINE_EXTENSION}`);
    const syncIfOutline = (file: TAbstractFile) => {
      if (file instanceof TFile && file.extension === OUTLINE_EXTENSION) {
        void syncOutlineMetadata(this.app, file);
      }
    };
    this.registerEvent(this.app.vault.on('modify', syncIfOutline));
    this.registerEvent(this.app.vault.on('create', syncIfOutline));
    // 미러 색인도 아웃라인·캔버스 파일이 바뀔 때마다 따라간다.
    this.registerEvent(this.app.vault.on('modify', (file) => void mirrorIndex.update(file)));
    this.registerEvent(this.app.vault.on('create', (file) => void mirrorIndex.update(file)));
    this.registerEvent(this.app.vault.on('delete', (file) => mirrorIndex.remove(file.path)));
    this.registerEvent(
      this.app.vault.on('rename', (file, oldPath) => {
        mirrorIndex.remove(oldPath);
        void mirrorIndex.update(file);
      })
    );
    // 이름이 바뀌거나 지워진 파일의 옛 색인은 남겨 두지 않는다.
    this.registerEvent(
      this.app.vault.on('rename', (file, oldPath) => {
        if (isOutlinePath(oldPath)) clearOutlineMetadata(this.app, oldPath);
        syncIfOutline(file);
        // 이 파일을 딸린 파일로 가리키던 아웃라인들의 주소를 새 이름으로 고친다.
        if (file instanceof TFile) void retargetOutlineFiles(this.app, file, oldPath);
      })
    );
    this.registerEvent(
      this.app.vault.on('delete', (file) => {
        if (isOutlinePath(file.path)) clearOutlineMetadata(this.app, file.path);
      })
    );

    // 9. 볼트 내 기존 .outline 파일 색인 즉시 동기화
    const syncAllOutlines = () => {
      const files = this.app.vault.getFiles();
      for (const file of files) {
        if (file.extension === OUTLINE_EXTENSION) {
          void syncOutlineMetadata(this.app, file);
        }
      }
    };

    const onReady = () => {
      syncAllOutlines();
      void mirrorIndex.build();
    };
    if (this.app.workspace.layoutReady) {
      onReady();
    } else {
      this.app.workspace.onLayoutReady(onReady);
    }
  }

  onunload(): void {
    this.canvasCardWatcher?.destroy();
    this.canvasCardWatcher = null;
    this.canvasSelectionSync?.destroy();
    this.canvasSelectionSync = null;
    this.sidePeek = null;
    this.livePreviewWatcher?.destroy();
    this.livePreviewWatcher = null;
  }
}
