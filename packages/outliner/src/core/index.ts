/**
 * @file index.ts
 * @description @vibe/outliner/core Public API
 * - [Micro] outline : 단일 아웃라인 트리 코어 (Block, transforms, queries, views)
 * - [Macro] workspace : 워크스페이스와 그 안에 나란히 놓인 프로젝트들 (Workspace, Project)
 * 파일 규격(읽기·쓰기·검증)은 이 패키지가 아니라 @vibe/outliner/dto 가 갖는다.
 */

export * from './outline';
export * from './workspace';
