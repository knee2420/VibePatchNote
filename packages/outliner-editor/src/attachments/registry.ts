/**
 * @file registry.ts
 * @description 파일 종류 등록부 — 종류를 붙이고 떼는 유일한 자리
 *
 * 종류를 더하려면 `kinds/<이름>/` 을 만들고 아래 목록에 한 줄을 넣는다. 빼려면 그 줄을 지운다.
 * 파일에는 종류가 적혀 있지 않으므로, 넣고 빼도 사용자의 파일은 그대로다.
 * 어느 종류도 맡지 않는 파일과 웹 주소는 기본 종류(`linkKind`)가 이름만 보여 준다.
 */

import { getTargetExtension, isWebTarget } from '@vibe/outliner-core';
import type { FileKind } from './kind';
import { imageKind } from './kinds/image';
import { linkKind, webKind } from './kinds/link';
import { pdfKind } from './kinds/pdf';

const KINDS: readonly FileKind[] = [imageKind, pdfKind];

/** 표시 크기를 고를 수 있는 종류들 (설정 화면이 이 목록으로 기본값 칸을 만든다) */
export const FILE_KINDS: ReadonlyArray<{ id: string; label: string }> = KINDS.filter(
  (kind) => kind.Block
).map(({ id, label }) => ({ id, label }));

/** 이 주소를 맡는 종류 */
export function fileKindOf(target: string): FileKind {
  if (isWebTarget(target)) return webKind;
  const extension = getTargetExtension(target);
  return KINDS.find((kind) => kind.extensions.includes(extension)) ?? linkKind;
}
