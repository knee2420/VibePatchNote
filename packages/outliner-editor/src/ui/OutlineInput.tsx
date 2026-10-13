/**
 * @file OutlineInput.tsx
 * @description plaintext-only contenteditable 기반 초경량 아웃라인 텍스트 입력 에디터
 * - 비포커스 상태에서 [[위키링크]]·#태그가 있으면 호스트(옵시디언) 네이티브 MarkdownRenderer 위임 렌더링 지원
 * - 링크/태그 클릭 시 host.openLink, 마우스 호버 시 host.hoverLink(Page Preview) 트리거
 * - 포커스 상태에서 host.attachSuggest 자동완성 드롭다운 연동
 * - 포커스 진입 시 100% 순수 plaintext contenteditable 모드로 안전하게 토글
 * - 붙여 넣기: 파일은 이 불릿에 붙이고, 글자를 고른 채 붙인 웹 주소는 그 글자를 링크로 만든다
 */

import React, { useEffect, useRef } from 'react';
import { type OutlineNodeType, isWebTarget } from '@vibe/outliner-core';
import { useEditorStore, useOutlineHost } from '../session/context';
import { winOf } from '../session/host';
import { extractFilesFromClipboard, useFileAttach } from '../attachments/useFileAttach';

/**
 * 불릿 종류별 글자 크기. 한 줄의 높이는 이 크기에 줄 높이(1.7배)를 곱한 값이다.
 * 줄(OutlineRow)에도 같은 크기를 걸어 두어, 불릿 점이 글자 첫 줄의 높이를 물려받아 그 가운데에 놓이게 한다.
 */
export const NODE_TEXT_SIZE: Record<OutlineNodeType, string> = {
  bullet: 'text-sm',
  todo: 'text-sm',
  paragraph: 'text-sm',
  h1: 'text-2xl',
  h2: 'text-xl',
  h3: 'text-lg',
  quote: 'text-sm',
  code: 'text-xs',
  divider: 'text-sm',
};

/** 불릿 종류별 글자 모양 (크기는 NODE_TEXT_SIZE) */
const TYPE_STYLES: Record<OutlineNodeType, string> = {
  bullet: 'font-normal',
  todo: 'font-normal',
  paragraph: 'font-normal',
  h1: 'font-bold tracking-tight',
  h2: 'font-semibold',
  h3: 'font-semibold',
  quote: 'italic border-l-2 border-(--background-modifier-border-hover) pl-3',
  code: 'font-mono bg-(--background-secondary) border border-(--background-modifier-border)',
  divider: 'font-normal',
};

/** 호스트 렌더러에 맡길 글자인지 가린다. 닫힌 [[링크]], #태그, [이름](주소), 웹 주소가 있을 때만이다. */
const WIKILINK_PATTERN = /\[\[[^[\]\n]+\]\]/;
const TAG_PATTERN = /(?:^|\s)#[\p{L}\p{N}_/-]*[\p{L}_/-]/u;
const MARKDOWN_LINK_PATTERN = /\[[^\]\n]+\]\([^)\s]+\)/;
const WEB_URL_PATTERN = /https?:\/\/\S+/i;

function hasLinkOrTag(text: string): boolean {
  return (
    WIKILINK_PATTERN.test(text) ||
    TAG_PATTERN.test(text) ||
    MARKDOWN_LINK_PATTERN.test(text) ||
    WEB_URL_PATTERN.test(text)
  );
}

/** 입력칸의 글자 기준 위치에 캐럿을 둔다. */
function placeCaret(el: HTMLElement, offset: number) {
  try {
    const sel = winOf(el).getSelection();
    const textNode = el.firstChild;
    if (!sel || !textNode) return;

    const range = el.ownerDocument.createRange();
    range.setStart(textNode, Math.min(offset, textNode.textContent?.length || 0));
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
  } catch {
    // 텍스트 노드 미생성 시 예외 무시
  }
}

interface OutlineInputProps {
  nodeId: string;
  initialText: string;
  nodeType?: OutlineNodeType;
  isCompleted?: boolean;
  onKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => void;
}

