export const OPEN_LLM_SETTINGS_EVENT = 'vibe:open-llm-settings';

/** 키를 저장·삭제해서 공급자 상태가 바뀌었을 때. 상태 배지가 이걸 듣고 다시 읽습니다. */
export const LLM_SETTINGS_CHANGED_EVENT = 'vibe:llm-settings-changed';

export function requestLlmSettings(): void {
  window.dispatchEvent(new CustomEvent(OPEN_LLM_SETTINGS_EVENT));
}

export function notifyLlmSettingsChanged(): void {
  window.dispatchEvent(new CustomEvent(LLM_SETTINGS_CHANGED_EVENT));
}
