/**
 * @file version.ts
 * @description .outline 파일 포맷 버전 (디스크에 남는 계약의 단일 정의)
 */

/** 포맷이 바뀌면 이 값과 schema.ts 를 함께 올린다. */
export const OUTLINE_FORMAT_VERSION = '1.0.0';

export type OutlineFormatVersion = typeof OUTLINE_FORMAT_VERSION;
