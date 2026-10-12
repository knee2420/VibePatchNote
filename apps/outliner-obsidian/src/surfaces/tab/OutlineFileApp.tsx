/**
 * @file OutlineFileApp.tsx
 * @description .outline 파일 하나의 화면 구성: 제목(파일 이름) + 경로 + 불릿 또는 보드
 */

import React from 'react';
import { useStore } from 'zustand';
import {
  OutlineBoard,
  OutlineEditorProvider,
  OutlineHeader,
  OutlineTree,
  useOutlineView,
} from '@vibe/outliner-editor';
import type { OutlineFileView } from './OutlineFileView';
import type { OutlineProblem } from '../../document/outlineDocument';

interface OutlineFileAppProps {
  view: OutlineFileView;
  /** 파일 이름 (확장자 제외). 옵시디언에서는 이것이 곧 제목이다. */
  title: string;
}

function describeProblem(problem: OutlineProblem): string {
  switch (problem.kind) {
    case 'parse-error':
      return '파일의 JSON 이 깨져 있어 열 수 없습니다.';
    case 'not-a-project':
      return '아웃라인 파일 규격이 아니라서 열 수 없습니다.';
    case 'unsupported-version':
      return `이 플러그인이 읽을 수 없는 규격 버전입니다 (${problem.version}).`;
  }
}

/** 불릿으로 볼지 보드로 볼지는 편집 상태에 달려 있어서, 편집 공급자 안에서 정한다. */
const OutlineBody: React.FC = () => {
  const { view } = useOutlineView();
  return view === 'board' ? <OutlineBoard /> : <OutlineTree />;
};

export const OutlineFileApp: React.FC<OutlineFileAppProps> = ({ view, title }) => {
  const { project, problem } = useStore(view.outline);

  if (problem) {
    return (
      <div className="px-6 py-10 text-sm text-(--text-muted)">
        <p className="font-medium text-(--text-normal)">{describeProblem(problem)}</p>
        <p className="mt-1">파일은 그대로 두었습니다. 내용을 바꾸지 않습니다.</p>
      </div>
    );
  }
  if (!project) return null;

  return (
    <OutlineEditorProvider
      store={view.editor}
      host={view.host}
      rootNodes={project.rootNodes}
      defaultView={project.defaultView}
    >
      <div className="max-w-5xl w-full mx-auto px-6 pt-4 pb-20 flex flex-col">
        <OutlineHeader
          rootTitle={title}
          onUpdateRootTitle={(next) => void view.renameTo(next)}
          rootPlaceholder="아웃라인 제목"
          zoomPlaceholder="불릿 제목"
        />
        <OutlineBody />
      </div>
    </OutlineEditorProvider>
  );
};
