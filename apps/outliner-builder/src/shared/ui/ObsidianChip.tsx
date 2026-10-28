/**
 * @file ObsidianChip.tsx
 * @description What-s-in-my-head 옵시디언 볼트 스니펫 연동 공통 칩 컴포넌트
 * - author-chips.css 및 status-chips.css 와 100% 클래스/데이터 속성 연동
 */

import React from 'react';

export interface AuthorChipProps {
  name: string;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
}

/** 담당자 · 작성자 · AI · 이슈 알약 칩 (author-chips.css 완벽 연동) */
export const AuthorChip: React.FC<AuthorChipProps> = ({
  name,
  className = '',
  onClick,
}) => (
  <span
    className={`internal-link cursor-pointer select-none ${className}`}
    data-href={name}
    onClick={onClick}
    title={`작성자/담당: ${name}`}
  >
    {name}
  </span>
);

export interface StatusChipProps {
  status: string;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
}

/** 진행 순서 및 상태 알약 칩 (status-chips.css 완벽 연동) */
export const StatusChip: React.FC<StatusChipProps> = ({
  status,
  className = '',
  onClick,
}) => (
  <span data-chip-value={status} className="inline-flex items-center">
    <span
      className={`claude-chip select-none ${className}`}
      onClick={onClick}
      title={`상태: ${status}`}
    >
      {status}
    </span>
  </span>
);

export interface DateChipProps {
  when?: '지남' | '오늘' | '곧' | '나중';
  label?: string;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
}

/** 마감 · 일정 알약 칩 (status-chips.css 완벽 연동) */
export const DateChip: React.FC<DateChipProps> = ({
  when = '곧',
  label = '일정',
  className = '',
  onClick,
}) => (
  <span
    className={`date-chip select-none cursor-pointer ${className}`}
    data-when={when}
    onClick={onClick}
    title={`기한: ${label}`}
  >
    <span>📅</span>
    <span>{label}</span>
  </span>
);
