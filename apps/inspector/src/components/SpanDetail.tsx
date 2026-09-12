/**
 * @fileoverview Inspector SpanDetail 컴포넌트
 * 파이프라인 개별 스팬의 I/O, LLM 송출 설정, 시도 이력 및 스냅샷을 렌더링합니다.
 * Google TypeScript Style Guide 규칙(엄격한 타입, readonly 불변성, JSDoc)을 준수합니다.
 */

import React, { useMemo, useState } from 'react'
import {
  AlertCircle,
  ArrowRightLeft,
  Braces,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Code2,
  Copy,
  Cpu,
  FileCode,
  FileText,
  Info,
  Layers,
  Maximize2,
  Paperclip,
  Settings,
  ShieldAlert,
  Sparkles,
  Terminal,
  X,
  Zap,
} from 'lucide-react'
import CodeMirror from '@uiw/react-codemirror'
import { json } from '@codemirror/lang-json'
import { markdown } from '@codemirror/lang-markdown'
import { oneDark } from '@codemirror/theme-one-dark'

import type { SpanRecord } from '../types'

interface SpanDetailProps {
  readonly span: SpanRecord | null
  readonly snapshots: Record<string, unknown>
}

type TabType = 'io' | 'attempts' | 'snapshots' | 'raw'

interface ModalViewerState {
  readonly isOpen: boolean
  readonly title: string
  readonly content: string
  readonly language: 'markdown' | 'json' | 'text'
  readonly charCount: number
}

/**
 * 긴 텍스트, 프롬프트, JSON 등 대용량 페이로드를
 * DOM 가상화(Virtualization) 스크롤로 100% 렉 없이 쾌적하게 렌더링하는 전용 카드 컴포넌트
 */
interface VirtualCodeCardProps {
  readonly title: string
  readonly data: unknown
  readonly defaultHeight?: string
  readonly badgeLabel?: string
  readonly onOpenModal: (
    title: string,
    content: string,
    language: 'markdown' | 'json' | 'text',
    charCount: number
  ) => void
}

const VirtualCodeCard: React.FC<VirtualCodeCardProps> = ({
  title,
  data,
  defaultHeight = '240px',
  badgeLabel,
  onOpenModal,
}) => {
  const [copied, setCopied] = useState(false)

  const { textValue, language, charCount } = useMemo(() => {
    if (data === null || data === undefined) {
      return { textValue: '', language: 'text' as const, charCount: 0 }
    }

    if (typeof data === 'string') {
      const trimmed = data.trim()
      // JSON 문자열인지 판별
      if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
        try {
          const parsed = JSON.parse(trimmed)
          const formatted = JSON.stringify(parsed, null, 2)
          return { textValue: formatted, language: 'json' as const, charCount: formatted.length }
        } catch {
          // 마크다운 또는 일반 텍스트
        }
      }
      const isMd = trimmed.startsWith('#') || trimmed.includes('##') || trimmed.includes('```') || trimmed.includes('- ')
      return {
        textValue: data,
        language: (isMd ? 'markdown' : 'text') as 'markdown' | 'text',
        charCount: data.length,
      }
    }

    // 객체나 배열인 경우 보기 좋게 들여쓰기된 JSON으로 직렬화
    try {
      const formatted = JSON.stringify(data, null, 2)
      return { textValue: formatted, language: 'json' as const, charCount: formatted.length }
    } catch {
      const fallback = String(data)
      return { textValue: fallback, language: 'text' as const, charCount: fallback.length }
    }
  }, [data])

  const extensions = useMemo(() => {
    if (language === 'json') return [json()]
    if (language === 'markdown') return [markdown()]
    return []
  }, [language])

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(textValue)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="rounded-lg border border-slate-800/90 bg-[#080d1a] shadow-lg overflow-hidden flex flex-col transition-all hover:border-slate-700/80">
      {/* 카드 상단 툴바 헤더 */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#0d152a] border-b border-slate-800 text-[11px] font-mono">
        <div className="flex items-center gap-2 min-w-0">
          {title.toLowerCase().includes('command') ? (
            <Terminal className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          ) : language === 'json' ? (
            <Code2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          ) : language === 'markdown' ? (
            <FileText className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          ) : (
            <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          )}

          <span className="font-semibold text-slate-200 truncate">{title}</span>

          {badgeLabel && (
            <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-950/80 border border-cyan-800/50 text-cyan-300 font-sans">
              {badgeLabel}
            </span>
          )}

          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-sans">
            {language.toUpperCase()}
          </span>

          <span className="text-[10px] text-slate-500 font-sans hidden sm:inline">
            {charCount.toLocaleString()} 자
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-slate-100 transition-colors cursor-pointer border border-slate-700/60"
            title="클립보드에 복사"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-400">복사됨</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3 text-slate-400" />
                <span>복사</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => onOpenModal(title, textValue, language, charCount)}
            className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-cyan-950/70 hover:bg-cyan-900/80 text-cyan-300 hover:text-cyan-100 transition-colors cursor-pointer border border-cyan-800/60"
            title="전체화면으로 전문 크게 보기 (검색/가상스크롤 지원)"
          >
            <Maximize2 className="w-3 h-3 text-cyan-400" />
            <span>전체화면</span>
          </button>
        </div>
      </div>

      {/* CodeMirror 가상화 뷰어 본문 (수만 자도 초고속 렌더링) */}
      <div className="text-xs">
        <CodeMirror
          value={textValue}
          height={defaultHeight}
          theme={oneDark}
          extensions={extensions}
          editable={false}
          readOnly={true}
          basicSetup={{
            lineNumbers: true,
            foldGutter: true,
            highlightActiveLineGutter: false,
            highlightActiveLine: false,
            searchKeymap: true,
          }}
          className="codemirror-viewer"
        />
      </div>
    </div>
  )
}

/**
 * 단순 키-값 형태의 짧은 메타데이터를 깔끔하게 정돈하는 그리드 컴포넌트
 */
