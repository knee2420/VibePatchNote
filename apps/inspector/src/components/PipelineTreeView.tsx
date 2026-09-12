/**
 * @fileoverview Inspector PipelineTreeView 컴포넌트
 * 실행 스팬에 관여된 파이썬 파일, 클래스, 함수 심볼 및 프롬프트 트리를 파싱하고 소스 코드를 가상화 뷰어로 렌더링합니다.
 * Google TypeScript Style Guide 규칙(readonly 불변성, JSDoc, 명시적 타입)을 준수합니다.
 */

import React, { useState } from 'react'
import {
  Check,
  ChevronDown,
  ChevronRight,
  Code2,
  Copy,
  FileCode,
  FileText,
  Folder,
  Loader2,
  Package,
  Sparkles,
  Terminal,
  Zap,
} from 'lucide-react'
import CodeMirror from '@uiw/react-codemirror'
import { json } from '@codemirror/lang-json'
import { markdown } from '@codemirror/lang-markdown'
import { oneDark } from '@codemirror/theme-one-dark'

import { fetchSourceCode } from '../api'
import type { CompareItem, SourceCodeResponse, SpanRecord } from '../types'

interface PipelineTreeViewProps {
  readonly span: SpanRecord
  readonly dataIn: string | null
  readonly dataOut: string | null
  readonly dataVia: readonly string[]
  readonly isCompareMode?: boolean
  readonly compareSlotAId?: string | null
  readonly compareSlotBId?: string | null
  readonly onPickCompareItem?: (item: CompareItem) => void
}

export interface PipelineTreeNode {
  readonly id: string
  readonly name: string
  readonly type: 'file' | 'class' | 'function' | 'prompt'
  readonly filePath?: string
  readonly symbol?: string
  readonly directContent?: string
  readonly children?: readonly PipelineTreeNode[]
}

function isFileName(val?: string | null): boolean {
  if (!val) return false
  const lower = val.toLowerCase()
  return (
    lower.endsWith('.pdf') ||
    lower.endsWith('.docx') ||
    lower.endsWith('.xlsx') ||
    lower.endsWith('.txt') ||
    lower.endsWith('.hwp') ||
    lower.endsWith('.hwpx')
  )
}

const KNOWN_FILE_PATHS: Record<string, string> = {
  'extract_outline.py': 'apps/api/app/documents/use_cases/extract_outline.py',
  'generate_scaffold.py': 'apps/api/app/documents/use_cases/generate_scaffold.py',
  'local_document_artifact_repository.py': 'apps/api/app/documents/adapters/local_document_artifact_repository.py',
  'local_artifact_repository.py': 'apps/api/app/documents/adapters/local_document_artifact_repository.py',
  'fallback.py': 'apps/api/app/core/llm/fallback.py',
  'availability.py': 'apps/api/app/core/llm/availability.py',
  'policy_harness.py': 'apps/api/app/core/llm/policy_harness.py',
  'context_builder.py': 'packages/scaffold-engine/scaffold_engine/outline/prompts/context_builder.py',
  'pipeline.py': 'packages/scaffold-engine/scaffold_engine/outline/pipeline.py',
  'schema.py': 'packages/scaffold-engine/scaffold_engine/outline/schema.py',
  'models.py': 'packages/scaffold-engine/scaffold_engine/outline/models.py',
  'system_instructions.md': 'packages/scaffold-engine/scaffold_engine/outline/prompts/system_instructions.md',
  'runtime.py': 'apps/api/app/core/agent_runtime/runtime.py',
  'tracer.py': 'apps/api/app/core/llm/tracer.py',
}

interface ParsedVia {
  raw: string
  fileName: string
  filePath: string
  symbol?: string
  symbolLabel?: string
  symbolType: 'class' | 'function' | 'file' | 'prompt'
  isModelInfo?: boolean
  modelName?: string
}

