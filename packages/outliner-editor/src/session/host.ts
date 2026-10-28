/**
 * @file host.ts
 * @description 편집 화면이 호스트에 부탁하는 일 (환경마다 방법이 다른 것)
 *
 * 편집 화면은 독립 앱(브라우저)과 옵시디언 플러그인 양쪽에서 똑같이 쓰인다.
 * 확인 창, 주소 복사, 글자 내보내기처럼 환경마다 방법이 다른 일은 직접 하지 않고 여기에 부탁한다.
 */

import type React from 'react';
import type { FileDisplay, NodeId } from '@vibe/outliner-core';

/**
 * 드래그 앤 드롭으로 들어온 항목 (텍스트 위키링크 또는 파일 블록)
 */
export interface DroppedItem {
  /** 텍스트 불릿으로 넣을 내용 (예: [[문서명]]) */
  text?: string;
  /** 파일 블록으로 첨부할 대상 경로 (예: "attachments/photo.png") */
  fileTarget?: string;
}

/**
 * 불릿에 딸린 파일을 다루는 능력. 실제 파일이 어디에 있고 어떻게 여는지는 호스트만 안다.
 * 종류 모듈(이미지·PDF 등)은 옵시디언을 직접 부르지 않고 여기에만 부탁한다.
 */
export interface OutlineFileHost {
  /** 화면에 그릴 수 있는 주소(`<img src>` 등). 파일을 찾지 못하면 null */
  resolveUrl: (target: string) => string | null;
  /** 파일을 연다. 어디에 여는지(옆 패널·기본 프로그램·브라우저)는 호스트가 정한다. */
  open: (target: string, options?: Record<string, unknown>) => void;
  /** (선택) 마우스를 올렸을 때의 미리보기. 띄울지 말지(Ctrl 등)는 호스트가 정한다. */
  hoverPreview?: (event: MouseEvent, targetEl: HTMLElement, target: string) => void;
  /** 붙일 파일을 사용자가 고르게 한다. 고르지 않으면 null */
  pick: () => Promise<string | null>;
  /** 끌어다 놓거나 붙여 넣은 파일을 받아 들이고, 그 주소들을 돌려준다. */
  importFiles: (files: File[]) => Promise<string[]>;
  /** (선택) 드래그 중인 항목이 외부 OS 파일이거나 호스트 내부(옵시디언 파일 탐색기 등) 항목인지 판별 */
  isDraggingFile?: (event: DragEvent | React.DragEvent) => boolean;
  /** (선택) 드롭 이벤트를 해석하여 삽입할 항목(위키링크 텍스트 또는 파일 타깃) 목록을 돌려준다. */
  resolveDrop?: (event: DragEvent | React.DragEvent) => Promise<DroppedItem[]>;
  /** 종류(`image`, `pdf`)별 표시 크기. 파일마다 정하지 않고 호스트의 설정 하나가 정한다. */
  displayOf: (kindId: string) => FileDisplay;
  /** (선택) 표시 크기 설정이 바뀔 때 알림을 받는다. 돌려주는 함수로 그만 받는다. */
  subscribeDisplay?: (listener: () => void) => () => void;
  /** (선택) 표지 그림의 주소 (PDF 첫 쪽 등). 만들 수 없으면 null */
  thumbnail?: (target: string, width: number) => Promise<string | null>;
}

/** 호스트가 불릿 메뉴에 더하는 항목 (옵시디언: "캔버스에서 보기" 등) */
export interface OutlineHostMenuItem {
  label: string;
  run: () => void;
}

export interface OutlineHost {
  /** 되돌릴 수 없는 일을 하기 전에 사용자에게 확인을 받는다. */
  confirm: (message: string) => Promise<boolean>;
  /** 이 불릿으로 곧장 들어오는 주소를 클립보드에 복사한다. */
  copyNodeLink: (nodeId: NodeId) => Promise<void>;
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
  /**
   * (선택) 이 불릿이 있는 곳의 수 (불릿 자신 포함). 2 이상이면 미러가 있는 불릿이다.
   * 미러는 호스트가 정한다 (옵시디언: 같은 불릿을 가리키는 캔버스 카드).
   */
  mirrorCount?: (nodeId: NodeId) => number;
  /** (선택) 미러가 바뀔 때 알림을 받는다. 돌려주는 함수로 그만 받는다. */
  subscribeMirrors?: (listener: () => void) => () => void;
  /** (선택) 이 불릿의 미러 목록을 보여준다. */
  showMirrors?: (nodeId: NodeId) => void;
  /** (선택) 불릿 하나의 메뉴에 호스트가 더하는 항목. 메뉴를 열 때마다 묻는다. */
  nodeMenuItems?: (nodeId: NodeId) => OutlineHostMenuItem[];
  /** (선택) 불릿에 파일을 붙이고 여는 능력. 없으면 붙어 있는 파일은 이름만 보인다. */
  files?: OutlineFileHost;
}

/** 요소가 속한 창. 탭이 다른 창으로 옮겨질 수 있어서 전역 `window` 를 직접 쓰지 않는다. */
export function winOf(node: Node | null | undefined): Window {
  return node?.ownerDocument?.defaultView ?? window;
}
