/**
 * @file nodeLinkProtocol.ts
 * @description "내부 링크 복사"로 만든 주소를 여는 진입점
 * `obsidian://vibe-outline?file=<경로>&node=<불릿 id>`
 */

import { type App, type Plugin, type TAbstractFile, Notice, TFile } from 'obsidian';
import { OUTLINE_PROTOCOL_ACTION } from '../document/outlineFiles';
import { OutlineFileView } from '../surfaces/tab/OutlineFileView';

/**
 * 공식 Resolver(metadataCache.getFirstLinkpathDest)를 사용하여
 * 파일이 어느 하위 폴더로 이동했든 이름만으로 안전하게 탐색
 */
async function openNodeLink(
  app: App,
  path: string | undefined,
  nodeId: string | undefined
): Promise<void> {
  if (!path) {
    new Notice('주소에 파일 정보가 없습니다.');
    return;
  }

  // 옵시디언 공식 Resolver 우선 조회
  let file: TAbstractFile | null = app.metadataCache.getFirstLinkpathDest(path, '');
  if (!file) {
    file = app.vault.getAbstractFileByPath(path);
  }

  if (!(file instanceof TFile)) {
    new Notice(`아웃라인 파일을 찾지 못했습니다: ${path}`);
    return;
  }

  const leaf = app.workspace.getLeaf(false);
  await leaf.openFile(file);
  if (nodeId && leaf.view instanceof OutlineFileView) {
    leaf.view.revealNode(nodeId);
  }
}

export function registerNodeLinkProtocol(plugin: Plugin): void {
  plugin.registerObsidianProtocolHandler(OUTLINE_PROTOCOL_ACTION, (params) => {
    void openNodeLink(plugin.app, params.file, params.node);
  });
}