function parseViaItem(item: string): ParsedVia {
  const trimmed = item.trim()

  // 1. 모델 정보: "Model: gemini-3.8-flash-low"
  if (trimmed.toLowerCase().startsWith('model:')) {
    const modelName = trimmed.replace(/^model:\s*/i, '').trim()
    return {
      raw: trimmed,
      fileName: '',
      filePath: '',
      symbolType: 'prompt',
      isModelInfo: true,
      modelName,
    }
  }

  // 2. "RuntimePolicyHarness.run_structured" or "RuntimePolicyHarness"
  if (trimmed.startsWith('RuntimePolicyHarness')) {
    const parts = trimmed.split('.')
    const symbol = parts.length > 1 ? parts[1] : 'RuntimePolicyHarness'
    return {
      raw: trimmed,
      fileName: 'policy_harness.py',
      filePath: KNOWN_FILE_PATHS['policy_harness.py'],
      symbol,
      symbolLabel: parts.length > 1 ? `def ${symbol}(...)` : 'class RuntimePolicyHarness',
      symbolType: parts.length > 1 ? 'function' : 'class',
    }
  }

  // 3. 표준 포맷: "fileName.py (SymbolOrFunction)" or "path/fileName.py (Symbol)"
  const parenMatch = trimmed.match(/^([^\s(]+)(?:\s*\(([^)]+)\))?/)
  if (parenMatch) {
    const rawFile = parenMatch[1]
    const rawSymbol = parenMatch[2]?.trim()
    const baseName = rawFile.split('/').pop() || rawFile
    const filePath = KNOWN_FILE_PATHS[baseName] || (rawFile.includes('/') ? rawFile : baseName)

    let symbolType: 'class' | 'function' | 'file' = 'file'
    let symbolLabel = rawSymbol
    if (rawSymbol) {
      const lastPart = rawSymbol.split('.').pop() || rawSymbol
      const isClass = /^[A-Z]/.test(lastPart) && !lastPart.startsWith('_')
      symbolType = isClass ? 'class' : 'function'
      symbolLabel = isClass ? `class ${rawSymbol}` : `def ${rawSymbol}(...)`
    }

    return {
      raw: trimmed,
      fileName: baseName,
      filePath,
      symbol: rawSymbol,
      symbolLabel,
      symbolType,
    }
  }

  return {
    raw: trimmed,
    fileName: trimmed,
    filePath: trimmed,
    symbolType: 'file',
  }
}

/**
 * 스팬의 data_via를 우선 동적 파싱하여 FLOW와 100% 일치하는 계층형 트리를 생성합니다.
 */
