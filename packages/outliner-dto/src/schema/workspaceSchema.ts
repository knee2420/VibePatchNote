/**
 * @file schema.ts
 * @description 워크스페이스 & 프로젝트 Zod 런타임 검증기 (.passthrough() 무손실 규격)
 *
 * 예전 파일에 남아 있는 칸(부모 프로젝트, 스냅샷, 연결 정보)은 검증하지 않고 그대로 통과시킨다.
 */

import { z } from 'zod';
import { type Project, type Workspace, OUTLINE_FORMAT_VERSION } from '@vibe/outliner-core';
import { outlineNodeSchema, viewModeSchema } from './outlineSchema';

export const projectMetaSchema = z.record(z.string(), z.unknown());

export const projectSchema: z.ZodType<Project> = z
  .object({
    id: z.string().min(1),
    title: z.string(),
    rootNodes: z.array(outlineNodeSchema),
    defaultView: viewModeSchema.optional(),
    order: z.number().optional(),
    meta: projectMetaSchema.optional(),
    createdAt: z.number(),
    updatedAt: z.number(),
  })
  .passthrough() as unknown as z.ZodType<Project>;

export const workspaceSchema: z.ZodType<Workspace> = z
  .object({
    version: z.literal(OUTLINE_FORMAT_VERSION),
    id: z.string().min(1),
    title: z.string(),
    projects: z.record(z.string(), projectSchema),
    activeProjectId: z.string().min(1),
    createdAt: z.number(),
    updatedAt: z.number(),
  })
  .passthrough() as unknown as z.ZodType<Workspace>;

export function validateWorkspace(data: unknown): Workspace {
  return workspaceSchema.parse(data);
}

export function safeValidateWorkspace(
  data: unknown
): { success: true; data: Workspace } | { success: false; error: z.ZodError } {
  const result = workspaceSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}
