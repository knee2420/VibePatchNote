/**
 * @file fileName.ts
 * @description 프로젝트 제목 -> 보관함 파일 이름 규칙 (순수 함수)
 *
 * 파일 이름은 사람이 읽기 위한 것이고, 프로젝트의 식별은 파일 안의 id 가 한다.
 * 그래서 제목이 같거나 바뀌어도 연결은 깨지지 않는다.
 */

import type { Project, ProjectId } from '../../core';
import { VAULT_FILE_EXTENSION } from './vaultDto';

const FORBIDDEN_CHARS = '\\/:*?"<>|';
const WINDOWS_RESERVED_NAMES = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i;
const MAX_BASE_LENGTH = 80;
const UNTITLED_BASE = '제목 없음';

/** 어느 운영체제에서도 파일 이름으로 쓸 수 있는 형태로 다듬는다. (확장자 제외) */
export function toVaultFileBase(title: string): string {
  const cleaned = Array.from(title, (ch) =>
    ch.charCodeAt(0) < 32 || FORBIDDEN_CHARS.includes(ch) ? ' ' : ch
  )
    .join('')
    .replace(/\s+/g, ' ')
    .trim();

  let base = Array.from(cleaned)
    .slice(0, MAX_BASE_LENGTH)
    .join('')
    .replace(/[. ]+$/, '');

  if (!base) base = UNTITLED_BASE;
  if (WINDOWS_RESERVED_NAMES.test(base)) base = `_${base}`;
  return base;
}

/** 대소문자를 구분하지 않는 파일 시스템에서도 겹치지 않도록 비교용 키를 만든다. */
function nameKey(fileName: string): string {
  return fileName.toLowerCase();
}

/** `이름.json` 또는 `이름 (2).json` 꼴이면 그 제목의 파일로 본다. */
function fitsBase(fileName: string, base: string): boolean {
  const key = nameKey(fileName);
  const baseKey = nameKey(base);
  const extKey = nameKey(VAULT_FILE_EXTENSION);
  if (key === `${baseKey}${extKey}`) return true;
  if (!key.startsWith(`${baseKey} (`) || !key.endsWith(`)${extKey}`)) return false;
  const counter = key.slice(baseKey.length + 2, key.length - extKey.length - 1);
  return /^\d+$/.test(counter);
}

/**
 * 모든 프로젝트의 파일 이름을 정한다.
 * - 지금 쓰는 이름이 제목과 여전히 맞으면 그대로 둔다. (대소문자만 바뀐 제목도 그대로 둔다)
 * - 새로 정해야 하면 제목으로 만들고, 겹치면 ` (2)`, ` (3)` 을 붙인다.
 * - `reservedNames` (이 앱의 것이 아닌 파일) 와는 절대 겹치지 않는다.
 */
export function allocateProjectFileNames(
  projects: Record<ProjectId, Project>,
  currentNames: Record<ProjectId, string>,
  reservedNames: string[]
): Record<ProjectId, string> {
  const used = new Set(reservedNames.map(nameKey));
  const result: Record<ProjectId, string> = {};
  const pending: Array<{ id: ProjectId; base: string }> = [];

  for (const [id, project] of Object.entries(projects)) {
    const base = toVaultFileBase(project.title);
    const current = currentNames[id];
    if (current && fitsBase(current, base) && !used.has(nameKey(current))) {
      result[id] = current;
      used.add(nameKey(current));
    } else {
      pending.push({ id, base });
    }
  }

  for (const { id, base } of pending) {
    let name = `${base}${VAULT_FILE_EXTENSION}`;
    for (let n = 2; used.has(nameKey(name)); n++) {
      name = `${base} (${n})${VAULT_FILE_EXTENSION}`;
    }
    result[id] = name;
    used.add(nameKey(name));
  }

  return result;
}
