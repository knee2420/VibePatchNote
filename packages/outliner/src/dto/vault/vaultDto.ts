/**
 * @file vaultDto.ts
 * @description 보관함(Vault) 폴더 규격의 계약 정의 — 프로젝트 1개가 파일 1개
 *
 * 보관함 폴더의 생김새:
 *   <보관함>/
 *   ├── <프로젝트 제목>.json           프로젝트 1개 = 파일 1개 (식별은 파일 안의 id)
 *   └── .outliner/
 *       └── workspace.json            워크스페이스 메타 (id·제목·마지막으로 본 프로젝트)
 *
 * 이 층위는 실제 파일 시스템을 모른다. "경로 -> 텍스트" 묶음만 다루는 순수 함수이고,
 * 폴더를 읽고 쓰는 일은 호스트 앱이 한다.
 */

import type { Project, ProjectId, Workspace } from '../../core';
import { PROJECT_FILE_EXTENSION } from '../project/projectFile';

export const VAULT_MANIFEST_PATH = '.outliner/workspace.json';
export const VAULT_FILE_EXTENSION = PROJECT_FILE_EXTENSION;

/** 보관함 안의 파일들: 보관함 기준 상대 경로('/' 구분) -> 파일 텍스트 */
export type VaultFiles = Record<string, string>;

/**
 * 디스크에 지금 무엇이 있다고 알고 있는지의 기록.
 * 다음 저장 때 워크스페이스와 비교해, 달라진 파일만 쓰고 지우기 위한 기준선이다.
 */
export interface VaultDiskState {
  /** 디스크의 프로젝트 파일 내용 (워크스페이스의 프로젝트와 같은 객체면 "변경 없음") */
  projects: Record<ProjectId, Project>;
  /** 프로젝트 id -> 보관함 최상위의 파일 이름 */
  projectFiles: Record<ProjectId, string>;
  /** 보관함 최상위에 있지만 이 앱의 프로젝트가 아닌 파일 이름. 덮어쓰거나 지우지 않는다. */
  foreignFiles: string[];
  /** 디스크의 워크스페이스 메타 파일 텍스트 (없으면 null) */
  manifestText: string | null;
}

export const EMPTY_VAULT_DISK_STATE: VaultDiskState = {
  projects: {},
  projectFiles: {},
  foreignFiles: [],
  manifestText: null,
};

export interface VaultWrite {
  path: string;
  text: string;
}

/** 워크스페이스를 디스크에 맞추기 위해 해야 할 일. 쓰기를 모두 끝낸 뒤 지우기를 한다. */
export interface VaultSyncPlan {
  writes: VaultWrite[];
  deletes: string[];
  /** 이 계획을 모두 적용한 뒤의 디스크 상태 */
  disk: VaultDiskState;
}

/** 보관함을 읽다가 프로젝트로 받아들이지 않은 파일과 그 이유 */
export type VaultSkipReason =
  | 'parse-error'
  | 'not-a-project'
  | 'unsupported-version'
  | 'duplicate-id';

export interface VaultSkippedFile {
  path: string;
  reason: VaultSkipReason;
}

export type DeserializeVaultResult =
  | {
      success: true;
      /** 읽어 들인 워크스페이스. 프로젝트 파일이 하나도 없는 빈 보관함이면 null */
      workspace: Workspace | null;
      disk: VaultDiskState;
      skipped: VaultSkippedFile[];
    }
  | { success: false; reason: 'unsupported-version'; version: string };
