/**
 * @file FileBlock.tsx
 * @description 불릿 아래에 놓이는, 그 불릿에 딸린 파일 한 개
 *
 * - 보이는 크기: 제목만 / 작게 / 크게. 파일에 적힌 값이 없으면 호스트의 종류별 기본값을 따른다.
 * - 누르면 호스트가 연다. 마우스를 올리면 호스트가 미리보기를 띄운다. (Ctrl 을 요구할지는 호스트가 정한다)
 * - 그리는 일은 등록부가 골라 준 종류에 맡긴다. 그릴 수 없으면(종류에 그림이 없거나, 파일을 못 찾았거나,
 *   호스트에 파일 능력이 없으면) 이름만 보인다.
 */

import React, { useCallback, useSyncExternalStore } from 'react';
import { TriangleAlert, X } from 'lucide-react';
import {
  type FileDisplay,
  type NodeId,
  type OutlineNodeFile,
  getTargetName,
  isWebTarget,
} from '@vibe/outliner-core';
import { useEditorStore, useOutlineHost } from '../session/context';
import { winOf } from '../session/host';
import { fileKindOf } from './registry';

const DISPLAY_OPTIONS: Array<{ value: FileDisplay; label: string }> = [
  { value: 'title', label: '제목만' },
  { value: 'small', label: '작게' },
  { value: 'large', label: '크게' },
];

const noSubscription = () => () => {};

interface FileBlockProps {
  nodeId: NodeId;
  file: OutlineNodeFile;
}

export const FileBlock: React.FC<FileBlockProps> = ({ nodeId, file }) => {
  const { files } = useOutlineHost();
  const updateFile = useEditorStore((s) => s.updateFile);
  const detachFile = useEditorStore((s) => s.detachFile);

  const kind = fileKindOf(file.target);
  const name = getTargetName(file.target);
  const canShowBlock = files !== undefined && kind.Block !== undefined;
  const isMissing = files !== undefined && files.resolveUrl(file.target) === null;

  // 기본 크기는 호스트의 설정이라, 바뀌면 다시 그려야 한다.
  const getDefaultDisplay = useCallback(
    (): FileDisplay => files?.defaultDisplay(kind.id) ?? 'title',
    [files, kind.id]
  );
  const defaultDisplay = useSyncExternalStore(
    files?.subscribeDefaults ?? noSubscription,
    getDefaultDisplay
  );
  const display: FileDisplay =
    canShowBlock && !isMissing ? (file.display ?? defaultDisplay) : 'title';

  const open = (e: React.MouseEvent<HTMLElement>) => {
    if (files) files.open(file.target, file.options);
    // 파일 능력이 없는 호스트에서도 웹 주소는 열 수 있다.
    else if (isWebTarget(file.target)) winOf(e.currentTarget).open(file.target, '_blank', 'noopener');
  };

  const Block = kind.Block;
  const Icon = isMissing ? TriangleAlert : kind.Icon;

  return (
    <div className="group/file flex items-start gap-2 px-1.5 pb-1" data-row-control>
      <button
        type="button"
        onClick={open}
        onMouseOver={(e) => files?.hoverPreview?.(e.nativeEvent, e.currentTarget, file.target)}
        title={isMissing ? `파일을 찾을 수 없습니다: ${file.target}` : file.target}
        className="min-w-0 max-w-full text-left cursor-pointer"
      >
        {display !== 'title' && Block && files ? (
          <Block file={file} size={display} name={name} files={files} />
        ) : (
          <span
            className={`inline-flex max-w-full items-center gap-1.5 px-1.5 py-0.5 rounded text-xs border border-(--background-modifier-border) bg-(--background-secondary) hover:border-(--background-modifier-border-hover) ${
              isMissing ? 'text-(--text-faint) line-through' : 'text-(--text-muted) hover:text-(--text-normal)'
            }`}
          >
            <Icon className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{name}</span>
          </span>
        )}
      </button>

      {/* 마우스를 올리면 나오는 설정: 보이는 크기 고르기, 떼기 */}
      <div className="shrink-0 flex items-center gap-0.5 opacity-0 group-hover/file:opacity-100 focus-within:opacity-100 transition-opacity select-none">
        {canShowBlock &&
          !isMissing &&
          DISPLAY_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={display === option.value}
              onClick={() => updateFile(nodeId, { display: option.value })}
              className={`px-1.5 py-0.5 rounded text-[10px] transition-colors cursor-pointer ${
                display === option.value
                  ? 'bg-(--interactive-accent)/20 text-(--text-accent)'
                  : 'text-(--text-faint) hover:bg-(--background-modifier-hover) hover:text-(--text-normal)'
              }`}
            >
              {option.label}
            </button>
          ))}
        <button
          type="button"
          onClick={() => detachFile(nodeId)}
          title="파일 떼기 (파일 자체는 지우지 않습니다)"
          className="p-0.5 rounded text-(--text-faint) hover:bg-(--background-modifier-hover) hover:text-(--text-normal) transition-colors cursor-pointer"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
