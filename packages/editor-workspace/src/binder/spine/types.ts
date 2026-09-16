import type { ReactNode } from 'react';

/** 척추/관점 옵션 정의 */
export interface SpineOption<TMode extends string = string> {
  id: TMode;
  label: string;
  icon?: ReactNode;
  badge?: number | string;
  description?: string;
}

/** 척추 스위처 컴포넌트 Props */
export interface SpineSwitcherProps<TMode extends string = string> {
  options: SpineOption<TMode>[];
  activeSpine: TMode;
  onChangeSpine: (spine: TMode) => void;
  /** 전체 문서 또는 현재 척추의 근거 소화율 (0~100) */
  coverage?: number;
  className?: string;
  size?: 'sm' | 'md';
}
