/**
 * @fileoverview 렌더 예외 격리.
 *
 * 관측 도구는 **깨진 데이터를 보여주는 것이 일**이다. 레코드 하나가 예상과
 * 달라서 화면 전체가 백화면이 되면, 정작 그 레코드를 조사할 방법이 사라진다.
 *
 * 실제로 Attempts 탭이 계약에 없는 필드(`att.duration_ms`)를 읽어 TypeError 를
 * 냈고, 경계가 없어 앱 전체가 죽었다.
 */

import React from 'react'
import { AlertTriangle, RotateCcw } from 'lucide-react'

interface ErrorBoundaryProps {
  readonly children: React.ReactNode
  /** 어느 영역에서 터졌는지 사람이 알아볼 이름 */
  readonly label?: string
}

interface ErrorBoundaryState {
  readonly error: Error | null
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    // 콘솔에는 남긴다. 관측 도구가 자기 실패를 삼키면 안 된다.
    console.error(`[Inspector] ${this.props.label ?? '렌더'} 실패:`, error, info.componentStack)
  }

  private readonly handleReset = (): void => {
    this.setState({ error: null })
  }

  render(): React.ReactNode {
    const { error } = this.state
    if (!error) return this.props.children

    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 p-8 text-center bg-[#0d1117]">
        <div className="w-10 h-10 rounded-full bg-[rgba(248,81,73,0.15)] border border-[rgba(248,81,73,0.3)] flex items-center justify-center">
          <AlertTriangle className="w-5 h-5 text-[#f85149]" />
        </div>
        <div className="space-y-1">
          <div className="text-sm font-semibold text-[#e6edf3]">
            {this.props.label ?? '이 영역'}을 그리지 못했습니다
          </div>
          <div className="text-[11px] text-[#848d97] max-w-md">
            레코드가 예상한 모양이 아닙니다. 다른 영역은 계속 쓸 수 있습니다.
          </div>
        </div>
        <pre className="max-w-lg overflow-x-auto text-left text-[11px] font-mono text-[#f85149] bg-[#161b22] border border-[#30363d] rounded-md p-3">
          {error.message}
        </pre>
        <button
          type="button"
          onClick={this.handleReset}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] border border-[#30363d] transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          다시 시도
        </button>
      </div>
    )
  }
}
