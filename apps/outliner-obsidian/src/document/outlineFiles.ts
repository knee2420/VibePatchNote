/**
 * @file outlineFiles.ts
 * @description 보관함 안의 .outline 파일 만들기·이름 바꾸기와 경로·주소 규칙
 */

import { type App, type TFile, type TFolder, Notice, normalizePath } from 'obsidian';
import { createDefaultProject } from '@vibe/outliner-core';
import { OUTLINE_FILE_EXTENSION, toVaultFileBase } from '@vibe/outliner-dto';
import { writeOutlineText } from './outlineDocument';

/** 옵시디언에 등록하는 확장자 (점 없이) */
export const OUTLINE_EXTENSION = OUTLINE_FILE_EXTENSION.slice(1);

export const VIEW_TYPE_OUTLINE = 'vibe-outline';
/** `obsidian://vibe-outline?file=...&node=...` 주소의 동작 이름 */
export const OUTLINE_PROTOCOL_ACTION = 'vibe-outline';

const NEW_OUTLINE_BASE = '제목 없음';

function joinPath(folder: TFolder, fileName: string): string {
  return normalizePath(folder.isRoot() ? fileName : `${folder.path}/${fileName}`);
}

/** 폴더 안에서 아직 쓰이지 않은 파일 경로를 찾는다. 겹치면 ` 1`, ` 2` 를 붙인다. */
export function findFreePath(app: App, folder: TFolder, base: string, extension: string): string {
  let path = joinPath(folder, `${base}.${extension}`);
  for (let n = 1; app.vault.getAbstractFileByPath(path); n++) {
    path = joinPath(folder, `${base} ${n}.${extension}`);
  }
  return path;
}

/** 폴더에 새 .outline 파일을 만든다. */
export async function createOutlineFile(app: App, folder: TFolder): Promise<TFile> {
  const path = findFreePath(app, folder, NEW_OUTLINE_BASE, OUTLINE_EXTENSION);
  const title = path.slice(path.lastIndexOf('/') + 1, -(OUTLINE_EXTENSION.length + 1));
  return app.vault.create(path, writeOutlineText(createDefaultProject(title), title));
}

/** 제목으로 쓸 수 있게 다듬은 파일 이름 (확장자 제외). 다듬고 나면 비는 제목은 null */
export function toOutlineBaseName(title: string): string | null {
  return title.trim() === '' ? null : toVaultFileBase(title);
}

/**
 * 파일 이름을 제목에 맞춰 바꾼다. (파일 이름이 곧 제목)
 * 같은 이름의 파일이 이미 있으면 바꾸지 않고 알린다.
 */
export async function renameOutlineFile(
  app: App,
  file: TFile,
  title: string
): Promise<'renamed' | 'unchanged' | 'conflict'> {
  const base = toOutlineBaseName(title);
  if (!base || base === file.basename) return 'unchanged';

  const folder = file.parent ?? app.vault.getRoot();
  const path = joinPath(folder, `${base}.${file.extension}`);
  if (app.vault.getAbstractFileByPath(path)) {
    new Notice(`같은 이름의 파일이 이미 있습니다: ${base}`);
    return 'conflict';
  }
  await app.fileManager.renameFile(file, path);
  return 'renamed';
}

/** 파일 옆에 새 파일을 만든다. 같은 이름이 있으면 번호를 붙이고, 있는 파일은 덮어쓰지 않는다. */
export async function createSiblingFile(
  app: App,
  file: TFile | null,
  fileName: string,
  text: string
): Promise<void> {
  const folder = file?.parent ?? app.vault.getRoot();
  const dot = fileName.lastIndexOf('.');
  const base = toOutlineBaseName(dot > 0 ? fileName.slice(0, dot) : fileName) ?? '내보낸 파일';
  const extension = dot > 0 ? fileName.slice(dot + 1) : 'md';

  try {
    const created = await app.vault.create(findFreePath(app, folder, base, extension), text);
    new Notice(`만들었습니다: ${created.path}`);
  } catch (err) {
    console.error('파일 만들기 실패:', err);
    new Notice('파일을 만들지 못했습니다.');
  }
}

/** 불릿으로 곧장 들어오는 주소 */
export function buildNodeLink(app: App, filePath: string, nodeId: string): string {
  // 옵시디언은 주소의 값을 %XX 로만 푼다. 빈칸이 + 로 바뀌지 않도록 하나씩 인코딩한다.
  const query = [
    ['vault', app.vault.getName()],
    ['file', filePath],
    ['node', nodeId],
  ]
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join('&');
  return `obsidian://${OUTLINE_PROTOCOL_ACTION}?${query}`;
}
