import type {
  WorkspaceSession,
  WorkspaceSessionCreatePayload,
  WorkspaceSessionUpdatePayload,
} from '@/entities/workspace-session';
import { httpClient } from '@/shared/api';

const BASE_PATH = '/api/v1/workspaces';

/**
 * A workspace update replaces the supplied graph fields, so concurrent PUTs for
 * the same session can otherwise arrive out of order and restore an older
 * snapshot. Keep the transport order identical to the user-action order.
 */
const pendingUpdates = new Map<string, Promise<unknown>>();

function updateWorkspace(id: string, payload: WorkspaceSessionUpdatePayload) {
  const previous = pendingUpdates.get(id) ?? Promise.resolve();
  const request = previous
    .catch(() => undefined)
    .then(() => httpClient.put<WorkspaceSession>(`${BASE_PATH}/${id}`, payload));

  pendingUpdates.set(id, request);
  const clearPending = () => {
    if (pendingUpdates.get(id) === request) pendingUpdates.delete(id);
  };
  void request.then(clearPending, clearPending);

  return request;
}

/** 워크스페이스 세션 CRUD 단일 진입점. */
export const workspaceApi = {
  list: () => httpClient.get<WorkspaceSession[]>(BASE_PATH),

  get: (id: string) => httpClient.get<WorkspaceSession>(`${BASE_PATH}/${id}`),

  create: (payload: WorkspaceSessionCreatePayload) =>
    httpClient.post<WorkspaceSession>(BASE_PATH, payload),

  update: updateWorkspace,

  remove: (id: string) => httpClient.delete(`${BASE_PATH}/${id}`),
};
