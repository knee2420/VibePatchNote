/**
 * @file PairPickerModal.ts
 * @description 짝이 여러 개일 때 하나를 고르는 창 (캔버스에서 보기 / 아웃라인에서 보기)
 */

import { type App, SuggestModal } from 'obsidian';

export interface PairPickerItem<T> {
  value: T;
  title: string;
  /** 제목 아래 작은 글자 (경로, 열려 있음, 연결 방식 등) */
  note: string;
}

export class PairPickerModal<T> extends SuggestModal<PairPickerItem<T>> {
  private items: PairPickerItem<T>[];
  private onChoose: (value: T) => void;

  constructor(
    app: App,
    placeholder: string,
    items: PairPickerItem<T>[],
    onChoose: (value: T) => void
  ) {
    super(app);
    this.items = items;
    this.onChoose = onChoose;
    this.setPlaceholder(placeholder);
  }

  getSuggestions(query: string): PairPickerItem<T>[] {
    const q = query.trim().toLowerCase();
    if (!q) return this.items;
    return this.items.filter((item) => `${item.title} ${item.note}`.toLowerCase().includes(q));
  }

  renderSuggestion(item: PairPickerItem<T>, el: HTMLElement): void {
    const content = el.createDiv({ cls: 'suggestion-content' });
    content.createDiv({ cls: 'suggestion-title', text: item.title });
    content.createDiv({ cls: 'suggestion-note', text: item.note });
  }

  onChooseSuggestion(item: PairPickerItem<T>): void {
    this.onChoose(item.value);
  }
}