function buildTreeForSpan(
  span: SpanRecord,
  dataVia: readonly string[]
): PipelineTreeNode[] {
  const nodes: PipelineTreeNode[] = []

  // 1. dataVia 기반 1:1 동적 트리 매핑 (FLOW 바와 정확히 일치)
  if (dataVia && dataVia.length > 0) {
    const fileGroupMap = new Map<string, {
      filePath: string
      children: PipelineTreeNode[]
    }>()

    dataVia.forEach((item, idx) => {
      const parsed = parseViaItem(item)

      // 모델 전용 노드
      if (parsed.isModelInfo) {
        nodes.push({
          id: `${span.span_id}-model-${idx}`,
          name: `Model: ${parsed.modelName || 'LLM Engine'}`,
          type: 'prompt',
          directContent: `[LLM Engine Specification]\nModel: ${parsed.modelName}\nSpan: ${span.name}\nDuration: ${(span.duration_ms || 0).toFixed(1)} ms\nTokens: Total ${span.usage?.total_tokens || 0} (Prompt: ${span.usage?.prompt_tokens || 0}, Completion: ${span.usage?.completion_tokens || 0})`,
        })
        return
      }

      if (!parsed.filePath) return

      let group = fileGroupMap.get(parsed.filePath)
      if (!group) {
        group = {
          filePath: parsed.filePath,
          children: [],
        }
        fileGroupMap.set(parsed.filePath, group)
      }

      if (parsed.symbol) {
        group.children.push({
          id: `${span.span_id}-fn-${idx}`,
          name: parsed.symbolLabel || parsed.symbol,
          type: parsed.symbolType,
          filePath: parsed.filePath,
          symbol: parsed.symbol,
        })
      }
    })

    // 파일 노드들을 트리에 순서대로 추가
    fileGroupMap.forEach((group, filePath) => {
      if (group.children.length === 0) {
        nodes.push({
          id: `${span.span_id}-file-${filePath}`,
          name: filePath,
          type: 'file',
          filePath,
        })
      } else {
        nodes.push({
          id: `${span.span_id}-file-${filePath}`,
          name: filePath,
          type: 'file',
          filePath,
          children: group.children,
        })
      }
    })

    // LLM 추론 또는 프롬프트 조립 스팬인 경우, 프롬프트 노드 바인딩 보강
    const name = (span.name || '').toLowerCase()
    if (span.span_type === 'llm' || name.startsWith('llm:')) {
      const promptText =
        (span.inputs && (span.inputs.prompt || span.inputs.prompt_snippet || span.inputs.system_prompt || span.inputs.instructions)) ||
        null

      if (promptText) {
        nodes.push({
          id: `${span.span_id}-executed-prompt`,
          name: `실제 모델 전송 Prompt (${String(promptText).length.toLocaleString()} 자)`,
          type: 'prompt',
          directContent: String(promptText),
        })
      } else {
        nodes.push({
          id: `${span.span_id}-prompt-ref`,
          name: 'system_instructions.md (추론 지시문 프롬프트 원본)',
          type: 'prompt',
          filePath: KNOWN_FILE_PATHS['system_instructions.md'],
        })
      }
    } else if (name.includes('prompt') || name.includes('promptassembly')) {
      nodes.push({
        id: `${span.span_id}-prompt-sys`,
        name: 'system_instructions.md (한국형 공문서 표/목차 1-Stage 추출 지침 프롬프트)',
        type: 'prompt',
        filePath: KNOWN_FILE_PATHS['system_instructions.md'],
      })
    }

    if (nodes.length > 0) {
      return nodes
    }
  }

  // 2. dataVia가 없을 경우를 위한 안전 폴백
  const name = span.name.toLowerCase()

  if (name.includes('cache') || name.includes('head')) {
    nodes.push({
      id: `${span.span_id}-cache-file`,
      name: 'apps/api/app/documents/use_cases/extract_outline.py',
      type: 'file',
      filePath: 'apps/api/app/documents/use_cases/extract_outline.py',
      children: [
        {
          id: `${span.span_id}-fn-extract`,
          name: 'extract_outline(doc_id: str, ...)',
          type: 'function',
          filePath: 'apps/api/app/documents/use_cases/extract_outline.py',
          symbol: 'extract_outline',
        },
      ],
    })
    nodes.push({
      id: `${span.span_id}-repo-file`,
      name: 'apps/api/app/documents/adapters/local_document_artifact_repository.py',
      type: 'file',
      filePath: 'apps/api/app/documents/adapters/local_document_artifact_repository.py',
    })
    return nodes
  }

  if (name.includes('policy') || name.includes('routing')) {
    nodes.push({
      id: `${span.span_id}-fallback-file`,
      name: 'apps/api/app/core/llm/fallback.py',
      type: 'file',
      filePath: 'apps/api/app/core/llm/fallback.py',
    })
    nodes.push({
      id: `${span.span_id}-avail-file`,
      name: 'apps/api/app/core/llm/availability.py',
      type: 'file',
      filePath: 'apps/api/app/core/llm/availability.py',
    })
    return nodes
  }

  return nodes
}

