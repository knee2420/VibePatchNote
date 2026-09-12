/**
 * @fileoverview Inspector PipelineTreeView 컴포넌트
 *
 * 스팬이 거쳐 간 코드 지점을 트리로 보여주고, 실제 구현을 가상화 뷰어로 연다.
 *
 * ## 하드코딩 표가 사라진 이유
 *
 * 예전에는 백엔드가 `data_via` 에 손으로 쓴 문자열을 실었고
 * (`"context_builder.py (DocumentContextBuilder.build_context)"`), 이 컴포넌트가
 * 그것을 정규식으로 되파싱한 뒤 `KNOWN_FILE_PATHS` 하드코딩 표에서 실제 경로를
 * 찾았다. 표가 틀리면 조용히 엉뚱한 파일이 열렸다 — `schema.py` 항목이 틀려서
 * 모든 run 의 검증 스팬이 venv 의 `pydantic/v1/schema.py` 를 보여주고 있었다.
 *
 * 이제 백엔드가 `sources: SpanSource[]` 로 **import 가능한 이름**을 준다.
 * 프론트는 경로를 모르고, 알 필요도 없다.
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
import type { CompareItem, SourceCodeResponse, SpanRecordView, SpanSource } from '../types'
import { textOf } from '../lib/payload'
import { isFileName } from '../lib/dataFlow'

interface PipelineTreeViewProps {
  readonly span: SpanRecordView
  readonly dataIn: string | null
  readonly dataOut: string | null
  readonly dataVia: readonly string[]
  readonly isCompareMode?: boolean
  readonly compareSlotAId?: string | null
  readonly compareSlotBId?: string | null
  readonly onPickCompareItem?: (item: CompareItem) => void
}

type NodeKind = 'module' | 'symbol' | 'prompt' | 'model' | 'legacy'

export interface PipelineTreeNode {
  readonly id: string
  readonly name: string
  readonly type: NodeKind
  /** import 가능한 모듈 이름. 있으면 소스를 열 수 있다. */
  readonly module?: string
  /** 모듈 안의 한정 이름. */
  readonly qualname?: string
  /** 조회 없이 바로 보여줄 내용 (프롬프트·모델 사양 등). */
  readonly directContent?: string
  readonly children?: readonly PipelineTreeNode[]
}

/** `scaffold_engine.outline.pipeline` → `pipeline` */
function moduleTail(module: string): string {
  const parts = module.split('.')
  return parts[parts.length - 1] || module
}

function sourceLabel(source: SpanSource): string {
  if (source.label) return source.label
  if (source.kind === 'model') return source.qualname
  return source.qualname || moduleTail(source.module)
}

/**
 * 스팬의 구조화된 `sources` 로 트리를 만든다.
 *
 * 같은 모듈의 심볼은 한 모듈 노드 아래로 묶인다. 모델은 코드가 아니므로
 * 별도 노드로 둔다 — 예전에는 `"Model: ..."` 라는 문자열을 섞어 넣고 소비자가
 * 접두어로 구분했고, 접두어가 바뀌자 파서가 그걸 파일명으로 오인했다.
 */
function buildTreeForSpan(
  span: SpanRecordView,
  legacyVia: readonly string[]
): PipelineTreeNode[] {
  const nodes: PipelineTreeNode[] = []
  const sources = span.sources ?? []

  const byModule = new Map<string, PipelineTreeNode[]>()

  sources.forEach((source, index) => {
    if (source.kind === 'model') {
      nodes.push({
        id: `${span.span_id}-model-${index}`,
        name: `Model: ${sourceLabel(source)}`,
        type: 'model',
        directContent: describeModel(span, source),
      })
      return
    }

    if (!source.module) return

    const children = byModule.get(source.module) ?? []
    if (source.qualname) {
      children.push({
        id: `${span.span_id}-sym-${index}`,
        name: source.lineno > 0 ? `${source.qualname}  ·  L${source.lineno}` : source.qualname,
        type: 'symbol',
        module: source.module,
        qualname: source.qualname,
      })
    }
    byModule.set(source.module, children)
  })

  byModule.forEach((children, module) => {
    nodes.push({
      id: `${span.span_id}-mod-${module}`,
      name: module,
      type: 'module',
      module,
      children: children.length > 0 ? children : undefined,
    })
  })

  // LLM 스팬이면 실제 전송된 프롬프트를 함께 보여준다.
  const isLlm = span.span_type === 'llm' || span.name.toLowerCase().startsWith('llm:')
  if (isLlm) {
    const promptText = textOf(
      span.inputs,
      'prompt',
      'prompt_snippet',
      'system_prompt',
      'instructions'
    )
    if (promptText) {
      nodes.push({
        id: `${span.span_id}-prompt`,
        name: `실제 모델 전송 Prompt (${promptText.length.toLocaleString()} 자)`,
        type: 'prompt',
        directContent: promptText,
      })
    }
  }

  // 구조화 이전에 기록된 run. 문자열밖에 없으므로 이름만 보여준다.
  // 경로를 추측해서 열지 않는다 — 그렇게 하다가 남의 파일을 열었다.
  if (nodes.length === 0 && legacyVia.length > 0) {
    legacyVia.forEach((item, index) => {
      nodes.push({
        id: `${span.span_id}-legacy-${index}`,
        name: item,
        type: 'legacy',
      })
    })
  }

  return nodes
}

function describeModel(span: SpanRecordView, source: SpanSource): string {
  const usage = span.usage
  return [
    '[LLM Engine]',
    `Model    : ${sourceLabel(source)}`,
    `Span     : ${span.name}`,
    `Duration : ${(span.duration_ms || 0).toFixed(1)} ms`,
    `Tokens   : prompt ${usage?.prompt_tokens ?? 0} · completion ${usage?.completion_tokens ?? 0}` +
      ` · cache ${usage?.cache_read_tokens ?? 0} · total ${usage?.total_tokens ?? 0}`,
  ].join('\n')
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

    if (node.module) {
      if (!sources[node.id]) {
        try {
          setLoadingNodeId(node.id)
          const res = await fetchSourceCode({ module: node.module, symbol: node.qualname })
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
    const canLoadSource = Boolean(node.module || node.directContent)
    const isLeafCode = !hasChildren && canLoadSource
    const isLoading = loadingNodeId === node.id
    const sourceData = sources[node.id]
    const contentToShow = node.directContent || sourceData?.content

    const getIcon = () => {
      switch (node.type) {
        case 'module':
          return <FileCode className="w-3.5 h-3.5 text-[#58a6ff] shrink-0" />
        case 'symbol':
          return <Zap className="w-3.5 h-3.5 text-[#d29922] shrink-0" />
        case 'model':
          return <Package className="w-3.5 h-3.5 text-[#bc8cff] shrink-0" />
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
                node.type === 'module'
                  ? 'text-[#58a6ff] font-semibold'
                  : node.type === 'model'
                  ? 'text-[#bc8cff] font-medium'
                  : node.type === 'prompt'
                  ? 'text-[#3fb950] font-semibold'
                  : node.type === 'legacy'
                  ? 'text-[#848d97] italic'
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
                  {sourceData?.file_path || node.module || 'Inline'}
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
                            subtitle: sourceData?.file_path || node.module || 'Inline',
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
