import type { ReactNode } from 'react';
import { BrowserRouter } from 'react-router-dom';

/** 앱 전역 Provider 조립 지점. (라우터, 추후 Query/Theme Provider 등) */
export function AppProviders({ children }: { children: ReactNode }) {
  return <BrowserRouter>{children}</BrowserRouter>;
}
