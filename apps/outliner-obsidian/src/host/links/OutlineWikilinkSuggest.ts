/**
 * @file OutlineWikilinkSuggest.ts
 * @description contenteditable 불릿 에디터 전용 옵시디언 네이티브 파일/위키링크 자동완성 제안기
 *
 * 입력칸의 글자는 편집 화면의 것이라 여기서 직접 고치지 않는다.
 * 고른 파일로 바꾼 글자와 캐럿 자리를 계산해 돌려주기만 한다.
 */

import { AbstractInputSuggest, type App, type TFile } from 'obsidian';

/** 캐럿 바로 앞의, 아직 닫히지 않은 `[[검색어` */
const OPEN_LINK_PATTERN = /\[\[([^\]]*)$/;
const LINKABLE_EXTENSIONS = ['md', 'outline', 'canvas'];

export class OutlineWikilinkSuggest extends AbstractInputSuggest<TFile> {
  private el: HTMLDivElement;
  private onSelectCallback: (text: string, newOffset: number) => void;

  constructor(
    app: App,
    el: HTMLDivElement,
    onSelectCallback: (text: string, newOffset: number) => void
  ) {
    super(app, el);
    this.el = el;
    this.onSelectCallback = onSelectCallback;
  }

  /** 같은 입력칸에 다시 포커스했을 때, 고른 결과를 받을 곳을 바꾼다. */
  setOnSelect(onSelectCallback: (text: string, newOffset: number) => void): void {
    this.onSelectCallback = onSelectCallback;
  }

  getSuggestions(inputStr: string): TFile[] {
    const match = (this.textBeforeCaret() ?? inputStr).match(OPEN_LINK_PATTERN);
    if (!match) return [];

    const query = match[1].toLowerCase().trim();
    return this.app.vault
      .getFiles()
      .filter((f) => LINKABLE_EXTENSIONS.includes(f.extension))
      .filter((f) => f.basename.toLowerCase().includes(query) || f.path.toLowerCase().includes(query))
      .slice(0, 20);
  }

  renderSuggestion(file: TFile, el: HTMLElement): void {
    el.addClass('mod-complex');
    const content = el.createDiv({ cls: 'suggestion-content' });
    const title = content.createDiv({ cls: 'suggestion-title', text: file.basename });
    if (file.extension !== 'md') {
      title.createSpan({ cls: 'nav-file-tag text-xs opacity-60 ml-1.5', text: `.${file.extension}` });
    }
    if (file.parent && file.parent.path !== '/') {
      content.createDiv({ cls: 'suggestion-note text-xs text-muted', text: file.parent.path });
    }
  }

  selectSuggestion(file: TFile, _evt: MouseEvent | KeyboardEvent): void {
    // 캐럿 앞의 [[검색어 를 [[파일 이름]] 으로 바꾼 글자와, 그 링크 바로 뒤의 캐럿 자리
    const before = this.textBeforeCaret();
    const match = before?.match(OPEN_LINK_PATTERN);
    if (before != null && match) {
      const text = this.el.textContent ?? '';
      const start = before.length - match[0].length;
      const link = `[[${file.basename}]]`;
      this.onSelectCallback(text.slice(0, start) + link + text.slice(before.length), start + link.length);
    }

    this.close();
  }

  /** 입력칸 처음부터 캐럿까지의 글자. 캐럿이 입력칸 밖에 있으면 null */
  private textBeforeCaret(): string | null {
    const doc = this.el.ownerDocument;
    const sel = doc.defaultView?.getSelection();
    if (!sel?.anchorNode || !this.el.contains(sel.anchorNode)) return null;

    const range = doc.createRange();
    range.selectNodeContents(this.el);
    range.setEnd(sel.anchorNode, sel.anchorOffset);
    return range.toString();
  }
}
