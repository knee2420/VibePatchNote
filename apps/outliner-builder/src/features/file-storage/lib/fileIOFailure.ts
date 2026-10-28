/**
 * @file fileIOFailure.ts
 * @description 보관함 입출력 실패의 종류 정의 (화면 상단 알림 바가 보여주는 것)
 */

export type FileIOFailure =
  | { kind: 'unsupported-version'; version: string }
  | { kind: 'open-failed' }
  | { kind: 'vault-unsupported' }
  | { kind: 'permission-denied' };
