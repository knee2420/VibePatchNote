import { useNavigate, useSearchParams } from 'react-router-dom';
import { EditorLabWorkspace } from '@/widgets/editor-lab-workspace';

const DEFAULT_SCAFFOLD_ID = 'scaffold-1a0a0008250-fabfd713';

/**
 * EditorLabPage (FSD Page Layer)
 *
 * 본 프로젝트의 DocumentEditorPage 정본 구조를 계승하여,
 * 페이지 레이어에서는 라우팅 제어 및 최상위 위젯(EditorLabWorkspace)만을 호스팅합니다.
 * URL SearchParams(?scaffoldId=...)를 통해 실제 백엔드 와이어프레임 데이터와 연동합니다.
 */
export function EditorLabPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const scaffoldId = searchParams.get('scaffoldId') || DEFAULT_SCAFFOLD_ID;

  return (
    <div className="w-full h-screen bg-slate-950 text-slate-100 overflow-hidden antialiased selection:bg-indigo-500 selection:text-white">
      <EditorLabWorkspace scaffoldId={scaffoldId} onBack={() => navigate('/')} />
    </div>
  );
}
