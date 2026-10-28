/**
 * @file MirrorPanelModal.ts
 * @description 미러 목록 창 (Workflowy 의 "See them" 처럼)
 * - 원본 불릿과 미러 카드가 있는 곳을 "폴더 › 폴더 › 파일 › 조상 불릿 › 불릿" 경로로 보여준다.
 * - 줄을 누르면(또는 Enter) 그곳을 옆 칸에 연다. 아래 단추로 미러를 한꺼번에 끈다.
 */

import { type App, Modal } from 'obsidian';

export interface MirrorPlace {
  kind: 'source' | 'card';
  /** 경로 조각들. 마지막 조각이 그 불릿·카드다. */
  segments: string[];
  /** 지금 다른 칸에 열려 있는지 */
  isOpen: boolean;
  open: () => void;
}

export interface MirrorPanelAction {
  label: string;
  icon?: string;
  run: () => void;
}

/** 파일 경로를 경로 조각으로: 폴더들 + 확장자를 뺀 파일 이름 */
export function pathSegments(path: string): string[] {
  const parts = path.split('/');
  const name = parts.pop() ?? path;
  return [...parts, name.replace(/\.[^.]+$/, '')];
}

export class MirrorPanelModal extends Modal {
  private heading: string;
  private places: MirrorPlace[];
  private actions: MirrorPanelAction[];

  constructor(app: App, heading: string, places: MirrorPlace[], actions: MirrorPanelAction[]) {
    super(app);
    this.heading = heading;
    this.places = places;
    this.actions = actions;
  }

  onOpen(): void {
    this.modalEl.addClass('vibe-outliner-mirror-panel');
    this.titleEl.setText(this.heading);

    const list = this.contentEl.createDiv({ cls: 'vibe-outliner-mirror-list' });
    this.places.forEach((place, index) => {
      const row = list.createDiv({
        cls: `vibe-outliner-mirror-row${place.kind === 'source' ? ' is-source' : ''}`,
        attr: { tabindex: '0', role: 'button' },
      });
      const meta = row.createDiv({ cls: 'vibe-outliner-mirror-meta' });
      meta.createSpan({ text: place.kind === 'source' ? '원본 · 아웃라인' : '미러 · 캔버스 카드' });
      if (place.isOpen) meta.createSpan({ cls: 'vibe-outliner-mirror-open', text: '열려 있음' });

      const crumb = row.createDiv({ cls: 'vibe-outliner-mirror-crumb' });
      crumb.createSpan({ cls: 'vibe-outliner-mirror-index', text: `${index + 1}.` });
      place.segments.forEach((segment, i) => {
        if (i > 0) crumb.createSpan({ cls: 'vibe-outliner-mirror-sep', text: '›' });
        const isLast = i === place.segments.length - 1;
        crumb.createSpan({
          cls: isLast ? 'vibe-outliner-mirror-leaf' : 'vibe-outliner-mirror-seg',
          text: segment || '(빈 글자)',
          attr: { title: segment },
        });
      });

      const go = () => {
        this.close();
        place.open();
      };
      row.addEventListener('click', go);
      row.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') go();
      });
    });

    if (this.actions.length > 0) {
      const footer = this.contentEl.createDiv({ cls: 'vibe-outliner-mirror-actions' });
      for (const action of this.actions) {
        const button = footer.createEl('button', { text: action.label });
        button.addEventListener('click', () => {
          this.close();
          action.run();
        });
      }
    }
  }

  onClose(): void {
    this.contentEl.empty();
  }
}