function formatPropertyValue(value: any): { display: string; full: string } {
  if (value === null || value === undefined) return { display: '-', full: '-' }
  if (typeof value === 'boolean') {
    const s = value ? 'true' : 'false'
    return { display: s, full: s }
  }
  const str = String(value)
  const lower = str.toLowerCase()
  const isDocFile =
    lower.endsWith('.pdf') ||
    lower.endsWith('.docx') ||
    lower.endsWith('.doc') ||
    lower.endsWith('.xlsx') ||
    lower.endsWith('.xls') ||
    lower.endsWith('.hwp') ||
    lower.endsWith('.hwpx') ||
    lower.endsWith('.txt')

  // 경로가 포함된 파일인 경우 파일명만 축약 표시
  if (isDocFile && (str.includes('/') || str.includes('\\'))) {
    const base = str.split(/[/\\]/).pop() || str
    return { display: base, full: str }
  }

  return { display: str, full: str }
}

function getBadgeLabel(key: string): string {
  const lower = key.toLowerCase()
  if (lower.includes('command')) return 'CLI / API COMMAND'
  if (lower.includes('instruction')) return 'INSTRUCTIONS'
  if (lower.includes('dynamic_context') || lower.includes('context_text')) return 'DOC CONTEXT'
  if (lower.includes('prompt')) return 'PROMPT'
  if (lower.includes('raw_response')) return 'RAW RESPONSE'
  if (lower.includes('structured') || lower.includes('tree') || lower.includes('schema')) return 'STRUCTURED JSON'
  if (lower.includes('trace')) return 'TRACEBACK'
  return 'PAYLOAD'
}

const SimplePropertiesGrid: React.FC<{ properties: Record<string, any> }> = ({ properties }) => {
  const entries = Object.entries(properties)
  if (entries.length === 0) return null

  return (
    <div className="grid grid-cols-2 gap-2 p-2.5 rounded-lg bg-[#080d19]/90 border border-slate-800/80 shadow-sm">
      {entries.map(([key, value]) => {
        const { display, full } = formatPropertyValue(value)
        return (
          <div key={key} className="flex flex-col gap-0.5 min-w-0">
            <span className="text-[10px] text-slate-500 font-sans truncate" title={key}>
              {key}
            </span>
            <span
              className="font-mono text-xs text-slate-300 font-medium truncate bg-slate-900/70 px-2 py-0.5 rounded border border-slate-800 hover:text-cyan-200 transition-colors"
              title={full}
            >
              {display}
            </span>
          </div>
        )
      })}
    </div>
  )
}

function formatCommand(cmdStr: string): string {
  if (!cmdStr) return ''
  const trimmed = cmdStr.trim()
  if (trimmed.startsWith('curl')) {
    return trimmed
  }
  if (trimmed.startsWith('agy')) {
    if (trimmed.includes('\n')) return trimmed
    return trimmed.replace(/\s+(--[a-zA-Z0-9_-]+)/g, ' \\\n  $1')
  }
  return trimmed
}

interface SpanLlmExtra {
  readonly provider?: string
  readonly effort_flag?: string
  readonly raw_command?: string
  readonly command?: string | readonly string[]
  readonly [key: string]: unknown
}

interface SpanMetadataPayload {
  readonly model_name?: string
  readonly extra?: SpanLlmExtra
  readonly [key: string]: unknown
}

function getSpanMetadata(span: SpanRecord | null): SpanMetadataPayload {
  if (!span?.metadata || typeof span.metadata !== 'object') {
    return {}
  }
  return span.metadata as SpanMetadataPayload
}

interface CliSettingChip {
  readonly key: string
  readonly label: string
  readonly value: string
  readonly fullValue?: string
  readonly color: 'cyan' | 'emerald' | 'amber' | 'purple' | 'rose' | 'slate' | 'indigo' | 'blue'
  readonly icon?: 'model' | 'io' | 'effort' | 'shield' | 'slash' | 'schema' | 'transport' | 'api' | 'file'
  readonly flag?: string
  readonly description: string
}

