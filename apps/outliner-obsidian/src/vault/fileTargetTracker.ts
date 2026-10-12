/**
 * @file fileTargetTracker.ts
 * @description 파일 이름이 바뀌면, 그 파일을 딸린 파일로 가리키던 아웃라인의 주소를 따라 고친다
 *
 * 옵시디언은 노트(.md) 안의 링크만 스스로 고쳐 준다. 아웃라인의 딸린 파일 주소는 우리가 고쳐야 한다.
 * 어느 아웃라인이 그 파일을 가리켰는지는 색인기가 만들어 둔 연결 정보로 안다.
 * 불릿 글자 안의 `[[링크]]` 는 여기서 다루지 않는다.
 */

import { type App, type TFile, parseLinktext } from 'obsidian';
import { type OutlineNode, isWebTarget } from '@vibe/outliner-core';
import { parseProjectFile } from '@vibe/outliner-dto';
import { writeOutlineText } from '../document/outlineDocument';
import { OUTLINE_EXTENSION } from '../document/outlineFiles';

/** 주소(`폴더/파일.pdf` 또는 `파일.pdf`)가 옛 경로를 가리키던 것인가 */
function pointedAt(linkPath: string, oldPath: string): boolean {
  return oldPath === linkPath || oldPath.endsWith(`/${linkPath}`);
}

/** 딸린 파일의 주소를 `fix` 로 고친 새 트리. 고친 것이 없으면 null */
function retarget(
  nodes: OutlineNode[],
  fix: (target: string) => string | null
): OutlineNode[] | null {
  let changed = false;
  const next = nodes.map((node) => {
    const children = retarget(node.children, fix);
    const target = node.file ? fix(node.file.target) : null;
    if (children === null && target === null) return node;

    changed = true;
    return {
      ...node,
      children: children ?? node.children,
      ...(node.file && target !== null ? { file: { ...node.file, target } } : {}),
    };
  });
  return changed ? next : null;
}

export async function retargetOutlineFiles(
  app: App,
  renamed: TFile,
  oldPath: string
): Promise<void> {
  const links = app.metadataCache.resolvedLinks;
  const outlines = app.vault
    .getFiles()
    .filter((file) => file.extension === OUTLINE_EXTENSION && links[file.path]?.[oldPath]);

  for (const outline of outlines) {
    try {
      await app.vault.process(outline, (text) => {
        const parsed = parseProjectFile(text);
        if (!parsed.success) return text;

        const rootNodes = retarget(parsed.project.rootNodes, (target) => {
          if (isWebTarget(target)) return null;
          const { path, subpath } = parseLinktext(target);
          // 위치만 옮겨서 주소가 여전히 통하면 그대로 둔다.
          if (app.metadataCache.getFirstLinkpathDest(path, outline.path)) return null;
          if (!pointedAt(path, oldPath)) return null;
          return app.metadataCache.fileToLinktext(renamed, outline.path, false) + subpath;
        });
        return rootNodes
          ? writeOutlineText({ ...parsed.project, rootNodes }, outline.basename)
          : text;
      });
    } catch (err) {
      console.error('[VibeOutliner] 딸린 파일 주소 고치기 실패:', outline.path, err);
    }
  }
}
