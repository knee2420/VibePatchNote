/**
 * @file index.ts
 * @description @vibe/outliner/editor Public API — 스캐폴드 하나를 편집하는 화면 (호스트 비의존)
 *
 * 독립 앱과 옵시디언 플러그인이 같은 편집 화면을 쓴다. 호스트는 세 가지를 넘긴다.
 * - 스캐폴드의 지금 내용 (rootNodes, defaultView)
 * - 편집 상태 스토어 (createOutlineEditorStore 로 만든다. 불릿 트리는 호스트의 문서 창구로 읽고 쓴다)
 * - 호스트 창구 (확인 창·주소 복사·글자 내보내기처럼 환경마다 방법이 다른 일)
 */

export {
  type EditorViewState,
  type OutlineDocumentPort,
  type OutlineEditorState,
  type OutlineEditorStore,
  type HistorySnapshot,
  createOutlineEditorStore,
} from './session/editorStore';
export type {
  DroppedItem,
  OutlineFileHost,
  OutlineHost,
  OutlineHostMenuItem,
} from './session/host';
export { OutlineEditorProvider } from './session/context';

export { OutlineTree } from './ui/OutlineTree';
export { OutlineBreadcrumb } from './ui/OutlineBreadcrumb';
export { OutlineBoard } from './ui/OutlineBoard';
export { OutlineHeader, type OutlineHeaderProps } from './ui/OutlineHeader';
export { useZoom } from './model/useZoom';
export { useOutlineView } from './model/useOutlineView';
export { useOutlineClipboard, OUTLINE_CLIPBOARD_MIME } from './model/useOutlineClipboard';
export { FILE_KINDS } from './attachments/registry';


