/**
 * @file workspaceDto.ts
 * @description 디스크에 남는 워크스페이스 파일 계약(DTO)의 결과 타입 정의
 *
 * 이 디렉터리(dto/)는 "파일 텍스트 <-> Workspace" 변환의 유일한 장소다.
 * 호스트 앱은 여기의 함수만 호출하고, 파싱·검증·구버전 승격을 직접 하지 않는다.
 * 추후 packages/outliner-dto 로 폴더째 분리할 수 있도록 model 층위만 참조한다.
 */

import type { Workspace } from '../workspace/model/types';

/** 파일 텍스트를 Workspace 로 읽지 못한 이유 */
export type DeserializeWorkspaceFailure =
  | { success: false; reason: 'parse-error' }
  | { success: false; reason: 'invalid-format' }
  | { success: false; reason: 'unsupported-version'; version: string };

export type DeserializeWorkspaceResult =
  | {
      success: true;
      data: Workspace;
      /** 구버전 파일을 승격해 읽었다면 그 원본 규격. 최신 규격이면 null */
      upgradedFrom: 'outline-document' | null;
    }
  | DeserializeWorkspaceFailure;