function parseLlmSettings(command: string, span: SpanRecord): CliSettingChip[] {
  const chips: CliSettingChip[] = []
  const meta = getSpanMetadata(span)
  const isApi =
    command.startsWith('curl') ||
    meta.extra?.provider === 'google_api' ||
    span.inputs?.provider === 'google_api'

  if (isApi) {
    const model =
      span.inputs?.target_model ||
      meta.model_name ||
      span.name.replace(/^llm:/i, '').split(' ')[0] ||
      'gemini-3.8-flash-low'

    chips.push({
      key: 'provider',
      label: 'PROVIDER',
      value: 'Google Gemini Direct API',
      color: 'purple',
      icon: 'api',
      flag: 'Google AI Direct API',
      description: 'CLI 프로그램을 거치지 않고, 구글 공식 AI 클라우드 서버와 직접 인터넷으로 통신하여 처리하는 모드입니다.',
    })
    chips.push({
      key: 'model',
      label: 'MODEL',
      value: model,
      color: 'cyan',
      icon: 'model',
      flag: `models/${model}`,
      description: '실제 원고를 분석하고 기획을 작성하는 AI 두뇌 모델입니다. (초고속 저지연 Flash 엔진 작동 중)',
    })
    chips.push({
      key: 'protocol',
      label: 'PROTOCOL',
      value: 'HTTPS / REST (POST)',
      color: 'blue',
      icon: 'transport',
      flag: 'HTTPS / REST',
      description: '구글 공식 서버와 데이터를 안전하게 암호화하여 주고받는 웹 표준 통신 방식입니다.',
    })
    chips.push({
      key: 'response_mime',
      label: 'RESPONSE-MIME',
      value: 'application/json',
      color: 'emerald',
      icon: 'io',
      flag: 'responseMimeType',
      description: 'AI가 일반 대화 줄글을 쓰지 못하게 하고, 프로그램이 즉시 읽을 수 있는 순수 데이터(JSON) 형식으로만 답하게 강제합니다.',
    })
    chips.push({
      key: 'schema',
      label: 'SCHEMA',
      value: 'outline_schema.json',
      fullValue: span.inputs?.schema_file || 'outline_schema.json',
      color: 'indigo',
      icon: 'schema',
      flag: 'responseSchema',
      description: 'AI가 엉뚱한 잡담을 늘어놓지 못하도록 막고, 우리가 약속한 목차/아웃라인 규격에 맞춰서만 결과를 뱉게 만드는 데이터 틀입니다.',
    })
    chips.push({
      key: 'auth',
      label: 'AUTH',
      value: '$GOOGLE_API_KEY',
      color: 'amber',
      icon: 'shield',
      flag: 'x-goog-api-key',
      description: '구글 클라우드 계정 사용 권한을 증명하는 비밀 보안 API 키로, 외부 노출 없이 안전하게 주입됩니다.',
    })
    if (span.inputs?.attached_document) {
      const docName = String(span.inputs.attached_document).split(/[/\\]/).pop() || String(span.inputs.attached_document)
      chips.push({
        key: 'attached-doc',
        label: 'ATTACHED-DOC',
        value: docName,
        fullValue: String(span.inputs.attached_document),
        color: 'emerald',
        icon: 'file',
        flag: 'documentContext',
        description: 'AI가 소설 전체 맥락을 직접 읽고 분석할 수 있도록 프롬프트와 함께 컨텍스트로 전달한 원본 문서 파일입니다.',
      })
    }
    return chips
  }

  // CLI (agy) 설정 파싱
  const normalized = command.replace(/\\\n/g, ' ').replace(/\s+/g, ' ')
  const tokens = normalized.split(' ').filter(Boolean)

  let modelVal = span.inputs?.target_model || meta.model_name
  let inputFormat = 'stream-json'
  let outputFormat = 'stream-json'
  let effortVal = span.inputs?.effort || meta.extra?.effort_flag
  let skipPermissions = false
  let disableSlash = false
  let schemaPath = span.inputs?.schema_file || ''
  let conversationId = ''

  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i]
    if (t === '--model' && tokens[i + 1]) {
      modelVal = tokens[i + 1]
      i++
    } else if (t === '--input-format' && tokens[i + 1]) {
      inputFormat = tokens[i + 1]
      i++
    } else if (t === '--output-format' && tokens[i + 1]) {
      outputFormat = tokens[i + 1]
      i++
    } else if (t === '--effort' && tokens[i + 1]) {
      effortVal = tokens[i + 1]
      i++
    } else if (t === '--dangerously-skip-permissions') {
      skipPermissions = true
    } else if (t === '--disable-slash-commands') {
      disableSlash = true
    } else if (t === '--json-schema' && tokens[i + 1]) {
      schemaPath = tokens[i + 1].replace(/^["']|["']$/g, '')
      i++
    } else if (t === '--conversation' && tokens[i + 1]) {
      conversationId = tokens[i + 1]
      i++
    }
  }

  // Runner
  chips.push({
    key: 'runner',
    label: 'RUNNER',
    value: 'agy CLI',
    color: 'amber',
    icon: 'transport',
    flag: 'agy CLI',
    description: '웹 브라우저나 외부 서버 없이, 내 컴퓨터 터미널에서 agy 명령어로 AI를 직접 실행하는 백그라운드 구동기입니다.',
  })

  // Model
  if (modelVal) {
    chips.push({
      key: 'model',
      label: 'MODEL',
      value: modelVal,
      color: 'cyan',
      icon: 'model',
      flag: `--model ${modelVal}`,
      description: '실제 원고를 분석하고 기획을 작성하는 AI 두뇌 모델입니다. (초고속 저지연 Flash 엔진 작동 중)',
    })
  }

  // Input Format
  chips.push({
    key: 'input-format',
    label: 'INPUT-FORMAT',
    value: inputFormat,
    color: 'blue',
    icon: 'io',
    flag: `--input-format ${inputFormat}`,
    description: '소설 원문과 질문 프롬프트를 터미널에 안정적으로 한 줄씩 실시간 밀어넣어 전달하는 입력 방식입니다.',
  })

  // Output Format
  chips.push({
    key: 'output-format',
    label: 'OUTPUT-FORMAT',
    value: outputFormat,
    color: 'emerald',
    icon: 'io',
    flag: `--output-format ${outputFormat}`,
    description: 'AI가 답변 작성을 마칠 때까지 기다리지 않고, 실시간으로 타자 치듯 결과 데이터를 곧바로 화면에 수신하는 방식입니다.',
  })

  // Effort (if set)
  if (effortVal && effortVal !== 'default') {
    chips.push({
      key: 'effort',
      label: 'EFFORT',
      value: effortVal,
      color: 'amber',
      icon: 'effort',
      flag: `--effort ${effortVal}`,
      description: 'AI가 답변을 출력하기 전에 얼마나 깊게 생각하고 고민할지 결정하는 추론 깊이 조절 옵션입니다.',
    })
  }

  // Permissions
  chips.push({
    key: 'permissions',
    label: 'PERMISSIONS',
    value: skipPermissions ? 'bypass (skip-permissions)' : 'strict',
    color: skipPermissions ? 'rose' : 'slate',
    icon: 'shield',
    flag: skipPermissions ? '--dangerously-skip-permissions' : '(default strict)',
    description: skipPermissions
      ? '터미널에서 "이 도구를 실행할까요? (y/n)" 하고 일일이 묻지 않고, 백그라운드에서 끊김 없이 자동 완주하도록 승인을 건너뛰는 옵션입니다.'
      : '모든 도구 실행 및 파일 변경 시 사용자의 수동 승인을 거치도록 대기하는 안전 모드입니다.',
  })

  // Slash commands
  chips.push({
    key: 'slash-commands',
    label: 'SLASH-COMMANDS',
    value: disableSlash ? 'disabled' : 'enabled',
    color: 'slate',
    icon: 'slash',
    flag: disableSlash ? '--disable-slash-commands' : '(default enabled)',
    description: disableSlash
      ? '소설 본문이나 프롬프트에 "/목차" 같은 슬래시(/)가 포함되어 있어도 시스템 명령어로 오작동하지 않고 순수 본문 글로만 안전하게 읽게 만듭니다.'
      : '에이전트 슬래시 명령어(/learn, /grill-me 등) 기능이 활성화되어 있습니다.',
  })

  // JSON Schema
  if (schemaPath) {
    const schemaFileOnly = schemaPath.split(/[/\\]/).pop() || schemaPath
    chips.push({
      key: 'json-schema',
      label: 'JSON-SCHEMA',
      value: schemaFileOnly,
      fullValue: schemaPath,
      color: 'indigo',
      icon: 'schema',
      flag: `--json-schema ${schemaFileOnly}`,
      description: 'AI가 엉뚱한 잡담을 늘어놓지 못하도록 막고, 우리가 약속한 목차/아웃라인 규격에 맞춰서만 결과를 뱉게 만드는 강제 틀입니다.',
    })
  }

  // Conversation ID
  if (conversationId) {
    chips.push({
      key: 'conversation',
      label: 'CONVERSATION',
      value: conversationId,
      color: 'purple',
      icon: 'file',
      flag: `--conversation`,
      description: '이전 단계에서 나눈 대화 맥락과 작가님의 요청 기억을 잊지 않고 이어서 기억하도록 묶어주는 세션 번호입니다.',
    })
  }

  // Attached Doc
  if (span.inputs?.attached_document) {
    const docName = String(span.inputs.attached_document).split(/[/\\]/).pop() || String(span.inputs.attached_document)
    chips.push({
      key: 'attached-doc',
      label: 'ATTACHED-DOC',
      value: docName,
      fullValue: String(span.inputs.attached_document),
      color: 'emerald',
      icon: 'file',
      flag: `--attached-doc ${docName}`,
      description: 'AI가 소설 전체 흐름을 직접 읽고 분석할 수 있도록 프롬프트와 함께 컨텍스트로 전달한 원본 문서 파일입니다.',
    })
  }

  return chips
}

