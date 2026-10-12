/**
 * @file index.ts
 * @description @vibe/outliner-dto Public API — 아웃라이너 JSON 파일 규격의 유일한 주인
 *
 * 이 패키지는 실제 파일 시스템을 모른다. "글자 <-> 프로젝트·워크스페이스" 변환만 하는 순수 함수이고,
 * 폴더를 읽고 쓰는 일은 호스트 앱이 한다.
 * - schema  : 파일 검증 규칙
 * - project : 프로젝트 1개 <-> 파일 1개 (모든 저장·교환의 기본 단위)
 * - vault   : 보관함 폴더 규격과 자동 저장 계획 (planVaultSync, deserializeVault)
 * - export  : 내보낼 파일 만들기 (buildExportFile)
 * - import  : 가져오기 읽기 (readImport)
 */

export * from './schema';
export * from './project';
export * from './vault';
export * from './export';
export * from './import';
