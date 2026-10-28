/**
 * @file schema.ts
 * @description Zod 기반 .outline JSON 스키마 검증기 (데이터 규격 런타임 유효성 보장)
 *
 * 스키마가 모르는 필드는 버리지 않고 그대로 통과시킨다(passthrough).
 * 열었다가 다시 저장하는 것만으로 사용자의 파일에서 데이터가 사라지면 안 된다.
 */

import { z } from 'zod';
import {
  type OutlineDocument,
  type OutlineNode,
  type OutlineNodeFile,
  type OutlineNodeType,
  type ViewMode,
  OUTLINE_FORMAT_VERSION,
} from '../../core';

export const viewModeSchema: z.ZodType<ViewMode> = z.enum(['bullets', 'board']);

export const outlineNodeTypeSchema: z.ZodType<OutlineNodeType> = z.enum([
  'bullet',
  'h1',
  'h2',
  'h3',
  'todo',
  'code',
  'quote',
  'paragraph',
  'divider',
]);

/**
 * 불릿에 딸린 파일. 종류별 옵션(options)의 속 모양은 종류가 정하므로 여기서는 열어 둔다.
 * 보이는 크기는 파일에 적지 않는다. (호스트의 설정이 종류별로 정한다)
 */
export const outlineNodeFileSchema: z.ZodType<OutlineNodeFile> = z
  .object({
    target: z.string().min(1),
    options: z.record(z.unknown()).optional(),
  })
  .passthrough();

export const outlineNodeSchema: z.ZodType<OutlineNode> = z.lazy(() =>
  z
    .object({
      id: z.string().min(1),
      text: z.string(),
      children: z.array(outlineNodeSchema),
      isFolded: z.boolean().optional(),
      nodeType: outlineNodeTypeSchema.optional(),
      isCompleted: z.boolean().optional(),
      completedAt: z.number().optional(),
      note: z.string().optional(),
      file: outlineNodeFileSchema.optional(),
      viewMode: viewModeSchema.optional(),
      createdAt: z.number().optional(),
      updatedAt: z.number().optional(),
    })
    .passthrough()
);

export const outlineDocumentSchema: z.ZodType<OutlineDocument> = z
  .object({
    version: z.literal(OUTLINE_FORMAT_VERSION),
    id: z.string().min(1),
    title: z.string(),
    rootNodes: z.array(outlineNodeSchema),
    defaultView: viewModeSchema.optional(),
    createdAt: z.number(),
    updatedAt: z.number(),
  })
  .passthrough();

export function validateOutlineDocument(data: unknown): OutlineDocument {
  return outlineDocumentSchema.parse(data);
}

/**
 * 검증 실패는 두 가지로 구분한다.
 * - unsupported-version: 문서이긴 하나 이 코드가 모르는 포맷 버전
 * - invalid-format: .outline 문서가 아니거나 손상됨
 */
export type OutlineValidationResult =
  | { success: true; data: OutlineDocument }
  | { success: false; reason: 'unsupported-version'; version: string }
  | { success: false; reason: 'invalid-format'; error: z.ZodError };

export function safeValidateOutlineDocument(data: unknown): OutlineValidationResult {
  const version = readDeclaredVersion(data);
  if (version !== null && version !== OUTLINE_FORMAT_VERSION) {
    return { success: false, reason: 'unsupported-version', version };
  }

  const result = outlineDocumentSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, reason: 'invalid-format', error: result.error };
}

function readDeclaredVersion(data: unknown): string | null {
  if (typeof data !== 'object' || data === null || !('version' in data)) return null;
  return typeof data.version === 'string' ? data.version : null;
}
