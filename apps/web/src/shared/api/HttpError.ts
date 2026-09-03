/**
 * 백엔드가 2xx 이외의 응답을 돌려준 경우 발생하는 에러.
 * 호출부가 상태 코드로 분기할 수 있도록 status 를 보존합니다.
 */
export class HttpError extends Error {
  readonly status: number;
  readonly detail: string;

  constructor(status: number, detail: string) {
    super(`HTTP ${status}: ${detail}`);
    this.name = 'HttpError';
    this.status = status;
    this.detail = detail;
  }
}
