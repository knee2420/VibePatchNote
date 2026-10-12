/**
 * @file obsidianFiles.ts
 * @description 불릿에 딸린 파일을 옵시디언에서 다루는 법 (편집 화면의 파일 능력 `OutlineFileHost`)
 *
 * 파일의 주소는 옵시디언 링크 주소 꼴이라, 찾는 일은 옵시디언의 링크 해석기에 맡긴다.
 * - 열기: 옵시디언이 볼 수 있는 파일은 오른쪽 사이드바에(패널 하나를 계속 다시 쓴다),
 *         볼 수 없는 파일은 기본 프로그램으로, 웹 주소는 브라우저로
 * - 미리보기: 옵시디언의 "페이지 미리보기"에 넘긴다 (Ctrl 을 요구할지는 그 플러그인의 설정을 따른다)
 * - 받기: 끌어다 놓거나 붙여 넣은 파일은 옵시디언의 첨부 폴더 설정에 따라 보관함에 넣는다
 */

import {
  type App,
  type HoverParent,
  type TFile,
  type WorkspaceLeaf,
  Notice,
  parseLinktext,
} from 'obsidian';
import { isWebTarget } from '@vibe/outliner-core';
import type { OutlineFileHost } from '@vibe/outliner-editor';
import { VIEW_TYPE_OUTLINE } from '../../document/outlineFiles';
import {
  FALLBACK_FILE_DISPLAY,
  getPluginSettings,
  subscribePluginSettings,
} from '../pluginSettings';
import { FilePickerModal } from './FilePickerModal';
import { renderPdfCover } from './pdfCover';

/** 옵시디언이 직접 열어 볼 수 있는 확장자. 그 밖의 파일은 기본 프로그램으로 넘긴다. */
const VIEWABLE_EXTENSIONS: ReadonlySet<string> = new Set([
  'md', 'canvas', 'base', 'outline', 'pdf',
  'png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'avif', 'bmp',
  'mp3', 'wav', 'm4a', 'ogg', 'flac', '3gp',
  'mp4', 'mov', 'mkv', 'webm', 'ogv',
]);

/** 기본 프로그램으로 여는 옵시디언 기능. 공개 타입에는 없다. */
interface DefaultAppOpener {
  openWithDefaultApp?: (path: string) => void;
}

/** 오른쪽 사이드바에 열어 둔 패널. 다른 파일을 열면 내용만 바꾼다. */
let asideLeaf: WorkspaceLeaf | null = null;

function isAttached(app: App, leaf: WorkspaceLeaf): boolean {
  let found = false;
  app.workspace.iterateAllLeaves((each) => {
    if (each === leaf) found = true;
  });
  return found;
}

async function openAside(app: App, file: TFile, subpath: string): Promise<void> {
  if (!asideLeaf || !isAttached(app, asideLeaf)) asideLeaf = app.workspace.getRightLeaf(false);
  if (!asideLeaf) return;

  await asideLeaf.openFile(file, { active: false, eState: subpath ? { subpath } : undefined });
  // 사이드바가 접혀 있으면 편다.
  await app.workspace.revealLeaf(asideLeaf);
}

export interface ObsidianFilesOptions {
  app: App;
  /** 지금 편집 중인 아웃라인 파일. 링크를 풀 때의 기준이고, 고르기 목록에서는 뺀다. */
  getFile: () => TFile | null;
}

export function createObsidianFiles({ app, getFile }: ObsidianFilesOptions): OutlineFileHost {
  const sourcePath = () => getFile()?.path ?? '';
  const hoverParent: HoverParent = { hoverPopover: null };

  const resolveFile = (target: string): TFile | null =>
    app.metadataCache.getFirstLinkpathDest(parseLinktext(target).path, sourcePath());
  const toTarget = (file: TFile): string =>
    app.metadataCache.fileToLinktext(file, sourcePath(), false);

  return {
    resolveUrl: (target) => {
      if (isWebTarget(target)) return target;
      const file = resolveFile(target);
      return file ? app.vault.getResourcePath(file) : null;
    },

    open: (target, options) => {
      if (isWebTarget(target)) {
        window.open(target, '_blank');
        return;
      }

      const file = resolveFile(target);
      if (!file) {
        new Notice(`파일을 찾을 수 없습니다: ${target}`);
        return;
      }
      if (!VIEWABLE_EXTENSIONS.has(file.extension.toLowerCase())) {
        const opener = app as App & DefaultAppOpener;
        if (opener.openWithDefaultApp) opener.openWithDefaultApp(file.path);
        else new Notice(`이 파일은 옵시디언에서 열 수 없습니다: ${file.name}`);
        return;
      }

      // 주소에 적힌 위치(`#page=3`)가 먼저이고, 없으면 종류별 옵션의 쪽 번호를 쓴다.
      const page = options?.page;
      const subpath =
        parseLinktext(target).subpath || (typeof page === 'number' ? `#page=${page}` : '');
      void openAside(app, file, subpath);
    },

    hoverPreview: (event, targetEl, target) => {
      if (isWebTarget(target)) return;
      app.workspace.trigger('hover-link', {
        event,
        source: VIEW_TYPE_OUTLINE,
        hoverParent,
        targetEl,
        linktext: target,
        sourcePath: sourcePath(),
      });
    },

    pick: async () => {
      const file = await new FilePickerModal(app, getFile()).pick();
      return file ? toTarget(file) : null;
    },

    importFiles: async (incoming) => {
      const targets: string[] = [];
      for (const item of incoming) {
        const path = await app.fileManager.getAvailablePathForAttachment(item.name, sourcePath());
        const created = await app.vault.createBinary(path, await item.arrayBuffer());
        targets.push(toTarget(created));
      }
      return targets;
    },

    defaultDisplay: (kindId) => getPluginSettings().fileDisplay[kindId] ?? FALLBACK_FILE_DISPLAY,
    subscribeDefaults: subscribePluginSettings,

    thumbnail: async (target, width) => {
      const file = isWebTarget(target) ? null : resolveFile(target);
      return file?.extension.toLowerCase() === 'pdf' ? renderPdfCover(app, file, width) : null;
    },
  };
}
