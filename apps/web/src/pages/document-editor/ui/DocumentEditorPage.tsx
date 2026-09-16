import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertCircle } from 'lucide-react';

import { DocumentEditorWorkspace } from '@/widgets/document-editor-workspace';
import {
  Button,
  Badge,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/shared/ui';

/**
 * DocumentEditorPage (FSD Page Layer)
 *
 * 상세 편집 워크스페이스를 독립된 전체 화면 페이지로 호스팅합니다.
 * Origin UI 디자인 시스템과 기존 대시보드(DashboardPage)의 톤앤매너를 계승하여
 * 시맨틱 토큰, 카드 기반 에러/빈 상태 폴백, 통일된 타이포그래피와 셀렉션 스타일을 적용합니다.
 */
export function DocumentEditorPage() {
  const { scaffoldId } = useParams<{ scaffoldId: string }>();
  const navigate = useNavigate();

  if (!scaffoldId) {
    return (
      <div className="min-h-screen w-full bg-slate-50 text-slate-800 flex flex-col items-center justify-center p-6 antialiased selection:bg-indigo-500 selection:text-white">
        <Card className="max-w-md w-full bg-white border-slate-200/80 shadow-md text-slate-800">
          <CardHeader>
            <div className="size-10 rounded-xl border border-amber-200 bg-amber-50 flex items-center justify-center text-amber-600 shadow-2xs mb-2">
              <AlertCircle className="size-5" />
            </div>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                문서 ID 누락
              </CardTitle>
              <Badge variant="outline" className="border-amber-200 text-amber-700 bg-amber-50 font-medium">
                경고
              </Badge>
            </div>
            <CardDescription className="text-slate-500 text-xs mt-1 leading-relaxed">
              편집할 스캐폴드 문서의 식별자가 URL 경로에 포함되어 있지 않습니다.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 leading-relaxed">
              에디터 캔버스 보드에서 편집할 문서를 선택하거나 새로운 스캐폴드 문서를 생성해 주십시오.
            </div>
          </CardContent>

          <CardFooter className="pt-2">
            <Button
              variant="default"
              size="default"
              onClick={() => navigate('/editor')}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-xs gap-2 rounded-xl"
            >
              <ArrowLeft className="size-4" />
              <span>에디터 캔버스 보드로 이동</span>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full h-screen bg-slate-50 text-slate-900 overflow-hidden antialiased selection:bg-indigo-500 selection:text-white">
      <DocumentEditorWorkspace
        scaffoldId={scaffoldId}
        onBack={() => navigate('/editor')}
      />
    </div>
  );
}

