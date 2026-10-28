import { useNavigate } from 'react-router-dom';

import { Button } from '@/shared/ui';

export function DashboardHero() {
  const navigate = useNavigate();

  return (
    <div className="text-center space-y-3">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-sm font-medium">
        <span>✨</span> Ready for Development
      </div>
      <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
        VibePatchNote Project
      </h1>
      <p className="text-slate-400 text-lg max-w-2xl mx-auto">
        React + TypeScript + Vite + ShadCN UI + FastAPI 개발 환경이 구성되었습니다.
      </p>
      <div className="pt-4">
        <Button
          onClick={() => navigate('/editor')}
          className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-6 rounded-full shadow-lg shadow-blue-900/50"
        >
          🚀 하이브리드 에디터 보드 열기
        </Button>
      </div>
    </div>
  );
}
