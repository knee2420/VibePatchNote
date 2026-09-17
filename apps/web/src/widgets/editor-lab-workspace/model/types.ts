/** Activity Bar 활성 탭 */
export type ActivityBarTab =
  | 'explorer'
  | 'search'
  | 'sourceControl'
  | 'runDebug'
  | 'extensions'
  | 'antigravity';

/** 하단 패널 활성 탭 */
export type BottomPanelTab =
  | 'problems'
  | 'output'
  | 'debugConsole'
  | 'terminal'
  | 'ports';

/** 열린 에디터 탭 모델 */
export interface EditorTabItem {
  id: string;
  name: string;
  path: string;
  content: string;
  language: string;
  isModified?: boolean;
  type?: 'code' | 'wireframe';
  scaffoldId?: string;
  pageNumber?: number;
}

/** 파일 시스템 노드 모델 */
export interface FileTreeNode {
  id: string;
  name: string;
  path: string;
  isFolder: boolean;
  isOpen?: boolean;
  children?: FileTreeNode[];
  content?: string;
  language?: string;
  type?: 'code' | 'wireframe';
  scaffoldId?: string;
  pageNumber?: number;
  gitStatus?: 'M' | 'U' | 'A' | 'D';
}

/** 터미널 세션 모델 */
export interface TerminalSessionItem {
  id: string;
  name: string;
  history: string[];
}

/** AI 대화 메시지 모델 */
export interface ChatMessageItem {
  id: string;
  sender: 'user' | 'agent';
  timestamp: string;
  content: string;
  filesChanged?: {
    count: number;
    additions: number;
    deletions: number;
  };
}

/** 드래그 앤 드롭 전송 페이로드 */
export type DragPayload =
  | { type: 'tab'; tabId: string; sourcePane: 'pane1' | 'pane2' }
  | { type: 'file'; fileId: string };
