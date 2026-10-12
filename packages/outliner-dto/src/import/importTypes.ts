/**
 * @file importTypes.ts
 * @description 가져오기의 입력과 결과 계약
 *
 * 가져오는 파일은 남의 데이터다. 지금 열려 있는 워크스페이스와는 아무것도 맞춰 보지 않고,
 * 읽을 수 있는 구조인지만 확인해 언제나 새 워크스페이스로 만든다.
 */

import type { ProjectId, Workspace } from '@vibe/outliner-core';

/** 가져올 파일들: 고른 폴더 기준 상대 경로('/' 구분) -> 파일 글자 */
export type ImportFiles = Record<string, string>;

/** 파일을 프로젝트로 받아들이지 않은 이유 */
export type ImportSkipReason =
  | 'parse-error'
  | 'not-a-project'
  | 'unsupported-version'
  | 'duplicate-id';

export interface ImportSkippedFile {
  path: string;
  reason: ImportSkipReason;
  /** unsupported-version 일 때 그 파일의 규격 번호 */
  version?: string;
}

export interface ImportedProject {
  path: string;
  projectId: ProjectId;
  title: string;
  nodeCount: number;
}

export interface ImportResult {
  /** 읽어 들인 새 워크스페이스. 프로젝트를 하나도 읽지 못했으면 null */
  workspace: Workspace | null;
  projects: ImportedProject[];
  skipped: ImportSkippedFile[];
}

export interface ReadImportOptions {
  /** 새 워크스페이스의 제목 (보통 고른 폴더나 파일의 이름) */
  title: string;
}
