/**
 * @file host.ts
 * @description 편집 화면이 호스트에 부탁하는 일 (환경마다 방법이 다른 것)
 *
 * 편집 화면은 독립 앱(브라우저)과 옵시디언 플러그인 양쪽에서 똑같이 쓰인다.
 * 확인 창, 주소 복사, 글자 내보내기처럼 환경마다 방법이 다른 일은 직접 하지 않고 여기에 부탁한다.
 */

import type { NodeId } from '@vibe/outliner-core';

export interface OutlineHost {
  /** 되돌릴 수 없는 일을 하기 전에 사용자에게 확인을 받는다. */
  confirm: (message: string) => Promise<boolean>;
  /** 이 불릿으로 곧장 들어오는 주소를 클립보드에 복사한다. */
  copyNodeLink: (nodeId: NodeId) => Promise<void>;
  /** (선택) 이 불릿의 마크다운 위키링크([[파일#불릿]] 또는 ![[...]])를 클립보드에 복사 */
  copyWikilink?: (nodeId: NodeId, embed?: boolean) => Promise<void>;
  /** 글자를 파일 하나로 내보낸다. (고른 불릿의 Markdown 목록 등) */
  exportText: (fileName: string, text: string) => void;
  /** 메뉴·대화상자를 붙일 자리. 편집 화면이 지금 떠 있는 창의 것이어야 한다. */
  getPortalRoot: () => HTMLElement;
  /** (선택) 불릿 텍스트 내 위키링크([[...]]) 클릭 시 대상 문서 열기 */
  openLink?: (link: string) => void;
  /** (선택) 불릿 텍스트를 호스트(옵시디언)의 네이티브 마크다운 렌더러로 렌더링 */
  renderMarkdown?: (markdown: string, containerEl: HTMLElement) => Promise<void> | void;
  /** (선택) 불릿 텍스트 내 링크 호버 시 미리보기 팝오버 트리거 */
  hoverLink?: (event: MouseEvent, targetEl: HTMLElement, linktext: string) => void;
  /** (선택) contenteditable 입력창에 옵시디언 자동완성(Suggest) 연결 */
  attachSuggest?: (
    inputEl: HTMLDivElement,
    onSelect: (insertedText: string, newCaretOffset: number) => void
  ) => () => void;
}

/** 요소가 속한 창. 탭이 다른 창으로 옮겨질 수 있어서 전역 `window` 를 직접 쓰지 않는다. */
export function winOf(node: Node | null | undefined): Window {
  return node?.ownerDocument?.defaultView ?? window;
}
