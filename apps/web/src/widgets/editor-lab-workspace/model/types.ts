/** Activity Bar 활성 탭 */
export type ActivityBarTab =
  | 'explorer'
  | 'resources'
  | 'search'
  | 'sourceControl'
  | 'runDebug'
  | 'recipes'
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
  | { type: 'file'; fileId: string }
  | { type: 'resource'; resourceId: string; path: string; name: string };

/** 와이어프레임 4가지 페이지 뷰 모드 */
export type WireframeViewMode =
  | 'vertical' // 세로 연속 뷰 (기본값)
  | 'horizontal' // 가로 페이징 뷰 (1P/2P 스프레드)
  | 'pure-editor' // 순수 Tiptap 에디터 모드
  | 'grid'; // 그리드 조망 모드 (3~4열 바둑판)

/** 리소스 매니저 뷰 모드 (동일한 데이터를 서로 다른 관점으로 투영) */
export type ResourceViewMode = 'directories' | 'categories' | 'recent' | 'list';

/** 하위 호환을 위한 리소스 매니저 활성 탭 */
export type ResourceManagerTab = 'pipelines' | 'assets' | 'schemas' | 'linked' | ResourceViewMode;

/** 디렉토리 묶음 (Directory Bundle) 모델 */
export interface DirectoryBundle {
  id: string;
  name: string; // e.g. "업무 자동화 샘플", "96.data_pipeline", "에셋 라이브러리"
  path: string;
  sourceType: 'local' | 'pipeline' | 'builtin';
  isCollapsed?: boolean;
  items: ResourceItem[];
}

/** 리소스 아이템 모델 */
export interface ResourceItem {
  id: string;
  name: string;
  category: 'pipelines' | 'assets' | 'schemas' | 'linked';
  pipelineSource: string; // e.g. '96.data_pipeline', 'pdf_ingestion', 'telemetry_archive', 'scaffold_store', 'local_folder'
  format: string; // 'json', 'md', 'html', 'png', 'svg', 'ts', 'hwp', 'pdf'
  size: string;
  updatedAt: string;
  description?: string;
  path: string;
  content?: string;
  slotsCount?: number;
  isLocal?: boolean;
  bundleId?: string;
  bundleName?: string;
  thumbnailUrl?: string;
  docId?: string;
}

/** 슬롯 소켓 바인딩 상태 */
export type SlotBindingStatus = 'unbound' | 'suggested' | 'bound';

/** 슬롯 소켓 바인딩 정보 모델 */
export interface SlotBindingInfo {
  slotId: string;
  slotNumber: number;
  label: string;
  pageNumber: number;
  status: SlotBindingStatus;
  currentValue: string; // 현재 실제 슬롯 내용
  suggestedValue: string; // 레퍼런스/AI 추천 데이터
  confidence?: string; // e.g. "98%"
  resourceName?: string; // 출처 리소스명 (e.g. "사전 계획서.pdf", "회의록_초안.md")
  resourceId?: string;
  resourcePath?: string;
  sourceLocation?: string; // 출처 세부 위치 (e.g. "2p 17L", "1p 12L", "영수증 전문")
  highlightText?: string; // 원본 리소스 뷰어에서 하이라이트할 원문 텍스트
}

/** 리소스 원본 출처(Provenance) 검증 뷰어 모델 */
export interface ResourceProvenanceInfo {
  slotId: string;
  slotNumber?: number;
  slotLabel: string;
  value: string;
  sourceName: string;
  sourceLocation: string; // e.g. "2p 17L"
  confidence?: string; // e.g. "98%"
  highlightText?: string;
}


