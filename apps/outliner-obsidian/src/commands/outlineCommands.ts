/**
 * @file outlineCommands.ts
 * @description 옵시디언의 명령·리본·폴더 메뉴로 들어오는 진입점
 */

import { type Plugin, type TAbstractFile, type TFolder, Notice } from 'obsidian';
import { createOutlineFile } from '../document/outlineFiles';
import { OutlineFileView } from '../surfaces/tab/OutlineFileView';

function isFolder(file: TAbstractFile): file is TFolder {
  return 'children' in file;
}

export function registerOutlineCommands(plugin: Plugin): void {
  const { app } = plugin;

  /** 새 파일을 둘 폴더: 지금 보는 파일의 폴더(없으면 옵시디언 설정의 새 파일 위치) */
  const currentFolder = (): TFolder => {
    const active = app.workspace.getActiveFile();
    return app.fileManager.getNewFileParent(active?.path ?? '');
  };

  const createAndOpen = async (folder: TFolder): Promise<void> => {
    try {
      const file = await createOutlineFile(app, folder);
      await app.workspace.getLeaf(false).openFile(file);
    } catch (err) {
      console.error('아웃라인 만들기 실패:', err);
      new Notice('아웃라인 파일을 만들지 못했습니다.');
    }
  };

  // 새 파일을 만드는 진입점: 명령, 리본 아이콘, 폴더 컨텍스트 메뉴
  plugin.addCommand({
    id: 'new-outline',
    name: '새 아웃라인 만들기',
    callback: () => void createAndOpen(currentFolder()),
  });
  plugin.addRibbonIcon('list-tree', '새 아웃라인 만들기', () => {
    void createAndOpen(currentFolder());
  });
  plugin.registerEvent(
    app.workspace.on('file-menu', (menu, file) => {
      if (!isFolder(file)) return;
      menu.addItem((item) =>
        item
          .setTitle('새 아웃라인')
          .setIcon('list-tree')
          .onClick(() => void createAndOpen(file))
      );
    })
  );

  // 현재 열린 탭에 대한 명령
  plugin.addCommand({
    id: 'toggle-view',
    name: '불릿 / 보드 전환',
    checkCallback: (checking) => {
      const view = app.workspace.getActiveViewOfType(OutlineFileView);
      if (!view) return false;
      if (!checking) view.toggleViewMode();
      return true;
    },
  });
  plugin.addCommand({
    id: 'export-markdown',
    name: 'Markdown 노트로 내보내기',
    checkCallback: (checking) => {
      const view = app.workspace.getActiveViewOfType(OutlineFileView);
      if (!view) return false;
      if (!checking) view.exportAsMarkdown();
      return true;
    },
  });
}
