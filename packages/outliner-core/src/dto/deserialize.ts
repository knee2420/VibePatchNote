/**
 * @file deserialize.ts
 * @description 파일 텍스트 -> Workspace 역직렬화 (순수 함수, 구버전 자동 승격 포함)
 */

import { safeValidateOutlineDocument } from '../outline/model/schema';
import { safeValidateWorkspace } from '../workspace/model/schema';
import { upgradeDocumentToWorkspace } from './upgrade';
import type { DeserializeWorkspaceResult } from './workspaceDto';

/**
 * 파일 텍스트를 Workspace 로 읽는다.
 * 1. JSON 파싱
 * 2. Workspace 규격이면 그대로 반환
 * 3. 구버전 단일 OutlineDocument 규격이면 Workspace 로 승격해 반환
 * 4. 그 외에는 실패 사유 반환
 */
export function deserializeWorkspace(jsonString: string): DeserializeWorkspaceResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonString);
  } catch {
    return { success: false, reason: 'parse-error' };
  }

  const asWorkspace = safeValidateWorkspace(parsed);
  if (asWorkspace.success) {
    return { success: true, data: asWorkspace.data, upgradedFrom: null };
  }

  const asDocument = safeValidateOutlineDocument(parsed);
  if (asDocument.success) {
    return {
      success: true,
      data: upgradeDocumentToWorkspace(asDocument.data),
      upgradedFrom: 'outline-document',
    };
  }

  if (asDocument.reason === 'unsupported-version') {
    return { success: false, reason: 'unsupported-version', version: asDocument.version };
  }
  return { success: false, reason: 'invalid-format' };
}
