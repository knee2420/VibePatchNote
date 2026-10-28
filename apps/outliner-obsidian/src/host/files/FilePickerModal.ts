/**
 * @file FilePickerModal.ts
 * @description 불릿에 붙일 파일을 보관함에서 고르는 창
 */

import { type App, type TFile, FuzzySuggestModal } from 'obsidian';

export class FilePickerModal extends FuzzySuggestModal<TFile> {
  private readonly exclude: TFile | null;
  private resolve: ((file: TFile | null) => void) | null = null;

  /** @param exclude 목록에서 뺄 파일 (지금 편집 중인 아웃라인 자신) */
  constructor(app: App, exclude: TFile | null) {
    super(app);
    this.exclude = exclude;
    this.setPlaceholder('붙일 파일을 고르세요');
  }

  /** 창을 띄우고, 고른 파일을 돌려준다. 그냥 닫으면 null */
  pick(): Promise<TFile | null> {
    return new Promise((resolve) => {
      this.resolve = resolve;
      this.open();
    });
  }

  // 최근에 고친 파일이 위로 오게 한다.
  getItems(): TFile[] {
    return this.app.vault
      .getFiles()
      .filter((file) => file !== this.exclude)
      .sort((a, b) => b.stat.mtime - a.stat.mtime);
  }

  getItemText(file: TFile): string {
    return file.path;
  }

  onChooseItem(file: TFile): void {
    this.resolve?.(file);
    this.resolve = null;
  }

  onClose(): void {
    super.onClose();
    // 옵시디언은 고른 것을 알려 주기 전에 창부터 닫는다. 그 알림이 지나간 뒤에도 고른 것이 없으면 취소다.
    queueMicrotask(() => {
      this.resolve?.(null);
      this.resolve = null;
    });
  }
}
