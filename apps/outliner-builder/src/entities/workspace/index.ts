/**
 * @file index.ts
 * @description entities/workspace 모듈 re-export
 */

export {
  useWorkspaceStore,
  useActiveProject,
  selectActiveProject,
} from './model/useWorkspaceStore';
export type { WorkspaceViewMode } from './model/useWorkspaceStore';
export { ProjectRefBadge } from './ui/ProjectRefBadge';
