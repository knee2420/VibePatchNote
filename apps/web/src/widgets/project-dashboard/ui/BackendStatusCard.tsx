import { useApiHealth } from '@/features/api-health';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/shared/ui';
import { env } from '@/shared/config';

export function BackendStatusCard() {
  const { health, isLoading, error, isConnected, check } = useApiHealth();

  return (
    <Card className="bg-slate-900/80 border-slate-800 backdrop-blur text-slate-100 shadow-xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <span className="text-emerald-400">🐍</span> Backend Stack
          </CardTitle>
          <Badge
            variant="outline"
            className={
              isConnected
                ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10'
                : 'border-amber-500/30 text-amber-400 bg-amber-500/10'
            }
          >
            {isConnected ? 'Connected' : 'Disconnected'}
          </Badge>
        </div>
        <CardDescription className="text-slate-400">
          FastAPI + Python 3.12 + Uvicorn + Pydantic
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3 text-sm text-slate-300">
        <div className="p-3 rounded-lg bg-slate-800/50 space-y-1">
          <div className="text-xs text-slate-400">FastAPI 서버 상태 ({env.apiBaseUrl})</div>
          {isLoading ? (
            <div className="text-slate-400 animate-pulse">연결 확인 중...</div>
          ) : health ? (
            <div className="text-emerald-400 font-medium flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-ping" />
              상태: {health.status} ({health.service})
            </div>
          ) : (
            <div className="text-amber-400 text-xs">
              {error ? `연결 대기: ${error}` : 'FastAPI 서버를 실행하면 연결됩니다.'}
            </div>
          )}
        </div>

        <div className="text-xs text-slate-400 p-2.5 rounded bg-slate-950/40 border border-slate-800/60 font-mono">
          backend 실행 명령:
          <br />
          <span className="text-purple-300">pnpm --filter @vibe/api dev</span>
        </div>
      </CardContent>

      <CardFooter className="pt-2">
        <Button
          onClick={check}
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium shadow-md shadow-purple-900/30 transition-all"
        >
          {isLoading ? '확인 중...' : '백엔드 연결 재시도'}
        </Button>
      </CardFooter>
    </Card>
  );
}
