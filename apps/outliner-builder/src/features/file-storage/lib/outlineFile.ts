/**
 * @file outlineFile.ts
 * @description 단일 .json 파일(가져오기용) 해석 + 파일 입출력 실패 종류 정의
 *
 * 파싱·검증·구버전 승격은 모두 `@vibe/outliner-core` 의 DTO 엔진이 한다.
 * 여기는 그 결과를 화면용 실패 종류로 옮기는 일만 한다.
 */

import { type Workspace, deserializeWorkspace } from '@vibe/outliner-core';

/** 파일 입출력 실패의 종류 */
export type FileIOFailure =
  | { kind: 'parse-error' }
  | { kind: 'invalid-format' }
  | { kind: 'unsupported-version'; version: string }
  | { kind: 'open-failed' }
  | { kind: 'vault-unsupported' }
  | { kind: 'permission-denied' }
  | { kind: 'nothing-to-import' };

export type ParsedWorkspaceFile =
  | { success: true; data: Workspace }
  | { success: false; failure: FileIOFailure };

export function parseWorkspaceText(text: string): ParsedWorkspaceFile {
  const result = deserializeWorkspace(text);
  if (result.success) {
    return { success: true, data: result.data };
  }
  if (result.reason === 'unsupported-version') {
    return { success: false, failure: { kind: 'unsupported-version', version: result.version } };
  }
  return { success: false, failure: { kind: result.reason } };
}
