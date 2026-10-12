/**
 * @file index.ts
 * @description [DTO 층위] 워크스페이스 직렬화/역직렬화 모듈 re-export
 * - 단일 파일 규격: 내보내기·가져오기용 (serializeWorkspace, deserializeWorkspace)
 * - 보관함 폴더 규격: 프로젝트 1개 = 파일 1개 (planVaultSync, deserializeVault)
 */

export * from './workspaceDto';
export * from './serialize';
export * from './deserialize';
export * from './upgrade';
export * from './vault';