export const PipelineTreeView: React.FC<PipelineTreeViewProps> = ({
  span,
  dataIn,
  dataVia,
  isCompareMode = false,
  compareSlotAId,
  compareSlotBId,
  onPickCompareItem,
}) => {
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({})
  const [sources, setSources] = useState<Record<string, SourceCodeResponse>>({})
  const [loadingNodeId, setLoadingNodeId] = useState<string | null>(null)
  const [copiedNodeId, setCopiedNodeId] = useState<string | null>(null)

  const tree = buildTreeForSpan(span, dataVia)
  const isInputPdfOrFile = isFileName(dataIn)

  const toggleNode = async (node: PipelineTreeNode) => {
    const isCurrentlyExpanded = expandedNodes[node.id]

    // 이미 열려있다면 닫기
    if (isCurrentlyExpanded) {
      setExpandedNodes((prev) => ({ ...prev, [node.id]: false }))
      return
    }

    // 자식 노드가 있는 컨테이너 노드(파일/클래스)인 경우 그냥 확장
    if (node.children && node.children.length > 0) {
      setExpandedNodes((prev) => ({ ...prev, [node.id]: true }))
      return
    }

    // 단말 노드(함수/프롬프트)인 경우 소스 코드 가져오기
    if (node.directContent) {
      setExpandedNodes((prev) => ({ ...prev, [node.id]: true }))
      return
    }

    if (node.filePath) {
      if (!sources[node.id]) {
        try {
          setLoadingNodeId(node.id)
          const res = await fetchSourceCode(node.filePath, node.symbol)
          setSources((prev) => ({ ...prev, [node.id]: res }))
        } catch (err) {
          console.error(`Failed to load source for ${node.name}:`, err)
        } finally {
          setLoadingNodeId(null)
        }
      }
      setExpandedNodes((prev) => ({ ...prev, [node.id]: true }))
    }
  }

  const handleCopyCode = (nodeId: string, text: string, e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(text)
    setCopiedNodeId(nodeId)
    setTimeout(() => setCopiedNodeId(null), 2000)
  }

  const renderNode = (node: PipelineTreeNode, depth = 0) => {
    const isExpanded = expandedNodes[node.id]
    const hasChildren = Boolean(node.children && node.children.length > 0)
    const canLoadSource = Boolean(node.filePath || node.directContent)
    const isLeafCode = !hasChildren && canLoadSource
    const isLoading = loadingNodeId === node.id
    const sourceData = sources[node.id]
    const contentToShow = node.directContent || sourceData?.content

    const getIcon = () => {
      switch (node.type) {
        case 'file':
          return <FileCode className="w-3.5 h-3.5 text-[#58a6ff] shrink-0" />
        case 'class':
          return <Package className="w-3.5 h-3.5 text-[#bc8cff] shrink-0" />
        case 'function':
          return <Zap className="w-3.5 h-3.5 text-[#d29922] shrink-0" />
        case 'prompt':
          return <Sparkles className="w-3.5 h-3.5 text-[#3fb950] shrink-0" />
        default:
          return <Code2 className="w-3.5 h-3.5 text-[#848d97] shrink-0" />
      }
    }

    return (
      <div key={node.id} className="flex flex-col">
        {/* 노드 헤더 행 */}
        <div
          onClick={() => toggleNode(node)}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
          className={`flex items-center justify-between py-1.5 pr-2 rounded-md transition-colors cursor-pointer select-none group ${
            isExpanded
              ? 'bg-[#21262d] text-[#e6edf3]'
              : 'hover:bg-[#21262d]/60 text-[#848d97]'
          }`}
        >
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {hasChildren || isLeafCode ? (
              <span className="text-[#848d97] group-hover:text-[#e6edf3] transition-colors">
                {isExpanded ? (
                  <ChevronDown className="w-3.5 h-3.5" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5" />
                )}
              </span>
            ) : (
              <span className="w-3.5 h-3.5" />
            )}

            {getIcon()}

            <span
              className={`font-mono text-xs truncate ${
                node.type === 'file'
                  ? 'text-[#58a6ff] font-semibold'
                  : node.type === 'class'
                  ? 'text-[#bc8cff] font-medium'
                  : node.type === 'prompt'
                  ? 'text-[#3fb950] font-semibold'
                  : 'text-[#e6edf3]'
              }`}
            >
              {node.name}
            </span>

            {node.type === 'prompt' && (
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#238636]/20 text-[#3fb950] border border-[#238636]/40 font-mono">
                PROMPT
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isLoading && (
              <Loader2 className="w-3.5 h-3.5 text-[#58a6ff] animate-spin" />
            )}
            {isLeafCode && !isLoading && (
              <span className="text-[10px] text-[#848d97] font-sans opacity-70 group-hover:opacity-100 transition-opacity">
                {isExpanded ? '코드 접기' : '코드 펼치기'}
              </span>
            )}
          </div>
        </div>

        {/* 자식 노드 재귀 렌더링 */}
        {hasChildren && isExpanded && (
          <div className="flex flex-col border-l border-[#30363d] ml-3 my-0.5">
            {node.children!.map((child) => renderNode(child, depth + 1))}
          </div>
        )}

        {/* 원본 소스 코드 / 프롬프트 아코디언 펼침 화면 */}
        {isLeafCode && isExpanded && (
          <div
            style={{ marginLeft: `${depth * 16 + 12}px` }}
            className="my-1.5 mr-2 rounded-md border border-[#30363d] bg-[#0d1117] overflow-hidden shadow-sm"
          >
            {/* 코드 뷰어 상단 메타 바 (GitHub Blob Header 스타일) */}
            <div className="flex items-center justify-between px-3 py-1.5 bg-[#161b22] border-b border-[#30363d] text-[11px] font-mono text-[#848d97]">
              <div className="flex items-center gap-2 min-w-0">
                <Terminal className="w-3.5 h-3.5 text-[#58a6ff] shrink-0" />
                <span className="text-[#e6edf3] font-semibold truncate max-w-[240px]">
                  {sourceData?.file_path || node.filePath || 'Inline Prompt'}
                </span>
                {sourceData && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#21262d] border border-[#30363d] text-[#848d97]">
                    Line {sourceData.start_line} - {sourceData.end_line}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {isCompareMode && contentToShow && (
                  <div>
                    {compareSlotAId === `code:${node.id}` ? (
                      <span className="px-1.5 py-0.5 rounded bg-[#f85149]/20 text-[#f85149] border border-[#f85149]/40 text-[9px] font-mono font-bold">
                        🅰️ 픽됨
                      </span>
                    ) : compareSlotBId === `code:${node.id}` ? (
                      <span className="px-1.5 py-0.5 rounded bg-[#238636]/20 text-[#3fb950] border border-[#238636]/40 text-[9px] font-mono font-bold">
                        🅱️ 픽됨
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          onPickCompareItem?.({
                            id: `code:${node.id}`,
                            type: 'code',
                            title: `[Code] ${node.name}`,
                            subtitle: sourceData?.file_path || node.filePath || 'Inline Prompt',
                            content: contentToShow,
                            language:
                              sourceData?.language === 'markdown' || node.type === 'prompt'
                                ? 'markdown'
                                : sourceData?.language === 'json'
                                ? 'json'
                                : 'python',
                            spanId: span.span_id,
                          })
                        }}
                        className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#21262d] text-[#c9d1d9] border border-[#30363d] hover:bg-[#30363d] hover:text-[#e6edf3] transition-colors cursor-pointer"
                        title="이 소스코드를 Compare 슬롯에 추가"
                      >
                        + Compare
                      </button>
                    )}
                  </div>
                )}

                {contentToShow && (
                  <button
                    type="button"
                    onClick={(e) => handleCopyCode(node.id, contentToShow, e)}
                    className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] border border-[#30363d] transition-colors cursor-pointer"
                    title="코드 복사"
                  >
                    {copiedNodeId === node.id ? (
                      <>
                        <Check className="w-3 h-3 text-[#3fb950]" />
                        <span className="text-[#3fb950]">복사됨</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 text-[#848d97]" />
                        <span>복사</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* 코드 본문 */}
            <div className="bg-[#0d1117] text-xs">
              {contentToShow ? (
                <CodeMirror
                  value={contentToShow}
                  height="260px"
                  theme={oneDark}
                  extensions={
                    (sourceData?.language === 'markdown' || node.type === 'prompt')
                      ? [markdown()]
                      : sourceData?.language === 'json'
                      ? [json()]
                      : []
                  }
                  editable={false}
                  readOnly={true}
                  basicSetup={{
                    lineNumbers: true,
                    foldGutter: true,
                    highlightActiveLineGutter: false,
                    highlightActiveLine: false,
                    searchKeymap: true,
                  }}
                />
              ) : (
                <div className="p-3 text-[#848d97] italic">
                  코드를 불러오는 중이거나 코드가 비어 있습니다.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="mt-2.5 p-3 rounded-md bg-[#161b22] border border-[#30363d] flex flex-col gap-2.5">
      {/* 1. 입력이 파일(PDF 등)인 경우 */}
      {isInputPdfOrFile && dataIn && (
        <div className="flex items-center gap-2 py-1.5 px-3 rounded-md bg-[#0d1117] border border-[#30363d] text-xs">
          <FileText className="w-4 h-4 text-[#58a6ff] shrink-0" />
          <span className="text-[11px] font-semibold text-[#848d97]">입력 문서 (원본):</span>
          <span className="font-mono text-xs text-[#58a6ff] font-semibold truncate" title={dataIn}>
            {dataIn}
          </span>
          <span className="ml-auto text-[10px] text-[#848d97] font-sans">
            (바이너리 파일 입력)
          </span>
        </div>
      )}

      {/* 2. 관여 파일, 클래스, 함수 & 프롬프트 트리 뷰 */}
      <div className="flex flex-col gap-0.5">
        <div className="flex items-center gap-1.5 px-1 pb-1.5 text-[11px] font-semibold text-[#e6edf3] border-b border-[#30363d] mb-1">
          <Folder className="w-3.5 h-3.5 text-[#58a6ff]" />
          <span>파이프라인 심볼 & 코드 구현 트리</span>
          <span className="text-[10px] font-normal text-[#848d97] ml-auto">
            (노드를 클릭하여 구현 코드와 프롬프트 확인)
          </span>
        </div>

        {tree.length > 0 ? (
          tree.map((node) => renderNode(node, 0))
        ) : (
          <div className="text-xs text-[#848d97] p-2 italic">
            연결된 코드 심볼 정보가 없습니다.
          </div>
        )}
      </div>
    </div>
  )
}
