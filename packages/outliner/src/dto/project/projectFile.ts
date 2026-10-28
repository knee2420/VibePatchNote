/**
 * @file projectFile.ts
 * @description 프로젝트 1개 <-> 파일 1개의 글자 (순수 함수)
 *
 * 보관함 저장, 내보내기, 가져오기가 모두 이 규격 하나를 쓴다.
 * 파일 맨 위에 규격 번호를 두고, 그 아래에 프로젝트를 그대로 펼친다.
 * 파일 하나는 프로젝트 하나의 지금 내용이다. 이력은 담지 않는다.
 */

import { type Project, OUTLINE_FORMAT_VERSION } from '../../core';
import { projectSchema } from '../schema/workspaceSchema';

/** 독립 앱이 쓰는 확장자 */
export const PROJECT_FILE_EXTENSION = '.json';
/** 옵시디언 플러그인이 쓰는 확장자. 내용은 같은 JSON 이고 확장자만 다르다. */
export const OUTLINE_FILE_EXTENSION = '.outline';

export function serializeProjectFile(project: Project): string {
  return JSON.stringify({ version: OUTLINE_FORMAT_VERSION, ...project }, null, 2);
}

export type ParseProjectResult =
  | { success: true; project: Project }
  | { success: false; reason: 'parse-error' | 'not-a-project' }
  | { success: false; reason: 'unsupported-version'; version: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** 이미 JSON 으로 읽은 값이 프로젝트 파일 규격인지 확인한다. */
export function parseProjectValue(value: unknown): ParseProjectResult {
  if (!isRecord(value)) return { success: false, reason: 'not-a-project' };

  const { version, ...fields } = value;
  if (typeof version === 'string' && version !== OUTLINE_FORMAT_VERSION) {
    return { success: false, reason: 'unsupported-version', version };
  }

  const parsed = projectSchema.safeParse(fields);
  if (!parsed.success) return { success: false, reason: 'not-a-project' };
  return { success: true, project: parsed.data };
}

/** 파일 글자를 프로젝트로 읽는다. */
export function parseProjectFile(text: string): ParseProjectResult {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    return { success: false, reason: 'parse-error' };
  }
  return parseProjectValue(value);
}
