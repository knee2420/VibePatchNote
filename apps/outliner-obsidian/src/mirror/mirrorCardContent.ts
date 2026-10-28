/**
 * @file mirrorCardContent.ts
 * @description 미러 카드에 불릿을 아웃라인에서처럼 그린다. (실험)
 * - 글자: 옵시디언 마크다운으로 그린다. [[내부 링크]]는 눌러서 열고, 올려 두면 미리보기가 뜬다.
 * - 딸린 파일: 이미지는 그림으로, PDF 는 첫 쪽 미리보기로, 그 밖의 파일은 이름만. 누르면 아웃라인에서처럼 연다.
 * 글자와 파일은 따로 그린다. 글자만 바뀌면 파일 미리보기(PDF 첫 쪽 그리기)는 다시 하지 않는다.
 */

import { type App, type HoverParent, Component, Keymap, MarkdownRenderer, TFile } from 'obsidian';
import type { OutlineNodeFile } from '@vibe/outliner/core';
import type { OutlineFileHost } from '@vibe/outliner/editor';
import { VIEW_TYPE_OUTLINE } from '../document/outlineFiles';
import { createObsidianFiles } from '../host/files/obsidianFiles';

const IMAGE_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'avif', 'bmp']);
/** 미리보기가 있는 파일(이미지·PDF)이 카드에서 차지하는 높이: 그림 200 + 이름 줄 + 여백 */
export const FILE_PREVIEW_HEIGHT = 236;
/** 미리보기가 없는 파일의 이름 줄 높이 */
export const FILE_NAME_HEIGHT = 28;
/** PDF 첫 쪽을 그릴 폭 (카드 폭의 두 배쯤이라 확대해도 또렷하다) */
const PDF_COVER_WIDTH = 480;

export type FileKind = 'image' | 'pdf' | 'other';

function extensionOf(target: string): string {
  const path = target.split('#')[0]?.split('?')[0] ?? '';
  return path.slice(path.lastIndexOf('.') + 1).toLowerCase();
}

export function fileKindOf(target: string): FileKind {
  const extension = extensionOf(target);
  if (IMAGE_EXTENSIONS.has(extension)) return 'image';
  return extension === 'pdf' ? 'pdf' : 'other';
}

/** 딸린 파일이 카드에서 차지하는 높이 */
export function fileHeightOf(file: OutlineNodeFile | undefined): number {
  if (!file) return 0;
  return fileKindOf(file.target) === 'other' ? FILE_NAME_HEIGHT : FILE_PREVIEW_HEIGHT;
}

function fileNameOf(target: string): string {
  const path = target.split('#')[0] ?? target;
  return path.slice(path.lastIndexOf('/') + 1);
}

export class MirrorCardContent {
  readonly el: HTMLElement;
  private app: App;
  private outlinePath: string;
  private textEl: HTMLElement;
  private fileEl: HTMLElement;
  private files: OutlineFileHost;
  private component = new Component();
  private hoverParent: HoverParent = { hoverPopover: null };
  private shownText: string | null = null;
  private shownFile: string | null = null;
  /** 늦게 끝난 그리기가 새 것을 덮지 않게 하는 번호 */
  private textRun = 0;
  private fileRun = 0;

  constructor(app: App, outlinePath: string, doc: Document) {
    this.app = app;
    this.outlinePath = outlinePath;
    this.files = createObsidianFiles({
      app,
      getFile: () => {
        const file = app.vault.getAbstractFileByPath(outlinePath);
        return file instanceof TFile ? file : null;
      },
    });
    this.component.load();

    this.el = doc.createElement('div');
    this.el.className = 'vibe-outliner-mirror-view';
    this.textEl = doc.createElement('div');
    this.textEl.className = 'vibe-outliner-mirror-text markdown-rendered';
    this.fileEl = doc.createElement('div');
    this.fileEl.className = 'vibe-outliner-mirror-file';
    this.el.append(this.textEl, this.fileEl);
    this.bindEvents();
  }

  /** 불릿 글자와 딸린 파일을 보인다. 바뀐 것만 다시 그린다. */
  update(text: string, file: OutlineNodeFile | undefined): void {
    if (text !== this.shownText) {
      this.shownText = text;
      void this.renderText(text);
    }
    const target = file?.target ?? null;
    if (target !== this.shownFile) {
      this.shownFile = target;
      void this.renderFile(file);
    }
  }

  destroy(): void {
    this.component.unload();
    this.el.remove();
  }

  private async renderText(text: string): Promise<void> {
    const run = ++this.textRun;
    const next = this.textEl.ownerDocument.createElement('div');
    await MarkdownRenderer.render(this.app, text, next, this.outlinePath, this.component);
    if (run !== this.textRun) return;
    this.textEl.replaceChildren(...Array.from(next.childNodes));
  }

  private async renderFile(file: OutlineNodeFile | undefined): Promise<void> {
    const run = ++this.fileRun;
    const doc = this.fileEl.ownerDocument;
    this.fileEl.replaceChildren();
    this.fileEl.toggleAttribute('hidden', !file);
    if (!file) return;

    const kind = fileKindOf(file.target);
    const src =
      kind === 'image'
        ? this.files.resolveUrl(file.target)
        : kind === 'pdf'
          ? await this.files.thumbnail?.(file.target, PDF_COVER_WIDTH)
          : null;
    if (run !== this.fileRun) return;

    if (src) {
      const img = doc.createElement('img');
      img.className = 'vibe-outliner-mirror-file-preview';
      img.src = src;
      img.alt = fileNameOf(file.target);
      img.draggable = false;
      this.fileEl.appendChild(img);
    }
    const name = doc.createElement('div');
    name.className = 'vibe-outliner-mirror-file-name';
    name.textContent = fileNameOf(file.target);
    this.fileEl.appendChild(name);
    this.fileEl.dataset.target = file.target;
  }

  private bindEvents(): void {
    // 링크와 파일은 아웃라인에서처럼 연다. (카드 고르기·끌기는 캔버스가 그대로 한다)
    this.el.addEventListener('click', (event) => {
      const target = event.target as HTMLElement | null;
      const link = target?.closest('a');
      if (link) {
        event.preventDefault();
        event.stopPropagation();
        const href = link.dataset.href ?? link.getAttribute('href') ?? '';
        if (link.classList.contains('internal-link')) {
          void this.app.workspace.openLinkText(href, this.outlinePath, Keymap.isModEvent(event));
        } else if (link.classList.contains('external-link')) {
          window.open(href, '_blank');
        }
        return;
      }
      const fileTarget = target?.closest<HTMLElement>('.vibe-outliner-mirror-file')?.dataset.target;
      if (fileTarget) {
        event.stopPropagation();
        this.files.open(fileTarget);
      }
    });
    this.el.addEventListener('mouseover', (event) => {
      const link = (event.target as HTMLElement | null)?.closest('a.internal-link');
      if (!(link instanceof HTMLElement)) return;
      this.app.workspace.trigger('hover-link', {
        event,
        source: VIEW_TYPE_OUTLINE,
        hoverParent: this.hoverParent,
        targetEl: link,
        linktext: link.dataset.href ?? link.getAttribute('href') ?? '',
        sourcePath: this.outlinePath,
      });
    });
  }
}
