/**
 * @file outlineDocument.ts
 * @description 탭 하나가 열고 있는 .outline 파일의 내용 (탭마다 하나)
 *
 * 옵시디언에서는 파일 그 자체가 관리 단위다. 파일 글자를 `@vibe/outliner/dto` 로 읽어 여기에 올리고,
 * 저장할 때 다시 글자로 만든다. 읽지 못한 파일은 내용을 올리지 않고, 저장할 때도 건드리지 않는다.
 */

import { createStore, type StoreApi } from 'zustand/vanilla';
import { type Project, generateNodeId } from '@vibe/outliner/core';
import { parseProjectFile, serializeProjectFile } from '@vibe/outliner/dto';

/** 파일을 스캐폴드로 읽지 못한 이유 */
export type OutlineProblem =
  | { kind: 'parse-error' }
  | { kind: 'not-a-project' }
  | { kind: 'unsupported-version'; version: string };

export interface OutlineDocumentState {
  /** 읽어 들인 스캐폴드. 아직 파일이 없거나 읽지 못했으면 null */
  project: Project | null;
  problem: OutlineProblem | null;
}

export type OutlineDocumentStore = StoreApi<OutlineDocumentState>;

export function createOutlineDocumentStore(): OutlineDocumentStore {
  return createStore<OutlineDocumentState>(() => ({ project: null, problem: null }));
}

/** 내용이 없는 새 파일을 열었을 때의 빈 스캐폴드 */
function createBlankProject(title: string): Project {
  const now = Date.now();
  return { id: generateNodeId(), title, rootNodes: [], createdAt: now, updatedAt: now };
}

/** 파일 글자를 읽어 문서 상태로 만든다. 비어 있는 파일은 빈 스캐폴드로 본다. */
export function readOutlineText(text: string, title: string): OutlineDocumentState {
  if (text.trim() === '') return { project: createBlankProject(title), problem: null };

  const parsed = parseProjectFile(text);
  if (parsed.success) return { project: parsed.project, problem: null };
  if (parsed.reason === 'unsupported-version') {
    return { project: null, problem: { kind: 'unsupported-version', version: parsed.version } };
  }
  return { project: null, problem: { kind: parsed.reason } };
}

/**
 * 스캐폴드를 파일 글자로 만든다. 옵시디언에서는 파일 이름이 곧 제목이라,
 * 파일 안의 제목 칸은 저장할 때마다 파일 이름으로 맞춘다. (독립 앱이 이 파일을 읽을 때 쓰인다)
 */
export function writeOutlineText(project: Project, title: string): string {
  return serializeProjectFile({ ...project, title });
}
