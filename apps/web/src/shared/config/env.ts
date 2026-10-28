/**
 * 앱 런타임 환경 설정 (SSOT)
 *
 * 백엔드 주소 같은 환경 의존 값은 반드시 이 모듈을 통해서만 참조합니다.
 * 각 feature/widget에서 호스트를 하드코딩하는 것을 금지합니다.
 */
const DEFAULT_API_BASE_URL = 'http://localhost:8000';

function readEnv(key: string): string | undefined {
  const value = import.meta.env[key];
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

export const env = {
  /** FastAPI 백엔드 오리진. `.env` 의 VITE_API_BASE_URL 로 덮어쓸 수 있습니다. */
  apiBaseUrl: readEnv('VITE_API_BASE_URL') ?? DEFAULT_API_BASE_URL,
} as const;
