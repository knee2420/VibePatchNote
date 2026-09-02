import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"

interface HealthStatus {
  status: string
  service: string
}

export function DashboardPage() {
  const [health, setHealth] = useState<HealthStatus | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [testInput, setTestInput] = useState<string>("")
  const [apiError, setApiError] = useState<string | null>(null)
  const navigate = useNavigate()

  const checkBackendHealth = async () => {
    setLoading(true)
    setApiError(null)
    try {
      const response = await fetch("http://localhost:8000/api/health")
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      setHealth(data)
    } catch (err: unknown) {
      if (err instanceof Error) {
        setApiError(err.message)
      } else {
        setApiError("Backend connection failed")
      }
      setHealth(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkBackendHealth()
  }, [])

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 antialiased selection:bg-purple-500 selection:text-white">
      <div className="max-w-4xl w-full space-y-8">
        {/* Header */}
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
            <Button onClick={() => navigate("/editor")} className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-6 rounded-full shadow-lg shadow-blue-900/50">
              🚀 하이브리드 에디터 보드 열기
            </Button>
          </div>
        </div>

        {/* Tech Stack Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Frontend Card */}
          <Card className="bg-slate-900/80 border-slate-800 backdrop-blur text-slate-100 shadow-xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  <span className="text-sky-400">⚡</span> Frontend Stack
                </CardTitle>
                <Badge variant="outline" className="border-sky-500/30 text-sky-400 bg-sky-500/10">
                  Client
                </Badge>
              </div>
              <CardDescription className="text-slate-400">
                Vite 기반 React 19 + TypeScript + ShadCN UI
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-300">
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-800/50">
                <span>Vite + React TS</span>
                <Badge className="bg-sky-600 hover:bg-sky-500">v6 / v19</Badge>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-800/50">
                <span>Tailwind CSS</span>
                <Badge className="bg-teal-600 hover:bg-teal-500">v4</Badge>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-800/50">
                <span>ShadCN UI</span>
                <Badge className="bg-purple-600 hover:bg-purple-500">Configured</Badge>
              </div>
            </CardContent>
            <CardFooter className="pt-2">
              <div className="w-full space-y-3">
                <div className="flex gap-2">
                  <Input
                    placeholder="컴포넌트 테스트 입력..."
                    value={testInput}
                    onChange={(e) => setTestInput(e.target.value)}
                    className="bg-slate-950/60 border-slate-700 text-slate-100 focus-visible:ring-purple-500"
                  />
                  <Button
                    variant="secondary"
                    onClick={() => alert(`입력값: ${testInput || '(없음)'}`)}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
                  >
                    확인
                  </Button>
                </div>
              </div>
            </CardFooter>
          </Card>

          {/* Backend Card */}
          <Card className="bg-slate-900/80 border-slate-800 backdrop-blur text-slate-100 shadow-xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  <span className="text-emerald-400">🐍</span> Backend Stack
                </CardTitle>
                <Badge
                  variant="outline"
                  className={
                    health
                      ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10"
                      : "border-amber-500/30 text-amber-400 bg-amber-500/10"
                  }
                >
                  {health ? "Connected" : "Disconnected"}
                </Badge>
              </div>
              <CardDescription className="text-slate-400">
                FastAPI + Python 3.12 + Uvicorn + Pydantic
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-300">
              <div className="p-3 rounded-lg bg-slate-800/50 space-y-1">
                <div className="text-xs text-slate-400">FastAPI 서버 상태 (localhost:8000)</div>
                {loading ? (
                  <div className="text-slate-400 animate-pulse">연결 확인 중...</div>
                ) : health ? (
                  <div className="text-emerald-400 font-medium flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-ping"></span>
                    상태: {health.status} ({health.service})
                  </div>
                ) : (
                  <div className="text-amber-400 text-xs">
                    {apiError ? `연결 대기: ${apiError}` : "FastAPI 서버를 실행하면 연결됩니다."}
                  </div>
                )}
              </div>
              <div className="text-xs text-slate-400 p-2.5 rounded bg-slate-950/40 border border-slate-800/60 font-mono">
                backend 실행 명령:
                <br />
                <span className="text-purple-300">cd backend && .\venv\Scripts\uvicorn main:app --reload</span>
              </div>
            </CardContent>
            <CardFooter className="pt-2">
              <Button
                onClick={checkBackendHealth}
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium shadow-md shadow-purple-900/30 transition-all"
              >
                {loading ? "확인 중..." : "백엔드 연결 재시도"}
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Quick Guide */}
        <Card className="bg-slate-900/50 border-slate-800 text-slate-300">
          <CardContent className="pt-6 space-y-2 text-sm">
            <h3 className="font-semibold text-slate-200 flex items-center gap-2">
              <span>🚀</span> 프로젝트 시작 방법
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 font-mono text-xs">
              <div className="p-3 rounded bg-slate-950/60 border border-slate-800">
                <p className="text-slate-400 mb-1 font-sans font-medium text-sky-400">1. Frontend 개발 서버:</p>
                <code>cd frontend</code>
                <br />
                <code>npm run dev</code>
              </div>
              <div className="p-3 rounded bg-slate-950/60 border border-slate-800">
                <p className="text-slate-400 mb-1 font-sans font-medium text-emerald-400">2. Backend 서버:</p>
                <code>cd backend</code>
                <br />
                <code>.\venv\Scripts\uvicorn main:app --reload</code>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
