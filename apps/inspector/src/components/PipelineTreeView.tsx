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
import { fetchSourceCode } from '../api'
import type { SourceCodeResponse, SpanRecord } from '../types'

interface PipelineTreeViewProps {
  span: SpanRecord
  dataIn: string | null
  dataOut: string | null
  dataVia: string[]
}

export interface PipelineTreeNode {
  id: string
  name: string
  type: 'file' | 'class' | 'function' | 'prompt'
  filePath?: string
  symbol?: string
  directContent?: string // 스팬 자체에 있는 프롬프트 텍스트 등
  children?: PipelineTreeNode[]
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

/**
 * 스팬의 특성과 data_via를 바탕으로 체계적인 계층형 트리를 도출합니다.
 */
function buildTreeForSpan(
  span: SpanRecord,
  dataVia: string[]
): PipelineTreeNode[] {
  const name = span.name.toLowerCase()
  const nodes: PipelineTreeNode[] = []

  // 1. 캐시 & HEAD 검사
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
    return nodes
  }

  // 2. 하네스 정책 & 라우팅 검사
  if (name.includes('policy') || name.includes('routing')) {
    nodes.push({
      id: `${span.span_id}-fallback-file`,
      name: 'apps/api/app/core/llm/fallback.py',
      type: 'file',
      filePath: 'apps/api/app/core/llm/fallback.py',
      children: [
        {
          id: `${span.span_id}-cls-harness`,
          name: 'class FallbackLlmHarness',
          type: 'class',
          filePath: 'apps/api/app/core/llm/fallback.py',
          symbol: 'FallbackLlmHarness',
          children: [
            {
              id: `${span.span_id}-fn-resolve`,
              name: 'def _resolve_chain(...)',
              type: 'function',
              filePath: 'apps/api/app/core/llm/fallback.py',
              symbol: 'FallbackLlmHarness._resolve_chain',
            },
            {
              id: `${span.span_id}-fn-select`,
              name: 'def select_provider(...)',
              type: 'function',
              filePath: 'apps/api/app/core/llm/fallback.py',
              symbol: 'FallbackLlmHarness.select_provider',
            },
          ],
        },
      ],
    })
    nodes.push({
      id: `${span.span_id}-policy-file`,
      name: 'apps/api/app/core/llm/runtime_policy.py',
      type: 'file',
      filePath: 'apps/api/app/core/llm/runtime_policy.py',
      children: [
        {
          id: `${span.span_id}-cls-policy`,
          name: 'class EngineRoutingSettings',
          type: 'class',
          filePath: 'apps/api/app/core/llm/runtime_policy.py',
          symbol: 'EngineRoutingSettings',
        },
      ],
    })
    return nodes
  }

  // 3. DocumentContextBuilder (문서 컨텍스트 추출)
  if (name.includes('context') || name.includes('documentcontextbuilder')) {
    nodes.push({
      id: `${span.span_id}-ctx-file`,
      name: 'packages/scaffold-engine/scaffold_engine/outline/prompts/context_builder.py',
      type: 'file',
      filePath: 'packages/scaffold-engine/scaffold_engine/outline/prompts/context_builder.py',
      children: [
        {
          id: `${span.span_id}-cls-builder`,
          name: 'class DocumentContextBuilder',
          type: 'class',
          filePath: 'packages/scaffold-engine/scaffold_engine/outline/prompts/context_builder.py',
          symbol: 'DocumentContextBuilder',
          children: [
            {
              id: `${span.span_id}-fn-build`,
              name: 'def build_context(pdf_path: Path, output_dir: Optional[Path]) -> Dict',
              type: 'function',
              filePath: 'packages/scaffold-engine/scaffold_engine/outline/prompts/context_builder.py',
              symbol: 'DocumentContextBuilder.build_context',
            },
          ],
        },
      ],
    })
    return nodes
  }

