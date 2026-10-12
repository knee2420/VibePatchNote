/**
 * @file FileStorageNotice.tsx
 * @description 파일 입출력 실패를 화면에 알리는 비차단 알림 바
 */

import React from 'react';
import { AlertCircle, X } from 'lucide-react';
import type { FileIOFailure } from '../lib/outlineFile';

interface FileStorageNoticeProps {
  failure: FileIOFailure | null;
  onDismiss: () => void;
}

function describeFailure(failure: FileIOFailure): string {
  switch (failure.kind) {
    case 'parse-error':
      return 'JSON 파싱에 실패했습니다.';
    case 'invalid-format':
      return '올바른 아웃라인 JSON 문서 형식이 아닙니다.';
    case 'unsupported-version':
      return `지원하지 않는 문서 버전입니다 (${failure.version}).`;
    case 'open-failed':
      return '보관함 또는 파일을 열지 못했습니다.';
    case 'vault-unsupported':
      return '이 브라우저는 폴더 접근을 지원하지 않습니다. Chrome 또는 Edge에서 열어주세요.';
    case 'permission-denied':
      return '보관함 폴더 접근이 허용되지 않았습니다.';
    case 'nothing-to-import':
      return '가져올 새 프로젝트가 없습니다. (이미 모두 들어 있습니다)';
  }
}

export const FileStorageNotice: React.FC<FileStorageNoticeProps> = ({ failure, onDismiss }) => {
  if (!failure) return null;

  return (
    <div
      role="alert"
      className="flex items-center justify-between gap-3 px-6 py-2 text-xs font-medium text-rose-200 bg-rose-950/60 border-b border-rose-800/40"
    >
      <span className="flex items-center gap-1.5 min-w-0">
        <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
        <span className="truncate">{describeFailure(failure)}</span>
      </span>
      <button
        type="button"
        onClick={onDismiss}
        className="p-1 rounded text-rose-300 hover:text-white hover:bg-rose-900/60 transition-colors cursor-pointer shrink-0"
        title="알림 닫기"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
