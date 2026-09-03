import { env } from '../config';

import { HttpError } from './HttpError';

async function toHttpError(response: Response): Promise<HttpError> {
  const detail = await response.text().catch(() => response.statusText);
  return new HttpError(response.status, detail || response.statusText);
}

async function request<TResponse>(path: string, init?: RequestInit): Promise<TResponse> {
  const response = await fetch(`${env.apiBaseUrl}${path}`, init);

  if (!response.ok) {
    throw await toHttpError(response);
  }

  if (response.status === 204) {
    return undefined as TResponse;
  }

  return (await response.json()) as TResponse;
}

function jsonInit(method: string, body: unknown): RequestInit {
  return {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };
}

/**
 * 백엔드 호출 단일 진입점.
 * 경로는 항상 오리진을 제외한 절대 경로(`/api/v1/...`)로 전달합니다.
 */
export const httpClient = {
  get: <TResponse>(path: string) => request<TResponse>(path),

  post: <TResponse>(path: string, body: unknown) => request<TResponse>(path, jsonInit('POST', body)),

  put: <TResponse>(path: string, body: unknown) => request<TResponse>(path, jsonInit('PUT', body)),

  delete: <TResponse = void>(path: string) => request<TResponse>(path, { method: 'DELETE' }),

  postFormData: <TResponse>(path: string, formData: FormData) =>
    request<TResponse>(path, { method: 'POST', body: formData }),
};
