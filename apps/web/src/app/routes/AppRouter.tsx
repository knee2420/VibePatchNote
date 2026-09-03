import { Route, Routes } from 'react-router-dom';

import { DashboardPage } from '@/pages/dashboard';
import { EditorPage } from '@/pages/editor';

/** 앱 라우팅 테이블. 페이지 조합 외의 로직은 두지 않습니다. */
export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<DashboardPage />} />
      <Route path="/editor" element={<EditorPage />} />
    </Routes>
  );
}
