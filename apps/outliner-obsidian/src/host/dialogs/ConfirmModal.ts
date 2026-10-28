/**
 * @file ConfirmModal.ts
 * @description 되돌릴 수 없는 일을 하기 전에 묻는 옵시디언 확인 창
 */

import { type App, Modal, Setting } from 'obsidian';

export class ConfirmModal extends Modal {
  private readonly message: string;
  private answer = false;
  private resolve: ((confirmed: boolean) => void) | null = null;

  constructor(app: App, message: string) {
    super(app);
    this.message = message;
  }

  /** 창을 띄우고, 사용자가 고른 답을 돌려준다. 그냥 닫으면 취소로 본다. */
  ask(): Promise<boolean> {
    return new Promise((resolve) => {
      this.resolve = resolve;
      this.open();
    });
  }

  onOpen(): void {
    this.contentEl.createEl('p', { text: this.message });
    new Setting(this.contentEl)
      .addButton((button) => button.setButtonText('취소').onClick(() => this.close()))
      .addButton((button) =>
        button
          .setButtonText('삭제')
          .setWarning()
          .onClick(() => {
            this.answer = true;
            this.close();
          })
      );
  }

  onClose(): void {
    this.contentEl.empty();
    this.resolve?.(this.answer);
    this.resolve = null;
  }
}
