/**
 * @file OutlineSettingTab.ts
 * @description 옵시디언 설정 창의 Vibe Outliner 탭
 */

import { type App, type Plugin, PluginSettingTab, Setting } from 'obsidian';
import type { FileDisplay } from '@vibe/outliner-core';
import { FILE_KINDS } from '@vibe/outliner-editor';
import {
  FALLBACK_FILE_DISPLAY,
  getPluginSettings,
  updatePluginSettings,
} from '../host/pluginSettings';

const DISPLAY_LABELS: Record<FileDisplay, string> = {
  title: '제목만',
  small: '작게',
  large: '크게',
};

export class OutlineSettingTab extends PluginSettingTab {
  constructor(app: App, plugin: Plugin) {
    super(app, plugin);
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    new Setting(containerEl)
      .setName('딸린 파일의 기본 크기')
      .setDesc('불릿에 붙인 파일이 처음에 어떻게 보일지 종류별로 정합니다. 파일마다 따로 바꾼 것은 그대로 남습니다.')
      .setHeading();

    for (const kind of FILE_KINDS) {
      new Setting(containerEl).setName(kind.label).addDropdown((dropdown) =>
        dropdown
          .addOptions(DISPLAY_LABELS)
          .setValue(getPluginSettings().fileDisplay[kind.id] ?? FALLBACK_FILE_DISPLAY)
          .onChange((value) => {
            void updatePluginSettings({
              fileDisplay: { ...getPluginSettings().fileDisplay, [kind.id]: value as FileDisplay },
            });
          })
      );
    }
  }
}
