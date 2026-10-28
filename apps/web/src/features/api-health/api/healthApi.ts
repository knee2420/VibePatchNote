import { httpClient } from '@/shared/api';

export interface HealthStatus {
  status: string;
  service: string;
}

/** FastAPI 하네스의 헬스체크 엔드포인트. */
export function fetchApiHealth(): Promise<HealthStatus> {
  return httpClient.get<HealthStatus>('/health');
}
