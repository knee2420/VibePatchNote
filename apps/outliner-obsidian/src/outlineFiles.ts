/**
 * @file outlineFiles.ts
 * @description 보관함 안의 .outline 파일 만들기와 경로 규칙
 */

import { type App, type TFile, type TFolder, normalizePath } from 'obsidian';
import { createDefaultProject } from '@vibe/outliner-core';
import { OUTLINE_FILE_EXTENSION, toVaultFileBase } from '@vibe/outliner-dto';
import { writeOutlineText } from './outlineDocument';

/** 옵시디언에 등록하는 확장자 (점 없이) */
export const OUTLINE_EXTENSION = OUTLINE_FILE_EXTENSION.slice(1);

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