  // 4. PromptAssembly (프롬프트 조립 & 지시문 템플릿)
  if (name.includes('promptassembly') || name.includes('prompt')) {
    nodes.push({
      id: `${span.span_id}-pipe-file`,
      name: 'packages/scaffold-engine/scaffold_engine/outline/pipeline.py',
      type: 'file',
      filePath: 'packages/scaffold-engine/scaffold_engine/outline/pipeline.py',
      children: [
        {
          id: `${span.span_id}-cls-pipeline`,
          name: 'class OutlinePipeline',
          type: 'class',
          filePath: 'packages/scaffold-engine/scaffold_engine/outline/pipeline.py',
          symbol: 'OutlinePipeline',
          children: [
            {
              id: `${span.span_id}-fn-pipe-exec`,
              name: 'def execute(context: OutlinePipelineContext) -> OutlinePipelineResult',
              type: 'function',
              filePath: 'packages/scaffold-engine/scaffold_engine/outline/pipeline.py',
              symbol: 'OutlinePipeline.execute',
            },
          ],
        },
      ],
    })
    nodes.push({
      id: `${span.span_id}-prompt-sys`,
      name: 'system_instructions.md (한국형 공문서 표/목차 1-Stage 추출 지침 프롬프트)',
      type: 'prompt',
      filePath: 'packages/scaffold-engine/scaffold_engine/outline/prompts/system_instructions.md',
    })
    return nodes
  }

  // 5. LLM Inference (모델 핵심 추론)
  if (span.span_type === 'llm' || name.startsWith('llm:')) {
    nodes.push({
      id: `${span.span_id}-llm-harness`,
      name: 'apps/api/app/core/llm/fallback.py',
      type: 'file',
      filePath: 'apps/api/app/core/llm/fallback.py',
      children: [
        {
          id: `${span.span_id}-fn-harness-run`,
          name: 'def run_structured(prompt: str, schema: Type[BaseModel])',
          type: 'function',
          filePath: 'apps/api/app/core/llm/fallback.py',
          symbol: 'FallbackLlmHarness.run_structured',
        },
      ],
    })
    nodes.push({
      id: `${span.span_id}-llm-adapter`,
      name: 'apps/api/app/core/llm/adapters/google_adapter.py',
      type: 'file',
      filePath: 'apps/api/app/core/llm/adapters/google_adapter.py',
      children: [
        {
          id: `${span.span_id}-fn-adapter-gen`,
          name: 'def generate_structured(prompt, schema, model_name)',
          type: 'function',
          filePath: 'apps/api/app/core/llm/adapters/google_adapter.py',
          symbol: 'GoogleLlmAdapter.generate_structured',
        },
      ],
    })

    // 스팬의 입력 프롬프트가 존재하면 프롬프트 노드 바인딩
    const promptText =
      (span.inputs && (span.inputs.prompt || span.inputs.system_prompt || span.inputs.instructions)) ||
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
        filePath: 'packages/scaffold-engine/scaffold_engine/outline/prompts/system_instructions.md',
      })
    }
    return nodes
  }

  // 6. 스키마 검증
  if (name.includes('validation') || name.includes('schema')) {
    nodes.push({
      id: `${span.span_id}-schema-file`,
      name: 'packages/scaffold-engine/scaffold_engine/outline/schema.py',
      type: 'file',
      filePath: 'packages/scaffold-engine/scaffold_engine/outline/schema.py',
      children: [
        {
          id: `${span.span_id}-cls-outlineoutput`,
          name: 'class OutlineOutput(BaseModel)',
          type: 'class',
          filePath: 'packages/scaffold-engine/scaffold_engine/outline/schema.py',
          symbol: 'OutlineOutput',
        },
        {
          id: `${span.span_id}-cls-outlineitem`,
          name: 'class OutlineItem(BaseModel)',
          type: 'class',
          filePath: 'packages/scaffold-engine/scaffold_engine/outline/schema.py',
          symbol: 'OutlineItem',
        },
      ],
    })
    nodes.push({
      id: `${span.span_id}-models-file`,
      name: 'packages/scaffold-engine/scaffold_engine/outline/models.py',
      type: 'file',
      filePath: 'packages/scaffold-engine/scaffold_engine/outline/models.py',
      children: [
        {
          id: `${span.span_id}-cls-outlinedoc`,
          name: 'class OutlineDocument',
          type: 'class',
          filePath: 'packages/scaffold-engine/scaffold_engine/outline/models.py',
          symbol: 'OutlineDocument',
          children: [
            {
              id: `${span.span_id}-fn-from-output`,
              name: 'def from_outline_output(output: OutlineOutput) -> OutlineDocument',
              type: 'function',
              filePath: 'packages/scaffold-engine/scaffold_engine/outline/models.py',
              symbol: 'OutlineDocument.from_outline_output',
            },
          ],
        },
      ],
    })
    return nodes
  }

  // 7. 아티팩트 커밋
  if (name.includes('commit') || name.includes('artifact')) {
    nodes.push({
      id: `${span.span_id}-commit-case`,
      name: 'apps/api/app/documents/use_cases/extract_outline.py',
      type: 'file',
      filePath: 'apps/api/app/documents/use_cases/extract_outline.py',
      children: [
        {
          id: `${span.span_id}-fn-commit`,
          name: 'def extract_outline (Artifact Persistence)',
          type: 'function',
          filePath: 'apps/api/app/documents/use_cases/extract_outline.py',
          symbol: 'extract_outline',
        },
      ],
    })
    nodes.push({
      id: `${span.span_id}-repo-file`,
      name: 'apps/api/app/scaffolds/adapters/local_artifact_repository.py',
      type: 'file',
      filePath: 'apps/api/app/scaffolds/adapters/local_artifact_repository.py',
      children: [
        {
          id: `${span.span_id}-cls-repo`,
          name: 'class LocalArtifactRepository',
          type: 'class',
          filePath: 'apps/api/app/scaffolds/adapters/local_artifact_repository.py',
          symbol: 'LocalArtifactRepository',
          children: [
            {
              id: `${span.span_id}-fn-save-art`,
              name: 'def save_artifact(self, artifact_id, data)',
              type: 'function',
              filePath: 'apps/api/app/scaffolds/adapters/local_artifact_repository.py',
              symbol: 'LocalArtifactRepository.save_artifact',
            },
          ],
        },
      ],
    })
    return nodes
  }

  // 8. 정산 및 마감
  if (name.includes('settlement') || name.includes('cost')) {
    nodes.push({
      id: `${span.span_id}-runtime-file`,
      name: 'apps/api/app/core/agent_runtime/runtime.py',
      type: 'file',
      filePath: 'apps/api/app/core/agent_runtime/runtime.py',
      children: [
        {
          id: `${span.span_id}-cls-runtime`,
          name: 'class AgentRuntime',
          type: 'class',
          filePath: 'apps/api/app/core/agent_runtime/runtime.py',
          symbol: 'AgentRuntime',
          children: [
            {
              id: `${span.span_id}-fn-settle`,
              name: 'def settle_run(self, run_id: str, ...)',
              type: 'function',
              filePath: 'apps/api/app/core/agent_runtime/runtime.py',
              symbol: 'AgentRuntime.settle_run',
            },
          ],
        },
      ],
    })
    nodes.push({
      id: `${span.span_id}-tracer-file`,
      name: 'apps/api/app/core/llm/tracer.py',
      type: 'file',
      filePath: 'apps/api/app/core/llm/tracer.py',
      children: [
        {
          id: `${span.span_id}-fn-tracer-ingest`,
          name: 'def ingest_pipeline_telemetry(run_id, steps)',
          type: 'function',
          filePath: 'apps/api/app/core/llm/tracer.py',
          symbol: 'ingest_pipeline_telemetry',
        },
      ],
    })
    return nodes
  }

  // 9. data_via 기반 동적 트리 폴백
  if (dataVia && dataVia.length > 0) {
    dataVia.forEach((viaItem, idx) => {
      nodes.push({
        id: `${span.span_id}-dynamic-via-${idx}`,
        name: viaItem,
        type: 'function',
        filePath: viaItem.split(' ')[0],
      })
    })
  }

  return nodes
}

