import { Route, Routes } from 'react-router-dom';

import { DashboardPage } from '@/pages/dashboard';
import { EditorPage } from '@/pages/editor';
import { DocumentEditorPage } from '@/pages/document-editor';
import { EditorLabPage } from '@/pages/editor-lab';

/** 앱 라우팅 테이블. 페이지 조합 외의 로직은 두지 않습니다. */
export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<DashboardPage />} />
      <Route path="/board" element={<EditorPage />} />
      <Route path="/editor" element={<EditorPage />} />
      <Route path="/editor/:scaffoldId" element={<DocumentEditorPage />} />
      <Route path="/document/:scaffoldId" element={<DocumentEditorPage />} />
      <Route path="/lab/editor" element={<EditorLabPage />} />
    </Routes>
  );
}
