import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertCircle } from 'lucide-react';

import { DocumentEditorWorkspace } from '@/widgets/document-editor-workspace';

/**
 * DocumentEditorPage (FSD Page Layer)
 *
 * 상세 편집 워크스페이스를 독립된 전체 화면 페이지로 호스팅합니다.
 * 라우트 파라미터(:scaffoldId)로부터 문서를 식별하고 위젯을 조합합니다.
 */
export function DocumentEditorPage() {
  const { scaffoldId } = useParams<{ scaffoldId: string }>();
  const navigate = useNavigate();

  if (!scaffoldId) {
    return (
      <div className="w-full h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-300 gap-4 p-6">
        <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div className="text-center">
          <h2 className="text-lg font-bold text-white mb-1">문서 ID가 누락되었습니다</h2>
          <p className="text-xs text-slate-400">
            편집할 스캐폴드 문서의 식별자가 URL 경로에 포함되어 있지 않습니다.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/editor')}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold cursor-pointer transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>에디터 캔버스 보드로 이동</span>
        </button>
      </div>
    );
  }

  return (
    <DocumentEditorWorkspace
      scaffoldId={scaffoldId}
      onBack={() => navigate('/editor')}
    />
  );
}