/** 호스트의 네이티브 마크다운 렌더러로 불릿 텍스트를 안전하게 렌더링하는 뷰 컴포넌트 */
const MarkdownBulletView: React.FC<{
  text: string;
  renderMarkdown: (md: string, el: HTMLElement) => Promise<void> | void;
  openLink?: (link: string) => void;
  hoverLink?: (event: MouseEvent, targetEl: HTMLElement, linktext: string) => void;
  className: string;
  nodeId: string;
  onEnterEdit: () => void;
}> = ({ text, renderMarkdown, openLink, hoverLink, className, nodeId, onEnterEdit }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 렌더는 비동기라, 글자가 빠르게 바뀌면 앞선 렌더가 늦게 끝나 겹쳐 그려질 수 있다.
    // 따로 그린 뒤 마지막 것만 옮겨 붙인다.
    const staging = container.ownerDocument.createElement('div');
    let isStale = false;
    void Promise.resolve(renderMarkdown(text, staging)).then(() => {
      if (!isStale) container.replaceChildren(...Array.from(staging.childNodes));
    });
    return () => {
      isStale = true;
    };
  }, [text, renderMarkdown]);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;

    // 위키링크(a.internal-link, a[data-href]) 클릭 시 대상 문서 열기
    const linkEl = target.closest<HTMLAnchorElement>('a.internal-link, a[data-href]');
    if (linkEl) {
      e.preventDefault();
      e.stopPropagation();
      const linkText = linkEl.getAttribute('data-href') || linkEl.getAttribute('href');
      if (linkText) {
        openLink?.(linkText);
      }
      return;
    }

    // 태그(a.tag) 클릭 시 검색 실행
    const tagEl = target.closest<HTMLAnchorElement>('a.tag');
    if (tagEl) {
      e.preventDefault();
      e.stopPropagation();
      const tagText = tagEl.getAttribute('href') || tagEl.textContent || '';
      if (tagText) {
        openLink?.(tagText);
      }
      return;
    }
  };

  const handleMouseOver = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!hoverLink) return;
    const target = e.target as HTMLElement;
    const linkEl = target.closest<HTMLAnchorElement>('a.internal-link, a[data-href]');
    if (linkEl) {
      const linkText = linkEl.getAttribute('data-href') || linkEl.getAttribute('href');
      if (linkText) {
        hoverLink(e.nativeEvent, linkEl, linkText);
      }
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    // 위키링크나 태그를 클릭한 경우 네이티브 클릭 유지
    if (target.closest('a, .internal-link, .tag')) {
      return;
    }
    // 일반 텍스트 영역을 누른 경우 브라우저 텍스트 드래그/밀어넣기 충돌을 방지하고 편집 모드 진입
    e.preventDefault();
    onEnterEdit();
  };

  return (
    <div
      ref={containerRef}
      data-node-id={nodeId}
      className={`${className} cursor-text select-text [&>p]:m-0 [&>p]:inline`}
      onClick={handleClick}
      onMouseOver={handleMouseOver}
      onMouseDown={handleMouseDown}
    />
  );
};