const CHIP_STYLES: Record<CliSettingChip['color'], { bg: string; border: string; text: string; label: string }> = {
  cyan: {
    bg: 'bg-cyan-950/70',
    border: 'border-cyan-800/70 hover:border-cyan-600',
    text: 'text-cyan-200',
    label: 'text-cyan-400',
  },
  emerald: {
    bg: 'bg-emerald-950/70',
    border: 'border-emerald-800/70 hover:border-emerald-600',
    text: 'text-emerald-200',
    label: 'text-emerald-400',
  },
  amber: {
    bg: 'bg-amber-950/70',
    border: 'border-amber-800/70 hover:border-amber-600',
    text: 'text-amber-200',
    label: 'text-amber-400',
  },
  purple: {
    bg: 'bg-purple-950/70',
    border: 'border-purple-800/70 hover:border-purple-600',
    text: 'text-purple-200',
    label: 'text-purple-400',
  },
  rose: {
    bg: 'bg-rose-950/70',
    border: 'border-rose-800/70 hover:border-rose-600',
    text: 'text-rose-200',
    label: 'text-rose-400',
  },
  indigo: {
    bg: 'bg-indigo-950/70',
    border: 'border-indigo-800/70 hover:border-indigo-600',
    text: 'text-indigo-200',
    label: 'text-indigo-400',
  },
  blue: {
    bg: 'bg-blue-950/70',
    border: 'border-blue-800/70 hover:border-blue-600',
    text: 'text-blue-200',
    label: 'text-blue-400',
  },
  slate: {
    bg: 'bg-slate-900/80',
    border: 'border-slate-800 hover:border-slate-700',
    text: 'text-slate-300',
    label: 'text-slate-500',
  },
}

interface LlmExecutionCommandCardProps {
  readonly command: string
  readonly span: SpanRecord
  readonly onOpenModal: (
    title: string,
    content: string,
    language: 'markdown' | 'json' | 'text',
    charCount: number
  ) => void
}

