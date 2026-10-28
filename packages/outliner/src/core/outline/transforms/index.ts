/**
 * @file index.ts
 * @description outliner-core transforms (변형 행위) 모듈 re-export
 *
 * 불릿 트리를 바꾸는 길은 패치 엔진(`applyPatch`) 하나다.
 * `requests` 는 편집 동작을 패치 요청으로 옮겨 주고, `text` 는 글자만 다룬다.
 */

export * from './patch';
export * from './requests';
export * from './text';
