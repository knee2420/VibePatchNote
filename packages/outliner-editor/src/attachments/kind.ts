/**
 * @file kind.ts
 * @description 파일 종류(이미지·PDF 등)가 지켜야 하는 공통 약속
 *
 * 종류 하나는 폴더 하나(`kinds/<이름>/`)이고, `registry.ts` 에 한 줄로 등록된다.
 * 편집 화면은 "이 파일을 누가 맡는가"만 등록부에 묻고, 받은 종류가 그리게 한다.
 * 종류는 실제 파일을 직접 만지지 않는다. 주소 풀기·열기·표지 만들기는 호스트(`OutlineFileHost`)에 부탁한다.
 */

import type React from 'react';
import type { FileDisplay, OutlineNodeFile } from '@vibe/outliner-core';
import type { OutlineFileHost } from '../session/host';

/** 그림으로 보이는 크기 ('제목만'은 종류와 상관없이 공통으로 그린다) */
export type FileBlockSize = Exclude<FileDisplay, 'title'>;

export interface FileBlockProps {
  file: OutlineNodeFile;
  size: FileBlockSize;
  /** 화면에 보일 파일 이름 */
  name: string;
  files: OutlineFileHost;
}

export interface FileKind {
  /** 설정과 등록부에서 쓰는 이름 (`image`, `pdf`) */
  id: string;
  /** 사용자에게 보이는 이름 */
  label: string;
  /** 맡는 확장자들 (소문자, 점 없이) */
  extensions: readonly string[];
  /** '제목만'으로 보일 때 이름 앞에 붙는 아이콘 */
  Icon: React.ComponentType<{ className?: string }>;
  /** (선택) '작게'·'크게'로 보일 때의 모습. 없으면 이 종류는 늘 제목만 보인다. */
  Block?: React.ComponentType<FileBlockProps>;
}