export const PipelineTreeView: React.FC<PipelineTreeViewProps> = ({
  span,
  dataIn,
  dataVia,
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
          return <FileCode className="w-3.5 h-3.5 text-blue-400 shrink-0" />
        case 'class':
          return <Package className="w-3.5 h-3.5 text-purple-400 shrink-0" />
        case 'function':
          return <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
        case 'prompt':
          return <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
        default:
          return <Code2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
      }
    }

    return (
      <div key={node.id} className="flex flex-col">
        {/* 노드 헤더 행 */}
        <div
          onClick={() => toggleNode(node)}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
          className={`flex items-center justify-between py-1.5 pr-2 rounded-md transition-all cursor-pointer select-none group ${
            isExpanded
              ? 'bg-slate-800/90 text-slate-100'
              : 'hover:bg-slate-850/80 text-slate-300'
          }`}
        >
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {hasChildren || isLeafCode ? (
              <span className="text-slate-500 group-hover:text-slate-300 transition-colors">
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
                  ? 'text-blue-300 font-semibold'
                  : node.type === 'class'
                  ? 'text-purple-300 font-medium'
                  : node.type === 'prompt'
                  ? 'text-emerald-300 font-semibold'
                  : 'text-amber-200'
              }`}
            >
              {node.name}
            </span>

            {node.type === 'prompt' && (
              <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-sans">
                PROMPT
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isLoading && (
              <Loader2 className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
            )}
            {isLeafCode && !isLoading && (
              <span className="text-[10px] text-slate-500 font-sans opacity-70 group-hover:opacity-100 transition-opacity">
                {isExpanded ? '코드 접기' : '코드 펼치기'}
              </span>
            )}
          </div>
        </div>

        {/* 자식 노드 재귀 렌더링 */}
        {hasChildren && isExpanded && (
          <div className="flex flex-col border-l border-slate-800/80 ml-3 my-0.5">
            {node.children!.map((child) => renderNode(child, depth + 1))}
          </div>
        )}

        {/* 원본 소스 코드 / 프롬프트 아코디언 펼침 화면 */}
        {isLeafCode && isExpanded && (
          <div
            style={{ marginLeft: `${depth * 16 + 12}px` }}
            className="my-1.5 mr-2 rounded-lg border border-slate-800 bg-[#050811] overflow-hidden shadow-2xl"
          >
            {/* 코드 뷰어 상단 메타 바 */}
            <div className="flex items-center justify-between px-3 py-1.5 bg-[#0e1424] border-b border-slate-800/90 text-[11px] font-mono text-slate-400">
              <div className="flex items-center gap-2 min-w-0">
                <Terminal className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span className="text-slate-300 truncate max-w-[240px]">
                  {sourceData?.file_path || node.filePath || 'Inline Prompt'}
                </span>
                {sourceData && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-950/80 border border-cyan-800/60 text-cyan-300">
                    Line {sourceData.start_line} - {sourceData.end_line}
                  </span>
                )}
              </div>

              {contentToShow && (
                <button
                  type="button"
                  onClick={(e) => handleCopyCode(node.id, contentToShow, e)}
                  className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/80 transition-colors cursor-pointer"
                  title="코드 복사"
                >
                  {copiedNodeId === node.id ? (
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
              )}
            </div>

            {/* 코드 본문 */}
            <div className="p-3 max-h-80 overflow-auto bg-[#070b14] text-xs font-mono text-slate-200 leading-relaxed whitespace-pre selection:bg-cyan-900 selection:text-cyan-100">
              {contentToShow || (
                <span className="text-slate-500 italic">코드를 불러오는 중이거나 코드가 비어 있습니다.</span>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="mt-2.5 p-2.5 rounded-lg bg-[#080d19]/90 border border-slate-800/90 flex flex-col gap-2">
      {/* 1. 입력이 파일(PDF 등)인 경우: "만약 'pdf', 이거나 파일 형식의 input 이라면 그냥 파일명만 남겨놔" */}
      {isInputPdfOrFile && dataIn && (
        <div className="flex items-center gap-2 py-1.5 px-2.5 rounded-md bg-sky-950/50 border border-sky-800/60 text-xs">
          <FileText className="w-4 h-4 text-sky-400 shrink-0" />
          <span className="text-[11px] font-semibold text-slate-400">입력 문서 (원본):</span>
          <span className="font-mono text-xs text-sky-300 font-semibold truncate" title={dataIn}>
            {dataIn}
          </span>
          <span className="ml-auto text-[10px] text-slate-500 font-sans">
            (바이너리 파일 입력)
          </span>
        </div>
      )}

      {/* 2. 관여 파일, 클래스, 함수 & 프롬프트 트리 뷰 */}
      <div className="flex flex-col gap-0.5">
        <div className="flex items-center gap-1.5 px-1 pb-1 text-[11px] font-semibold text-slate-400 border-b border-slate-800/60 mb-1">
          <Folder className="w-3.5 h-3.5 text-cyan-400" />
          <span>파이프라인 심볼 & 코드 구현 트리</span>
          <span className="text-[10px] font-normal text-slate-500 ml-auto">
            (노드를 클릭하여 구현 코드와 프롬프트 확인)
          </span>
        </div>

        {tree.length > 0 ? (
          tree.map((node) => renderNode(node, 0))
        ) : (
          <div className="text-xs text-slate-500 p-2 italic">
            연결된 코드 심볼 정보가 없습니다.
          </div>
        )}
      </div>
    </div>
  )
}
