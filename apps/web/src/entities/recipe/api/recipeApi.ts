import { httpClient } from '@/shared/api';
import type { RecipeReadiness, RecipeRunAccepted, RecipeRevision } from '../model/types';

const BASE_PATH = '/api/v1/recipes';
export const recipeApi = {
  readiness: (docId: string, scaffoldId?: string) => httpClient.get<RecipeReadiness>(`${BASE_PATH}/readiness/${encodeURIComponent(docId)}${scaffoldId ? `?scaffold_id=${encodeURIComponent(scaffoldId)}` : ''}`),
  start: (docId: string, scaffoldId?: string) => httpClient.post<RecipeRunAccepted>(`${BASE_PATH}/runs`, { docId, scaffoldId }),
  get: (recipeId: string) => httpClient.get<{ recipe: RecipeRevision }>(`${BASE_PATH}/${encodeURIComponent(recipeId)}`),
  save: (recipeId: string, baseRevisionId: string, title: string, spec: Record<string, unknown>) =>
    httpClient.put<{ recipe: RecipeRevision }>(`${BASE_PATH}/${encodeURIComponent(recipeId)}`, { baseRevisionId, title, spec }),
  listByScaffold: (scaffoldId: string) => httpClient.get<Array<{ recipe: RecipeRevision }>>(`${BASE_PATH}/by-scaffold/${encodeURIComponent(scaffoldId)}`),
  listByDocument: (docId: string) => httpClient.get<Array<{ recipe: RecipeRevision }>>(`${BASE_PATH}/by-document/${encodeURIComponent(docId)}`),
};