const LlmExecutionCommandCard: React.FC<LlmExecutionCommandCardProps> = ({
  command,
  span,
  onOpenModal,
}) => {
  const [copied, setCopied] = useState(false)
  const [showRawCommand, setShowRawCommand] = useState(true)
  const [hoveredChip, setHoveredChip] = useState<CliSettingChip | null>(null)

  const chips = useMemo(() => parseLlmSettings(command, span), [command, span])
  const meta = getSpanMetadata(span)
  const isApi =
    command.startsWith('curl') ||
    meta.extra?.provider === 'google_api' ||
    span.inputs?.provider === 'google_api'

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(command)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const getChipIcon = (iconType?: string) => {
    switch (iconType) {
      case 'model':
        return <Cpu className="w-3 h-3 text-cyan-400 shrink-0" />
      case 'io':
        return <ArrowRightLeft className="w-3 h-3 text-emerald-400 shrink-0" />
      case 'effort':
        return <Zap className="w-3 h-3 text-amber-400 shrink-0" />
      case 'shield':
        return <ShieldAlert className="w-3 h-3 text-rose-400 shrink-0" />
      case 'schema':
        return <FileCode className="w-3 h-3 text-indigo-400 shrink-0" />
      case 'file':
        return <Paperclip className="w-3 h-3 text-teal-400 shrink-0" />
      case 'api':
        return <Sparkles className="w-3 h-3 text-purple-400 shrink-0" />
      default:
        return <Terminal className="w-3 h-3 text-amber-400 shrink-0" />
    }
  }

  return (
    <div className="rounded-lg border border-amber-500/50 bg-[#070d1a] shadow-xl overflow-hidden flex flex-col transition-all hover:border-amber-400/80">
      {/* 1. 최상단 타이틀 바 */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#0e1628] border-b border-amber-500/30 text-[11px] font-mono">
        <div className="flex items-center gap-2 min-w-0">
          <Terminal className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
          <span className="font-semibold text-amber-200">LLM 송출 설정 & 명령어</span>
          <span
            className={`text-[9px] px-2 py-0.5 rounded-full font-sans font-semibold border ${
              isApi
                ? 'bg-purple-950/80 border-purple-700/60 text-purple-300'
                : 'bg-amber-950/80 border-amber-700/60 text-amber-300'
            }`}
          >
            {isApi ? 'API REQUEST (cURL)' : 'CLI COMMAND (agy)'}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-slate-100 transition-colors cursor-pointer border border-slate-700/60"
            title="실행 명령어 클립보드에 복사"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-400">복사됨</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3 text-slate-400" />
                <span>명령어 복사</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => onOpenModal('LLM Execution Command', command, 'text', command.length)}
            className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-slate-100 transition-colors cursor-pointer border border-slate-700/60"
            title="전체화면으로 확대"
          >
            <Maximize2 className="w-3 h-3 text-slate-400" />
            <span>전체화면</span>
          </button>
        </div>
      </div>

      {/* 2. CLI/API 설정값 CHIPS 그리드 & 인터랙티브 호버 설명 툴바 */}
      <div className="p-3 bg-[#09101f] border-b border-slate-800/80 space-y-2.5">
        <div className="flex items-center justify-between text-[10px] font-sans font-semibold text-slate-400">
          <div className="flex items-center gap-1.5 uppercase tracking-wider text-slate-400">
            <Settings className="w-3.5 h-3.5 text-amber-400/80" />
            <span>{isApi ? 'API Configuration Settings' : 'CLI Execution Flags & Settings'}</span>
          </div>
          <span className="text-slate-500 font-mono text-[10px]">{chips.length}개 설정 파라미터</span>
        </div>

        {/* 칩 목록 (마우스 호버 시 실시간 연동 및 스케일 효과, 불필요한 브라우저 기본 툴팁 팝업 제거) */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {chips.map((chip) => {
            const style = CHIP_STYLES[chip.color] || CHIP_STYLES.slate
            const isHovered = hoveredChip?.key === chip.key
            return (
              <div
                key={chip.key}
                onMouseEnter={() => setHoveredChip(chip)}
                onMouseLeave={() => setHoveredChip(null)}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded border text-[11px] font-mono shadow-sm transition-all duration-150 cursor-pointer ${
                  style.bg
                } ${style.border} ${
                  isHovered
                    ? 'ring-2 ring-amber-400/90 scale-[1.03] brightness-125 z-10 shadow-md shadow-amber-950/50'
                    : 'opacity-90 hover:opacity-100'
                }`}
              >
                {getChipIcon(chip.icon)}
                <span className={`text-[9px] font-sans font-bold tracking-wider ${style.label}`}>
                  {chip.label}:
                </span>
                <span className={`font-medium truncate max-w-[180px] ${style.text}`}>
                  {chip.value}
                </span>
              </div>
            )
          })}
        </div>

        {/* 호버 시 실시간 설명 툴바 (Hover Description Toolbar: 시야를 가리는 경로 대신 명확한 기능 설명 제공) */}
        <div
          className={`min-h-[44px] px-3 py-2 rounded-md border transition-all duration-200 flex items-center justify-between gap-3 text-xs ${
            hoveredChip
              ? 'bg-[#0f192e] border-amber-500/60 shadow-lg shadow-amber-950/30 ring-1 ring-amber-500/30'
              : 'bg-[#080d19]/80 border-slate-800/80 text-slate-400'
          }`}
        >
          {hoveredChip ? (
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="flex items-center gap-1.5 shrink-0">
                {getChipIcon(hoveredChip.icon)}
                <span className="font-mono font-bold text-amber-300 text-[11px] bg-amber-950/90 px-2 py-0.5 rounded border border-amber-500/50 shadow-sm">
                  {hoveredChip.flag || hoveredChip.label}
                </span>
              </div>
              <div className="text-[11px] text-slate-200 font-sans flex items-center gap-1.5 flex-1 min-w-0">
                <span className="text-amber-400 font-semibold shrink-0">[{hoveredChip.label}]</span>
                <span className="text-slate-200 leading-snug">{hoveredChip.description}</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-[11px] text-slate-400 font-sans">
              <Info className="w-3.5 h-3.5 text-amber-400/80 shrink-0" />
              <span>설정 Chip에 마우스를 올리면 해당 옵션의 실제 기능과 작동 원리 설명이 여기에 표시됩니다.</span>
            </div>
          )}

          {hoveredChip && (
            <div className="shrink-0 font-mono text-[10px] text-slate-400 bg-slate-900/90 px-2.5 py-1 rounded border border-slate-800 flex items-center gap-1.5">
              <span className="text-slate-400">설정값:</span>
              <span className="text-slate-100 font-semibold">{hoveredChip.value}</span>
            </div>
          )}
        </div>
      </div>

      {/* 3. 원문 실행 명령어 전문 (토글 및 CodeMirror 가상화 뷰어) */}
      <div className="bg-[#050912]">
        <div
          onClick={() => setShowRawCommand((prev) => !prev)}
          className="flex items-center justify-between px-3 py-1.5 bg-[#080d19] border-b border-slate-800/60 text-[10px] font-mono text-slate-400 cursor-pointer hover:text-slate-200 transition-colors select-none"
        >
          <div className="flex items-center gap-1.5">
            <span className="text-amber-400 font-bold">$</span>
            <span>실제 송출 쉘 명령어 전문 ({command.length.toLocaleString()}자)</span>
          </div>
          <div className="flex items-center gap-1 text-slate-500 text-[10px] font-sans">
            <span>{showRawCommand ? '접기' : '펼치기'}</span>
            {showRawCommand ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </div>
        </div>

        {showRawCommand && (
          <div className="p-1">
            <CodeMirror
              value={command}
              height="130px"
              theme={oneDark}
              editable={false}
              readOnly={true}
              basicSetup={{
                lineNumbers: true,
                foldGutter: false,
                dropCursor: false,
                allowMultipleSelections: false,
                indentOnInput: false,
                bracketMatching: true,
                closeBrackets: false,
                autocompletion: false,
                rectangularSelection: false,
                crosshairCursor: false,
                highlightActiveLine: true,
                highlightSelectionMatches: false,
                closeBracketsKeymap: false,
                searchKeymap: true,
              }}
              className="text-xs font-mono rounded overflow-hidden"
            />
          </div>
        )}
      </div>
    </div>
  )
}

export const SpanDetail: React.FC<SpanDetailProps> = ({ span, snapshots }) => {
  const [activeTab, setActiveTab] = useState<TabType>('io')
  const [modalViewer, setModalViewer] = useState<ModalViewerState>({
    isOpen: false,
    title: '',
    content: '',
    language: 'text',
    charCount: 0,
  })
  const [modalCopied, setModalCopied] = useState(false)

  const handleOpenModal = (title: string, content: string, language: 'markdown' | 'json' | 'text', charCount: number) => {
    setModalViewer({
      isOpen: true,
      title,
      content,
      language,
      charCount,
    })
  }

  const handleModalCopy = () => {
    navigator.clipboard.writeText(modalViewer.content)
    setModalCopied(true)
    setTimeout(() => setModalCopied(false), 2000)
  }

  const modalExtensions = useMemo(() => {
    if (modalViewer.language === 'json') return [json()]
    if (modalViewer.language === 'markdown') return [markdown()]
    return []
  }, [modalViewer.language])

  // 오직 LLM 스팬(span.span_type === 'llm' 또는 span.name이 'llm:'으로 시작)일 때만 엄격하게 활성화
  const isLlmSpan = Boolean(
    span && (span.span_type === 'llm' || span.name.toLowerCase().startsWith('llm:'))
  )

  // inputs와 outputs 데이터를 '대형 페이로드(CodeMirror 대상)'와 '단순 속성'으로 지능적 분리
  const { simpleInputs, largeInputs, simpleOutputs, largeOutputs } = useMemo(() => {
    const sIn: Record<string, any> = {}
    const lIn: Record<string, any> = {}
    const sOut: Record<string, any> = {}
    const lOut: Record<string, any> = {}

    const isLarge = (key: string, val: any): boolean => {
      if (val === null || val === undefined) return false
      if (typeof val === 'object') return true
      if (typeof val === 'string') {
        if (val.length > 80 || val.includes('\n')) return true
        const lower = key.toLowerCase()
        if (
          lower.includes('text') ||
          lower.includes('prompt') ||
          lower.includes('response') ||
          lower.includes('schema') ||
          lower.includes('trace') ||
          lower.includes('content') ||
          lower.includes('json') ||
          lower.includes('meta')
        ) {
          return true
        }
      }
      return false
    }

    const commandKeys = new Set(['execution_command', 'cli_command', 'command', 'raw_command'])

    if (span?.inputs) {
      Object.entries(span.inputs).forEach(([k, v]) => {
        // LLM 스팬인 경우, 커맨드는 상단 전용 칩 카드로 렌더링되므로 일반 입력 목록에서는 제외
        if (isLlmSpan && commandKeys.has(k)) return
        if (isLarge(k, v)) lIn[k] = v
        else sIn[k] = v
      })
    }

    if (span?.outputs) {
      Object.entries(span.outputs).forEach(([k, v]) => {
        if (isLarge(k, v)) lOut[k] = v
        else sOut[k] = v
      })
    }

    return { simpleInputs: sIn, largeInputs: lIn, simpleOutputs: sOut, largeOutputs: lOut }
  }, [span?.inputs, span?.outputs, isLlmSpan])

  // LLM 스팬인 경우에만 실제 송출된 CLI / API 실행 명령어 추출 및 자동 보정
  const resolvedExecutionCommand = useMemo(() => {
    if (!span || !isLlmSpan) return null

    // 1. inputs에 명시된 execution_command / cli_command / command
    if (span.inputs?.execution_command) return formatCommand(String(span.inputs.execution_command))
    if (span.inputs?.cli_command) return formatCommand(String(span.inputs.cli_command))
    if (span.inputs?.command) {
      const c = span.inputs.command
      return formatCommand(Array.isArray(c) ? c.join(' ') : String(c))
    }

    // 2. attempts의 raw_command
    if (span.attempts && span.attempts.length > 0) {
      const att = span.attempts[0]
      if (att.raw_command) return formatCommand(att.raw_command)
    }

    // 3. metadata.extra의 raw_command / command
    const meta = getSpanMetadata(span)
    const extra = meta.extra || {}
    if (extra.raw_command) return formatCommand(String(extra.raw_command))
    if (extra.command) {
      const c = extra.command
      return formatCommand(Array.isArray(c) ? c.join(' ') : String(c))
    }

    // 4. LLM 스팬 복원 (모델명과 스키마 파일 바탕으로 완벽 재현)
    const model =
      span.inputs?.target_model ||
      meta.model_name ||
      span.name.replace(/^llm:/i, '').split(' ')[0] ||
      'gemini-3.8-flash-low'
    const provider =
      span.inputs?.provider ||
      meta.extra?.provider ||
      (model.includes('direct') || model.includes('google_api') ? 'google_api' : 'agy_cli')

    const isApi = provider === 'google_api' || String(provider).toLowerCase().includes('api')
    if (isApi) {
      return formatCommand(
        `curl -X POST "https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=$GOOGLE_API_KEY" \\\n` +
        `  -H "Content-Type: application/json" \\\n` +
        `  -d '{\n` +
        `    "generationConfig": {\n` +
        `      "responseMimeType": "application/json"\n` +
        `    },\n` +
        `    "contents": [\n` +
        `      {\n` +
        `        "role": "user",\n` +
        `        "parts": [\n` +
        `          {"text": "<PROMPT_STRING>"}\n` +
        `        ]\n` +
        `      }\n` +
        `    ]\n` +
        `  }'`
      )
    } else {
      const effort = span.inputs?.effort || meta.extra?.effort_flag
      const effortArg = effort && effort !== 'default' ? ` --effort ${effort}` : ''
      const schemaFile = span.inputs?.schema_file || 'packages/scaffold-engine/scaffold_engine/outline/schemas/outline_schema.json'
      return formatCommand(
        `agy --model ${model}${effortArg} --input-format stream-json --output-format stream-json --dangerously-skip-permissions --disable-slash-commands --json-schema "${schemaFile}"`
      )
    }
  }, [span, isLlmSpan])

  if (!span) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-full bg-[#080d19] text-slate-500 text-xs p-8 text-center gap-3">
        <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400">
          <Layers className="w-5 h-5" />
        </div>
        <div>
          <div className="font-semibold text-slate-300 mb-1">스팬(Span)을 선택해 주세요</div>
          <div className="text-[11px] text-slate-500 max-w-xs">
            좌측 워터폴 파이프라인에서 스팬을 클릭하면, 오고 간 전문(Context, Prompt, Response)과 세부 실행 원장을 실시간으로 확인하실 수 있습니다.
          </div>
        </div>
      </div>
    )
  }

  const attempts = span.attempts || []
  const hasAttempts = attempts.length > 0
  const matchingSnapshotKeys = Object.keys(snapshots).filter(
    (k) => span.name.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(span.name.toLowerCase())
  )

  return (
    <div className="w-[420px] lg:w-[540px] xl:w-[600px] shrink-0 flex flex-col h-full bg-[#070b14] border-l border-slate-800 shadow-2xl relative">
      {/* 1. 최상단 헤더 정보 (스팬 명칭, 상태, 레이턴시, 차수) */}
      <div className="p-3.5 border-b border-slate-800/90 bg-[#0c1222] shadow-sm">
        <div className="flex items-center justify-between mb-1.5 gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                span.status === 'SUCCESS'
                  ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]'
                  : span.status === 'FALLBACK_TRIGGERED'
                  ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]'
                  : 'bg-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.6)]'
              }`}
            />
            <span className="font-mono text-sm font-semibold text-slate-100 truncate" title={span.name}>
              {span.name}
            </span>
          </div>

          <span
            className={`text-[10px] px-2 py-0.5 rounded-full font-semibold shrink-0 border ${
              span.status === 'SUCCESS'
                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                : span.status === 'FALLBACK_TRIGGERED'
                ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
            }`}
          >
            {span.status}
          </span>
        </div>

        <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono flex-wrap">
          <span className="flex items-center gap-1">
            <span className="text-slate-500 font-sans">Type:</span>
            <span className="text-cyan-300 font-semibold px-1.5 py-0.2 rounded bg-cyan-950/60 border border-cyan-800/50">
              {span.span_type.toUpperCase()}
            </span>
          </span>

          <span className="flex items-center gap-1">
            <span className="text-slate-500 font-sans">Latency:</span>
            <span className="text-amber-300 font-semibold">{span.duration_ms.toFixed(1)}ms</span>
          </span>

          <span className="flex items-center gap-1 ml-auto">
            <span className="text-slate-500 font-sans">Order:</span>
            <span className="text-slate-300 text-[10px] truncate max-w-[140px]">#{span.dotted_order}</span>
          </span>
        </div>
      </div>

      {/* 2. 탭 네비게이션 */}
      <div className="flex border-b border-slate-800 bg-[#090f1d] px-2 text-xs select-none">
        <button
          type="button"
          onClick={() => setActiveTab('io')}
          className={`flex items-center gap-1.5 px-3 py-2.5 border-b-2 font-medium transition-all cursor-pointer ${
            activeTab === 'io'
              ? 'border-cyan-400 text-cyan-300 bg-cyan-950/20'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Braces className="w-3.5 h-3.5" />
          <span>Inputs & Outputs</span>
        </button>

        {hasAttempts && (
          <button
            type="button"
            onClick={() => setActiveTab('attempts')}
            className={`flex items-center gap-1.5 px-3 py-2.5 border-b-2 font-medium transition-all cursor-pointer ${
              activeTab === 'attempts'
                ? 'border-cyan-400 text-cyan-300 bg-cyan-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>시도 이력 ({attempts.length})</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => setActiveTab('snapshots')}
          className={`flex items-center gap-1.5 px-3 py-2.5 border-b-2 font-medium transition-all cursor-pointer ${
            activeTab === 'snapshots'
              ? 'border-cyan-400 text-cyan-300 bg-cyan-950/20'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Snapshots ({Object.keys(snapshots).length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('raw')}
          className={`flex items-center gap-1.5 px-3 py-2.5 border-b-2 font-medium transition-all cursor-pointer ${
            activeTab === 'raw'
              ? 'border-cyan-400 text-cyan-300 bg-cyan-950/20'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Code2 className="w-3.5 h-3.5" />
          <span>Raw JSON</span>
        </button>
      </div>

      {/* 3. 탭 본문 영역 */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-4 text-xs font-mono">
        {activeTab === 'io' && (
          <>
            {/* 에러 발생 시 최우선 배너 */}
            {span.error && (
              <div className="p-3 rounded-lg border border-rose-500/40 bg-rose-500/10 text-rose-300 space-y-1.5 shadow-md">
                <div className="flex items-center gap-1.5 font-semibold text-rose-400 text-xs">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>실행 에러: {span.error.code}</span>
                </div>
                <div className="text-[11px] break-words leading-relaxed text-rose-200">{span.error.message}</div>
                {span.error.traceback && (
                  <VirtualCodeCard
                    title="Error Traceback"
                    data={span.error.traceback}
                    defaultHeight="160px"
                    badgeLabel="TRACEBACK"
                    onOpenModal={handleOpenModal}
                  />
                )}
              </div>
            )}

            {/* INPUTS 섹션 */}
            <div className="space-y-3">
              <div className="text-[11px] font-semibold text-sky-400 flex items-center gap-1.5 border-b border-slate-800/80 pb-1">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                <span>INPUTS (입력 데이터)</span>
              </div>

              {/* 1. LLM 스팬 실행 명령어 & 설정 칩 (CLI / API Configuration) 전용 최우선 카드 */}
              {isLlmSpan && resolvedExecutionCommand && (
                <LlmExecutionCommandCard
                  command={resolvedExecutionCommand}
                  span={span}
                  onOpenModal={handleOpenModal}
                />
              )}

              {/* 2. 일반 메타데이터 속성 그리드 */}
              {Object.keys(simpleInputs).length > 0 && <SimplePropertiesGrid properties={simpleInputs} />}

              {/* 3. 대형 입력 페이로드 (프롬프트, 지침, 컨텍스트 등) */}
              {Object.entries(largeInputs).map(([k, v]) => (
                <VirtualCodeCard
                  key={k}
                  title={`Input: ${k}`}
                  data={v}
                  defaultHeight="220px"
                  badgeLabel={getBadgeLabel(k)}
                  onOpenModal={handleOpenModal}
                />
              ))}

              {(!isLlmSpan || !resolvedExecutionCommand) && Object.keys(simpleInputs).length === 0 && Object.keys(largeInputs).length === 0 && (
                <div className="p-2 text-slate-500 italic text-[11px]">기록된 입력 데이터가 없습니다.</div>
              )}
            </div>

            {/* OUTPUTS 섹션 */}
            <div className="space-y-2 pt-2">
              <div className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1.5 border-b border-slate-800/80 pb-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>OUTPUTS (산출물 및 전문 실측)</span>
              </div>

              {Object.keys(simpleOutputs).length > 0 && <SimplePropertiesGrid properties={simpleOutputs} />}

              {Object.entries(largeOutputs).map(([k, v]) => (
                <VirtualCodeCard
                  key={k}
                  title={`Output: ${k}`}
                  data={v}
                  defaultHeight="260px"
                  badgeLabel={getBadgeLabel(k)}
                  onOpenModal={handleOpenModal}
                />
              ))}

              {Object.keys(simpleOutputs).length === 0 && Object.keys(largeOutputs).length === 0 && (
                <div className="p-2 text-slate-500 italic text-[11px]">기록된 산출물 데이터가 없습니다.</div>
              )}
            </div>
          </>
        )}

        {/* 시도 이력(Attempts) 탭 */}
        {activeTab === 'attempts' && (
          <div className="space-y-3">
            {attempts.map((att) => (
              <div key={att.attempt_index} className="p-3 rounded-lg border border-slate-800 bg-[#0a101f] space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-200 text-xs">
                    시도 #{att.attempt_index + 1}: {att.provider}
                  </span>
                  {att.status === 'SUCCESS' ? (
                    <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      <CheckCircle2 className="w-3 h-3" />
                      SUCCESS
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/30">
                      <AlertCircle className="w-3 h-3" />
                      FAILED
                    </span>
                  )}
                </div>

                <div className="text-[11px] text-slate-400 grid grid-cols-2 gap-2 bg-[#060a14] p-2 rounded border border-slate-800/80">
                  <div>
                    모델: <span className="text-slate-200 font-mono">{att.model}</span>
                  </div>
                  <div>
                    지연시간: <span className="text-cyan-400 font-mono">{att.duration_ms.toFixed(1)}ms</span>
                  </div>
                  <div>
                    토큰수:{' '}
                    <span className="text-slate-200 font-mono">
                      입 {att.input_tokens.toLocaleString()} · 출 {att.output_tokens.toLocaleString()} (총 {(att.input_tokens + att.output_tokens).toLocaleString()} tok)
                    </span>
                  </div>
                  <div>
                    비용: <span className="text-emerald-400 font-mono">${att.cost_usd.toFixed(4)}</span>
                  </div>
                </div>

                {att.failure_reason && (
                  <div className="text-[11px] text-rose-400 p-2 rounded bg-rose-950/20 border border-rose-900/40">
                    원인: {att.failure_reason}
                  </div>
                )}

                {att.raw_command && (
                  <VirtualCodeCard
                    title="Raw CLI Command"
                    data={att.raw_command}
                    defaultHeight="120px"
                    onOpenModal={handleOpenModal}
                  />
                )}

                {att.stderr_sample && (
                  <VirtualCodeCard
                    title="Stderr Output"
                    data={att.stderr_sample}
                    defaultHeight="140px"
                    badgeLabel="STDERR"
                    onOpenModal={handleOpenModal}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Snapshots 탭 (모두 가상화 CodeMirror 카드로 렌더링) */}
        {activeTab === 'snapshots' && (
          <div className="space-y-4">
            {Object.entries(snapshots).map(([key, data]) => {
              const isRelevant = matchingSnapshotKeys.includes(key)
              return (
                <VirtualCodeCard
                  key={key}
                  title={`Snapshot: ${key}`}
                  data={data}
                  defaultHeight="240px"
                  badgeLabel={isRelevant ? 'RELEVANT' : undefined}
                  onOpenModal={handleOpenModal}
                />
              )
            })}
          </div>
        )}

        {/* Raw JSON 탭 (전체 스팬 레코드를 가상화 뷰어로 열람) */}
        {activeTab === 'raw' && (
          <VirtualCodeCard
            title="Span Full Ledger Record"
            data={span}
            defaultHeight="520px"
            badgeLabel="RAW LEDGER"
            onOpenModal={handleOpenModal}
          />
        )}
      </div>

      {/* 4. 전체화면 대형 모달 (수만~수십만 자 쾌적 열람, 검색, 복사) */}
      {modalViewer.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-8 animate-in fade-in duration-200">
          <div className="w-full max-w-5xl h-[88vh] bg-[#070c17] border border-slate-700/80 rounded-xl shadow-2xl flex flex-col overflow-hidden">
            {/* 모달 헤더 */}
            <div className="flex items-center justify-between px-5 py-3.5 bg-[#0c1427] border-b border-slate-800">
              <div className="flex items-center gap-3">
                <FileCode className="w-5 h-5 text-cyan-400 shrink-0" />
                <div className="flex flex-col">
                  <span className="font-mono text-sm font-semibold text-slate-100">{modalViewer.title}</span>
                  <span className="text-[11px] text-slate-400 font-sans">
                    {modalViewer.language.toUpperCase()} • 실측 {modalViewer.charCount.toLocaleString()} 자 (가상 스크롤
                    검색 지원: <kbd className="px-1 py-0.2 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">Ctrl</kbd> +{' '}
                    <kbd className="px-1 py-0.2 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">F</kbd>)
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleModalCopy}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
                >
                  {modalCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400 font-semibold">복사 완료</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-300" />
                      <span>전체 복사</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setModalViewer((prev) => ({ ...prev, isOpen: false }))}
                  className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-100 transition-colors cursor-pointer"
                  title="닫기 (ESC)"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* 모달 CodeMirror 뷰어 */}
            <div className="flex-1 overflow-hidden">
              <CodeMirror
                value={modalViewer.content}
                height="100%"
                theme={oneDark}
                extensions={modalExtensions}
                editable={false}
                readOnly={true}
                basicSetup={{
                  lineNumbers: true,
                  foldGutter: true,
                  highlightActiveLineGutter: true,
                  highlightActiveLine: true,
                  searchKeymap: true,
                }}
                className="h-full text-xs font-mono"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
