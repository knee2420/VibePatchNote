/**
 * @file pluginSettings.ts
 * @description 플러그인 설정 (옵시디언이 보관하는 사용자 선택) — 읽고, 바꾸고, 바뀜을 알린다
 *
 * 플러그인은 보관함에 하나뿐이라 설정도 하나다. `main.ts` 가 켤 때 한 번 불러 두면,
 * 탭 화면이든 임베드든 같은 값을 본다.
 */

import type { Plugin } from 'obsidian';
import type { FileDisplay } from '@vibe/outliner-core';

export interface PluginSettings {
  /** 파일 종류(`image`, `pdf`)별 기본 표시 크기. 적혀 있지 않은 종류는 FALLBACK_FILE_DISPLAY */
  fileDisplay: Record<string, FileDisplay>;
}

/** 설정에 값이 없는 종류의 기본 크기 */
export const FALLBACK_FILE_DISPLAY: FileDisplay = 'small';

const FILE_DISPLAYS: readonly string[] = ['title', 'small', 'large'];

let owner: Plugin | null = null;
let settings: PluginSettings = { fileDisplay: {} };
const listeners = new Set<() => void>();

/** 저장된 값 중 알아볼 수 있는 것만 받는다. */
function readFileDisplay(saved: unknown): Record<string, FileDisplay> {
  if (typeof saved !== 'object' || saved === null) return {};
  const result: Record<string, FileDisplay> = {};
  for (const [kindId, value] of Object.entries(saved)) {
    if (typeof value === 'string' && FILE_DISPLAYS.includes(value)) {
      result[kindId] = value as FileDisplay;
    }
  }
  return result;
}

export async function loadPluginSettings(plugin: Plugin): Promise<void> {
  owner = plugin;
  const saved: unknown = await plugin.loadData();
  settings = {
    fileDisplay: readFileDisplay((saved as { fileDisplay?: unknown } | null)?.fileDisplay),
  };
}

export function getPluginSettings(): PluginSettings {
  return settings;
}

export async function updatePluginSettings(patch: Partial<PluginSettings>): Promise<void> {
  settings = { ...settings, ...patch };
  listeners.forEach((listener) => listener());
  await owner?.saveData(settings);
}

/** 설정이 바뀔 때마다 불린다. 돌려주는 함수로 그만 받는다. */
export function subscribePluginSettings(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