export const OutlineInput: React.FC<OutlineInputProps> = ({
  nodeId,
  initialText,
  nodeType = 'bullet',
  isCompleted = false,
  onKeyDown,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  /** 포커스 해제 확인을 기다리는 중이면, 그것을 취소하는 함수 */
  const cancelBlurCheck = useRef<(() => void) | null>(null);
  const { renderMarkdown, openLink, hoverLink, attachSuggest } = useOutlineHost();
  const focusedNodeId = useEditorStore((s) => s.focusedNodeId);
  const targetCaretOffset = useEditorStore((s) => s.targetCaretOffset);
  const updateText = useEditorStore((s) => s.updateText);
  const setFocus = useEditorStore((s) => s.setFocus);
  const { canAttach, pasteClipboardFiles } = useFileAttach();

  const isFocused = focusedNodeId === nodeId;
  const hasFormatting = hasLinkOrTag(initialText);

  // 마운트 시 initialText 즉시 주입
  const setInputRef = (el: HTMLDivElement | null) => {
    ref.current = el;
    if (el && el.textContent !== initialText) {
      el.textContent = initialText;
    }
  };

  // 1. 초기 텍스트 반영
  useEffect(() => {
    if (ref.current && ref.current.textContent !== initialText) {
      ref.current.textContent = initialText;
    }
  }, [initialText]);

  // 2. 포커스 진입 시 캐럿 오프셋 복원 (타이핑 중 덮어쓰기 방지)
  useEffect(() => {
    if (isFocused && ref.current) {
      ref.current.focus();
      if (targetCaretOffset !== null) placeCaret(ref.current, targetCaretOffset);
    }
  }, [isFocused, targetCaretOffset]);

  // 3. 옵시디언 자동완성(Suggest) 연결
  useEffect(() => {
    const el = ref.current;
    if (!isFocused || !el || !attachSuggest) return;

    // 입력칸의 글자는 편집 화면이 고친다. 호스트는 바꿀 글자와 캐럿 자리만 알려준다.
    return attachSuggest(el, (newText, newCaretOffset) => {
      el.textContent = newText;
      placeCaret(el, newCaretOffset);
      updateText(nodeId, newText);
      setFocus(nodeId, newCaretOffset);
    });
  }, [isFocused, attachSuggest, nodeId, updateText, setFocus]);

  // 4. 화면에서 사라질 때, 기다리던 포커스 해제 확인을 취소
  useEffect(
    () => () => {
      cancelBlurCheck.current?.();
    },
    []
  );

  const handleFocus = () => {
    if (focusedNodeId !== nodeId) {
      setFocus(nodeId);
    }
  };

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    const text = e.currentTarget.textContent || '';
    updateText(nodeId, text);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    // 1. 파일 및 캡처 이미지(스크린샷) 붙여넣기 대응: 이 불릿에 파일 첨부
    if (canAttach) {
      const pastedFiles = extractFilesFromClipboard(e.clipboardData);
      if (pastedFiles.length > 0) {
        e.preventDefault();
        void pasteClipboardFiles(nodeId, e.clipboardData);
        return;
      }
    }

    // 2. 글자를 고른 채 웹 주소를 붙여 넣으면 그 글자를 링크로 만든다. (Workflowy 방식)
    const pastedText = e.clipboardData.getData('text/plain').trim();
    const sel = winOf(e.currentTarget).getSelection();
    const selected =
      sel && !sel.isCollapsed && e.currentTarget.contains(sel.anchorNode) ? sel.toString() : '';
    if (selected && isWebTarget(pastedText) && !/\s/.test(pastedText)) {
      e.preventDefault();
      // 고른 글자를 바꿔 넣는다. 입력 이벤트가 따라 나와 편집 상태에도 반영된다.
      e.currentTarget.ownerDocument.execCommand('insertText', false, `[${selected}](${pastedText})`);
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    const text = e.currentTarget.textContent || '';
    updateText(nodeId, text);

    const relatedTarget = e.relatedTarget as HTMLElement | null;
    // 자동완성 팝업 클릭 중인 경우 해제 보류
    if (relatedTarget?.closest('.suggestion-container, .suggestion-item, .modal')) {
      return;
    }

    // 외부 빈 공간 클릭 시 안전하게 포커스 해제 (다른 불릿 클릭 시에는 onFocus가 즉시 덮어씀)
    const win = winOf(e.currentTarget);
    cancelBlurCheck.current?.();
    const timer = win.setTimeout(() => {
      cancelBlurCheck.current = null;
      const activeEl = win.document.activeElement;
      if (!activeEl || !activeEl.closest?.('[data-node-id]')) {
        setFocus(null);
      }
    }, 120);
    cancelBlurCheck.current = () => win.clearTimeout(timer);
  };

  // 위아래 여백은 줄 사이 간격(--outline-line-gap, OutlineTree 가 정한다)뿐이다.
  // 빈 불릿도 글자 한 줄만큼의 높이(1lh)는 갖는다.
  const commonClassName = `flex-1 py-(--outline-line-gap) px-1.5 min-h-[calc(1lh+2*var(--outline-line-gap))] font-[var(--font-text-theme)] leading-[1.7] tracking-[-0.005em] rounded hover:bg-(--background-modifier-hover) focus:bg-(--background-modifier-hover)/60 focus:ring-1 focus:ring-(--interactive-accent)/50 transition-colors break-words whitespace-pre-wrap ${
    NODE_TEXT_SIZE[nodeType]
  } ${TYPE_STYLES[nodeType]} ${
    isCompleted
      ? 'text-(--text-muted) opacity-60 line-through decoration-(--background-modifier-border-hover)'
      : nodeType === 'quote'
        ? 'text-(--text-muted) italic'
        : 'text-(--text-normal)'
  }`;

  // 포커스가 없고 서식이 있으며 호스트 마크다운 렌더러가 제공된 경우: 네이티브 뷰 렌더링
  if (!isFocused && hasFormatting && renderMarkdown) {
    return (
      <MarkdownBulletView
        text={initialText}
        renderMarkdown={renderMarkdown}
        openLink={openLink}
        hoverLink={hoverLink}
        className={commonClassName}
        nodeId={nodeId}
        onEnterEdit={() => setFocus(nodeId, initialText.length)}
      />
    );
  }

  return (
    <div
      ref={setInputRef}
      contentEditable="plaintext-only"
      suppressContentEditableWarning
      onFocus={handleFocus}
      onInput={handleInput}
      onPaste={handlePaste}
      onBlur={handleBlur}
      onKeyDown={onKeyDown}
      data-node-id={nodeId}
      className={`${commonClassName} cursor-text`}
      data-placeholder="내용을 입력하세요..."
    />
  );
};
