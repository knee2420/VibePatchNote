/**
 * @file obsidianHost.ts
 * @description 편집 화면이 옵시디언에 부탁하는 일 (호스트 창구)
 *
 * 탭 화면과 임베드·캔버스 카드가 같은 창구를 쓴다. 서로 다른 것은 "어느 파일인가",
 * "메뉴·대화상자를 어디에 붙이는가", "렌더링한 조각을 누가 정리하는가" 셋뿐이라 그것만 받는다.
 */

import {
  type App,
  type Component,
  type HoverParent,
  type TFile,
  MarkdownRenderer,
} from 'obsidian';
import type { OutlineHost } from '@vibe/outliner-editor';
import { ConfirmModal } from './dialogs/ConfirmModal';
import { VIEW_TYPE_OUTLINE, buildNodeLink, createSiblingFile } from '../document/outlineFiles';
import { createObsidianFiles } from './files/obsidianFiles';
import { OutlineWikilinkSuggest } from './links/OutlineWikilinkSuggest';

/** 옵시디언의 검색 코어 플러그인. 공개 타입에는 없다. */
interface GlobalSearchHolder {
  internalPlugins?: {
    getPluginById?: (
      id: string
    ) => { instance?: { openGlobalSearch?: (query: string) => void } } | undefined;
  };
}

export interface ObsidianHostOptions {
  app: App;
  /** 지금 다루는 파일. 탭은 여는 파일이 바뀔 수 있어서 그때그때 묻는다. */
  getFile: () => TFile | null;
  getPortalRoot: () => HTMLElement;
  /** 렌더링한 조각의 수명을 맡길 곳. 이것이 내려갈 때 함께 정리된다. */
  component: Component;
}

export function createObsidianHost({
  app,
  getFile,
  getPortalRoot,
  component,
}: ObsidianHostOptions): OutlineHost {
  const sourcePath = () => getFile()?.path ?? '';
  const hoverParent: HoverParent = { hoverPopover: null };
  const suggests = new WeakMap<HTMLDivElement, OutlineWikilinkSuggest>();

  /** #태그를 누르면 검색 창에서 그 태그를 찾는다. 검색 플러그인이 꺼져 있으면 false */
  const searchTag = (tag: string): boolean => {
    const search = (app as App & GlobalSearchHolder).internalPlugins?.getPluginById?.(
      'global-search'
    );
    if (!search?.instance?.openGlobalSearch) return false;
    search.instance.openGlobalSearch(`tag:${tag}`);
    return true;
  };

  return {
    confirm: (message) => new ConfirmModal(app, message).ask(),
    copyNodeLink: (nodeId) =>
      navigator.clipboard.writeText(buildNodeLink(app, sourcePath(), nodeId)),
    exportText: (fileName, text) => void createSiblingFile(app, getFile(), fileName, text),
    getPortalRoot,
    openLink: (link) => {
      if (link.startsWith('#') && searchTag(link)) return;
      void app.workspace.openLinkText(link, sourcePath(), false);
    },
    renderMarkdown: async (markdown, containerEl) => {
      containerEl.empty();
      await MarkdownRenderer.render(app, markdown, containerEl, sourcePath(), component);
    },
    hoverLink: (event, targetEl, linktext) => {
      app.workspace.trigger('hover-link', {
        event,
        source: VIEW_TYPE_OUTLINE,
        hoverParent,
        targetEl,
        linktext,
        sourcePath: sourcePath(),
      });
    },
    attachSuggest: (inputEl, onSelect) => {
      // 옵시디언의 자동완성은 입력칸에 한 번 걸면 떼어 낼 방법이 없다. 포커스할 때마다 새로 만들면
      // 같은 입력칸에 여러 개가 쌓여 후보 창이 겹쳐 뜨므로, 입력칸마다 하나만 두고 다시 쓴다.
      let suggest = suggests.get(inputEl);
      if (suggest) {
        suggest.setOnSelect(onSelect);
      } else {
        suggest = new OutlineWikilinkSuggest(app, inputEl, onSelect);
        suggests.set(inputEl, suggest);
      }
      return () => suggest.close();
    },
    files: createObsidianFiles({ app, getFile }),
  };
}
