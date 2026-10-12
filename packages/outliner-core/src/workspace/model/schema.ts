/**
 * @file schema.ts
 * @description 워크스페이스 & 프로젝트 Zod 런타임 검증기 (.passthrough() 무손실 규격)
 */

import { z } from 'zod';
import { OUTLINE_FORMAT_VERSION } from '../../outline/model/version';
import { outlineNodeSchema, viewModeSchema } from '../../outline/model/schema';
import type { Milestone, Project, Snapshot, Workspace } from './types';

export const projectMetaSchema = z.record(z.string(), z.unknown());

export const projectSchema: z.ZodType<Project> = z
  .object({
    id: z.string().min(1),
    title: z.string(),
    rootNodes: z.array(outlineNodeSchema),
    defaultView: viewModeSchema.optional(),
    parentProjectId: z.string().nullable().optional(),
    order: z.number().optional(),
    meta: projectMetaSchema.optional(),
    createdAt: z.number(),
    updatedAt: z.number(),
  })
  .passthrough() as unknown as z.ZodType<Project>;

export const snapshotSchema: z.ZodType<Snapshot> = z
  .object({
    id: z.string().min(1),
    projectId: z.string().min(1),
    timestamp: z.number(),
    milestoneName: z.string().optional(),
    summary: z.string().optional(),
    rootNodes: z.array(outlineNodeSchema),
  })
  .passthrough() as unknown as z.ZodType<Snapshot>;

export const workspaceSchema: z.ZodType<Workspace> = z
  .object({
    version: z.literal(OUTLINE_FORMAT_VERSION),
    id: z.string().min(1),
    title: z.string(),
    projects: z.record(z.string(), projectSchema),
    activeProjectId: z.string().min(1),
    // 파일에는 없어도 된다(snapshots 도입 이전 파일). 읽은 뒤에는 항상 존재한다.
    snapshots: z.record(z.string(), z.array(snapshotSchema)).optional().default({}),
    createdAt: z.number(),
    updatedAt: z.number(),
  })
  .passthrough() as unknown as z.ZodType<Workspace>;

export const milestoneSchema: z.ZodType<Milestone> = z
  .object({
    id: z.string().min(1),
    projectId: z.string().min(1),
    name: z.string().min(1),
    snapshotId: z.string().min(1),
    createdAt: z.number(),
  })
  .passthrough() as unknown as z.ZodType<Milestone>;

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
