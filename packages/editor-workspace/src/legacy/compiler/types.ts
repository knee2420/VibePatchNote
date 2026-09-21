/** 컴파일 대상 문서 섹션/청크 정보 */
export interface CompilerSection {
  id: string;
  title: string;
  depth?: number;
  selected: boolean;
  contentLength?: number;
}

/** 컴파일 서식 및 출력 옵션 */
export interface CompilerOptions {
  includeTitle: boolean;
  numberingStyle: 'none' | 'decimal' | 'roman';
  pageBreaksBetweenSections: boolean;
  format: 'markdown' | 'html' | 'text';
}

/** 컴파일러 인터페이스 Props */
export interface DocumentCompilerProps {
  sections: CompilerSection[];
  onToggleSection: (id: string, selected: boolean) => void;
  onToggleAll: (selected: boolean) => void;
  onCompile: (options: CompilerOptions, selectedIds: string[]) => void;
  onClose?: () => void;
  isCompiling?: boolean;
  className?: string;
}
