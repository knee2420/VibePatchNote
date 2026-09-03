import type {
  WorkspaceSession,
  WorkspaceSessionCreatePayload,
  WorkspaceSessionUpdatePayload,
} from '@/entities/workspace-session';
import { httpClient } from '@/shared/api';

const BASE_PATH = '/api/v1/workspaces';

/** 워크스페이스 세션 CRUD 단일 진입점. */
export const workspaceApi = {
  list: () => httpClient.get<WorkspaceSession[]>(BASE_PATH),

  get: (id: string) => httpClient.get<WorkspaceSession>(`${BASE_PATH}/${id}`),

  create: (payload: WorkspaceSessionCreatePayload) =>
    httpClient.post<WorkspaceSession>(BASE_PATH, payload),

  update: (id: string, payload: WorkspaceSessionUpdatePayload) =>
    httpClient.put<WorkspaceSession>(`${BASE_PATH}/${id}`, payload),

  remove: (id: string) => httpClient.delete(`${BASE_PATH}/${id}`),
};
