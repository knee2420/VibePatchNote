/**
 * @file outlineFile.ts
 * @description .outline 파일 텍스트 해석 및 디스크 기록 (실패를 값으로 돌려준다)
 */

import { type OutlineDocument, safeValidateOutlineDocument } from '@vibe/outliner-core';

/** 파일 입출력 실패의 종류. 어떻게 보여줄지는 UI 가 정한다. */
export type FileIOFailure =
  | { kind: 'parse-error' }
  | { kind: 'invalid-format' }
  | { kind: 'unsupported-version'; version: string }
  | { kind: 'open-failed' }
  | { kind: 'save-failed' };

export type ParsedOutlineFile =
  | { success: true; data: OutlineDocument }
  | { success: false; failure: FileIOFailure };

export function parseOutlineText(text: string): ParsedOutlineFile {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return { success: false, failure: { kind: 'parse-error' } };
  }

  const validated = safeValidateOutlineDocument(json);
  if (validated.success) {
    return { success: true, data: validated.data };
  }
  if (validated.reason === 'unsupported-version') {
    return { success: false, failure: { kind: 'unsupported-version', version: validated.version } };
  }
  return { success: false, failure: { kind: 'invalid-format' } };
}

export function serializeOutlineDocument(document: OutlineDocument): string {
  return JSON.stringify(document, null, 2);
}

export async function writeOutlineFile(
  handle: FileSystemFileHandle,
  document: OutlineDocument
): Promise<void> {
  const writable = await handle.createWritable();
  await writable.write(serializeOutlineDocument(document));
  await writable.close();
}
