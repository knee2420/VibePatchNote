/**
 * @file main.ts
 * @description Vibe Outliner 옵시디언 플러그인 — .outline 파일을 불릿 아웃라인으로 연다.
 *
 * 옵시디언에서는 파일 그 자체가 관리 단위다. 만들기·이름 바꾸기·삭제·이동은 옵시디언의 파일 탐색기가 하고,
 * 이 플러그인은 .outline 파일을 여는 화면과, 새 파일을 만드는 진입점만 더한다.
 */

import './styles.css';
import { type TAbstractFile, type TFolder, Notice, Plugin, TFile } from 'obsidian';
import {
  OUTLINE_PROTOCOL_ACTION,
  OutlineFileView,
  VIEW_TYPE_OUTLINE,
} from './OutlineFileView';
import { OUTLINE_EXTENSION, createOutlineFile } from './outlineFiles';

function isFolder(file: TAbstractFile): file is TFolder {
  return 'children' in file;
}

export default class VibeOutlinerPlugin extends Plugin {
  onload(): void {
    // 1. .outline 확장자를 우리 화면에 잇는다.
    this.registerView(VIEW_TYPE_OUTLINE, (leaf) => new OutlineFileView(leaf));
    this.registerExtensions([OUTLINE_EXTENSION], VIEW_TYPE_OUTLINE);

    // 2. 새 파일을 만드는 진입점: 명령, 왼쪽 띠 버튼, 폴더 우클릭 메뉴
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

    // 3. 지금 보는 아웃라인에 대한 명령
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

    // 4. "내부 링크 복사"로 만든 주소: obsidian://vibe-outline?file=<경로>&node=<불릿 id>
    this.registerObsidianProtocolHandler(OUTLINE_PROTOCOL_ACTION, (params) => {
      void this.openNodeLink(params.file, params.node);
    });
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

  private async openNodeLink(path: string | undefined, nodeId: string | undefined): Promise<void> {
    const file = path ? this.app.vault.getAbstractFileByPath(path) : null;
    if (!(file instanceof TFile)) {
      new Notice('주소가 가리키는 아웃라인 파일을 찾지 못했습니다.');
      return;
    }

    const leaf = this.app.workspace.getLeaf(false);
    await leaf.openFile(file);
    if (nodeId && leaf.view instanceof OutlineFileView) leaf.view.revealNode(nodeId);
  }
}
