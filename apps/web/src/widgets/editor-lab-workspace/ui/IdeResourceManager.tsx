import { useState, useMemo, useRef, useCallback } from 'react';
import {
  FolderKanban,
  FolderTree,
  FolderPlus,
  RefreshCw,
  X,
  Search,
  FileCode,
  FileText,
  Image as ImageIcon,
  Boxes,
  Code2,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  GripVertical,
  Trash2,
  Folder,
  FolderOpen,
  Clock,
  LayoutGrid,
  File,
} from 'lucide-react';
import type {
  DirectoryBundle,
  ResourceItem,
  ResourceViewMode,
} from '../model/types';

export interface IdeResourceManagerProps {
  bundles: DirectoryBundle[];
  resources: ResourceItem[];
  viewMode: ResourceViewMode;
  onChangeViewMode: (mode: ResourceViewMode) => void;
  searchQuery: string;
  onChangeSearchQuery: (query: string) => void;
  onOpenResource: (resource: ResourceItem, targetPane?: 'pane1' | 'pane2') => void;
  onClose: () => void;
  onAddBundle?: (newBundle: DirectoryBundle) => void;
  onRemoveBundle?: (bundleId: string) => void;
  onToggleBundleCollapse?: (bundleId: string) => void;
  onAddResources?: (newItems: ResourceItem[], bundleName?: string) => void;
  onDisconnectFolder?: () => void;
  linkedFolderName?: string | null;
}

// 트리 노드 모델
interface TreeNode {
  name: string;
  fullPath: string;
  isFolder: boolean;
  children: Record<string, TreeNode>;
  resource?: ResourceItem;
}

export function IdeResourceManager({
  bundles,
  resources,
  viewMode,
  onChangeViewMode,
  searchQuery,
  onChangeSearchQuery,
  onOpenResource,
  onClose,
  onAddBundle,
  onRemoveBundle,
  onToggleBundleCollapse,
  onAddResources,
}: IdeResourceManagerProps) {
  // 내부 폴더 접힘 상태 (key: fullPath)
  const [collapsedFolderPaths, setCollapsedFolderPaths] = useState<Record<string, boolean>>({});
  // 캔바 요소 뷰에서 디렉토리별 "모두 보기" 확장 상태 (key: bundleId)
  const [expandedBundleIds, setExpandedBundleIds] = useState<Record<string, boolean>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 총 파일 개수
  const totalCount = resources.length;

  // 검색어로 필터링된 전체 리소스 목록
  const filteredResources = useMemo(() => {
    if (!searchQuery.trim()) return resources;
    const q = searchQuery.toLowerCase();
    return resources.filter((res) => {
      return (
        res.name.toLowerCase().includes(q) ||
        res.path.toLowerCase().includes(q) ||
        res.pipelineSource.toLowerCase().includes(q) ||
        (res.description && res.description.toLowerCase().includes(q)) ||
        (res.bundleName && res.bundleName.toLowerCase().includes(q))
      );
    });
  }, [resources, searchQuery]);

  // 검색어로 필터링된 디렉토리 묶음 목록
  const filteredBundles = useMemo(() => {
    if (!searchQuery.trim()) return bundles;
    const q = searchQuery.toLowerCase();
    return bundles
      .map((bundle) => {
        const matchingItems = bundle.items.filter((res) => {
          return (
            res.name.toLowerCase().includes(q) ||
            res.path.toLowerCase().includes(q) ||
            res.pipelineSource.toLowerCase().includes(q) ||
            (res.description && res.description.toLowerCase().includes(q)) ||
            bundle.name.toLowerCase().includes(q)
          );
        });
        return {
          ...bundle,
          items: matchingItems,
        };
      })
      .filter((bundle) => bundle.items.length > 0);
  }, [bundles, searchQuery]);

  // 포맷별 아이콘 헬퍼
  const renderFormatIcon = (format: string) => {
    const f = format.toLowerCase();
    switch (f) {
      case 'json':
        return <FileCode className="w-3.5 h-3.5 text-amber-400 shrink-0" />;
      case 'md':
      case 'markdown':
      case 'txt':
        return <FileText className="w-3.5 h-3.5 text-sky-400 shrink-0" />;
      case 'svg':
      case 'png':
      case 'jpg':
      case 'webp':
        return <ImageIcon className="w-3.5 h-3.5 text-purple-400 shrink-0" />;
      case 'ts':
      case 'tsx':
      case 'js':
      case 'jsx':
        return <Code2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />;
      case 'html':
        return <FileCode className="w-3.5 h-3.5 text-orange-400 shrink-0" />;
      case 'hwp':
        return <FileText className="w-3.5 h-3.5 text-rose-400 shrink-0" />;
      case 'pdf':
        return <File className="w-3.5 h-3.5 text-red-400 shrink-0" />;
      default:
        return <FileCode className="w-3.5 h-3.5 text-slate-400 shrink-0" />;
    }
  };

  // 폴더 토글 핸들러
  const toggleFolder = useCallback((path: string) => {
    setCollapsedFolderPaths((prev) => ({
      ...prev,
      [path]: !prev[path],
    }));
  }, []);

  // 로컬 파일 디렉토리 연결 처리기
  const handleConnectDirectory = async () => {
    if ('showDirectoryPicker' in window) {
      try {
        // @ts-expect-error - File System Access API
        const dirHandle = await window.showDirectoryPicker({ mode: 'read' });
        const loadedItems: ResourceItem[] = [];
        const dirName = dirHandle.name;
        const bundleId = `bundle-local-${Date.now()}`;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const traverseDirectory = async (handle: any, currentPath: string) => {
          for await (const entry of handle.values()) {
            if (entry.kind === 'file') {
              const file = await entry.getFile();
              const ext = file.name.split('.').pop() || 'txt';
              const fullFilePath = `${currentPath}/${file.name}`;
              let content = '';
              let thumbnailUrl: string | undefined = undefined;

              const isImage =
                file.type.startsWith('image/') ||
                ['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(ext.toLowerCase());
              if (isImage) {
                thumbnailUrl = URL.createObjectURL(file);
              }

              if (file.size < 200 * 1024) {
                try {
                  content = await file.text();
                } catch {
                  content = `// [바이너리 또는 비텍스트 파일: ${file.name}]`;
                }
              }

              const sizeStr =
                file.size < 1024
                  ? `${file.size} B`
                  : `${(file.size / 1024).toFixed(1)} KB`;

              loadedItems.push({
                id: `local-${Math.random().toString(36).substring(2, 9)}`,
                name: file.name,
                category: 'linked',
                pipelineSource: dirName,
                format: ext,
                size: sizeStr,
                updatedAt: '방금 전',
                description: `연결된 로컬 파일: ${fullFilePath}`,
                path: fullFilePath,
                content,
                isLocal: true,
                bundleId,
                bundleName: dirName,
                thumbnailUrl,
              });
            } else if (entry.kind === 'directory') {
              if (
                entry.name !== '.git' &&
                entry.name !== 'node_modules' &&
                entry.name !== '.next'
              ) {
                await traverseDirectory(entry, `${currentPath}/${entry.name}`);
              }
            }
          }
        };

        await traverseDirectory(dirHandle, dirName);

        if (loadedItems.length > 0) {
          const newBundle: DirectoryBundle = {
            id: bundleId,
            name: dirName,
            path: `local/${dirName}`,
            sourceType: 'local',
            isCollapsed: false,
            items: loadedItems,
          };
          if (onAddBundle) {
            onAddBundle(newBundle);
          } else if (onAddResources) {
            onAddResources(loadedItems, dirName);
          }
          onChangeViewMode('directories');
        }
        return;
      } catch (err: unknown) {
        if ((err as Error)?.name === 'AbortError') return;
      }
    }

    fileInputRef.current?.click();
  };

  // fallback input change 핸들러
  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const loadedItems: ResourceItem[] = [];
    const firstPath = files[0].webkitRelativePath || files[0].name;
    const rootDirName = firstPath.split('/')[0] || '연결된 디렉토리';
    const bundleId = `bundle-local-${Date.now()}`;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const relPath = file.webkitRelativePath || file.name;

      if (relPath.includes('/.git/') || relPath.includes('/node_modules/')) {
        continue;
      }

      const ext = file.name.split('.').pop() || 'txt';
      let content = '';
      let thumbnailUrl: string | undefined = undefined;

      const isImage =
        file.type.startsWith('image/') ||
        ['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(ext.toLowerCase());
      if (isImage) {
        thumbnailUrl = URL.createObjectURL(file);
      }

      if (file.size < 200 * 1024) {
        try {
          content = await file.text();
        } catch {
          content = `// [바이너리 파일: ${file.name}]`;
        }
      }

      const sizeStr =
        file.size < 1024
          ? `${file.size} B`
          : `${(file.size / 1024).toFixed(1)} KB`;

      loadedItems.push({
        id: `local-${Math.random().toString(36).substring(2, 9)}`,
        name: file.name,
        category: 'linked',
        pipelineSource: rootDirName,
        format: ext,
        size: sizeStr,
        updatedAt: '방금 전',
        description: `로컬 연동 파일: ${relPath}`,
        path: relPath,
        content,
        isLocal: true,
        bundleId,
        bundleName: rootDirName,
        thumbnailUrl,
      });
    }

    if (loadedItems.length > 0) {
      const newBundle: DirectoryBundle = {
        id: bundleId,
        name: rootDirName,
        path: `local/${rootDirName}`,
        sourceType: 'local',
        isCollapsed: false,
        items: loadedItems,
      };
      if (onAddBundle) {
        onAddBundle(newBundle);
      } else if (onAddResources) {
        onAddResources(loadedItems, rootDirName);
      }
      onChangeViewMode('directories');
    }
    e.target.value = '';
  };

  // 특정 디렉토리 묶음(Bundle)의 파일들을 계층 트리 노드로 구성
  const buildTreeForItems = useCallback((items: ResourceItem[], bundleRootName: string): TreeNode => {
    const root: TreeNode = {
      name: bundleRootName,
      fullPath: bundleRootName,
      isFolder: true,
      children: {},
    };

    items.forEach((res) => {
      // 경로에서 시작 부분의 bundleRootName 제거 또는 정규화
      const normPath = res.path.startsWith(bundleRootName)
        ? res.path.slice(bundleRootName.length).replace(/^[/\\]+/, '')
        : res.path;

      const parts = normPath.split(/[/\\]+/).filter(Boolean);
      let current = root;

      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        const isLast = i === parts.length - 1;
        const currentPath = `${bundleRootName}/${parts.slice(0, i + 1).join('/')}`;

        if (isLast) {
          current.children[part] = {
            name: part,
            fullPath: currentPath,
            isFolder: false,
            children: {},
            resource: res,
          };
        } else {
          if (!current.children[part]) {
            current.children[part] = {
              name: part,
              fullPath: currentPath,
              isFolder: true,
              children: {},
            };
          }
          current = current.children[part];
        }
      }
    });

    return root;
  }, []);

  // 재귀적 디렉토리 트리 렌더러
  const renderTreeNode = (node: TreeNode, depth: number = 0): React.ReactNode => {
    const entries = Object.values(node.children).sort((a, b) => {
      if (a.isFolder && !b.isFolder) return -1;
      if (!a.isFolder && b.isFolder) return 1;
      return a.name.localeCompare(b.name);
    });

    return (
      <div key={node.fullPath} className="flex flex-col">
        {entries.map((item) => {
          if (item.isFolder) {
            const isCollapsed = !!collapsedFolderPaths[item.fullPath];
            return (
              <div key={item.fullPath} className="flex flex-col">
                <div
                  onClick={() => toggleFolder(item.fullPath)}
                  style={{ paddingLeft: `${depth * 12 + 6}px` }}
                  className="flex items-center gap-1.5 py-1 px-1.5 rounded hover:bg-slate-800 text-slate-300 hover:text-slate-100 cursor-pointer text-xs group transition-colors"
                >
                  <span className="text-slate-500 group-hover:text-slate-300">
                    {isCollapsed ? (
                      <ChevronRight className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </span>
                  {isCollapsed ? (
                    <Folder className="w-3.5 h-3.5 text-amber-400/90 shrink-0" />
                  ) : (
                    <FolderOpen className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  )}
                  <span className="font-medium truncate">{item.name}</span>
                </div>
                {!isCollapsed && renderTreeNode(item, depth + 1)}
              </div>
            );
          }

          // 파일 노드
          const res = item.resource;
          if (!res) return null;

          return (
            <div
              key={item.fullPath}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData(
                  'application/json',
                  JSON.stringify({
                    type: 'resource',
                    resourceId: res.id,
                    path: res.path,
                    name: res.name,
                  })
                );
                e.dataTransfer.effectAllowed = 'copyMove';
              }}
              onClick={() => onOpenResource(res)}
              style={{ paddingLeft: `${depth * 12 + 20}px` }}
              className="flex items-center justify-between py-1 px-1.5 rounded hover:bg-slate-800/80 hover:text-white text-slate-300 cursor-pointer text-xs group transition-colors"
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                {renderFormatIcon(res.format)}
                <span className="truncate group-hover:text-indigo-300">{item.name}</span>
                {res.slotsCount !== undefined && (
                  <span className="text-[9px] px-1 rounded bg-purple-950/80 text-purple-300 border border-purple-800 font-mono shrink-0">
                    {res.slotsCount}s
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                <span className="text-[10px] text-slate-500 font-mono">{res.size}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenResource(res);
                  }}
                  className="p-0.5 rounded hover:bg-slate-700 text-slate-400 hover:text-slate-100 cursor-pointer"
                  title="우측 슬라이드오버 모달 열기"
                >
                  <ExternalLink className="w-3 h-3" />
                </button>
                <div className="cursor-grab text-slate-500" title="드래그하여 참조">
                  <GripVertical className="w-3 h-3" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // -------------------------------------------------------------
  // 4대 뷰 모드 렌더러 (동일한 데이터를 서로 다른 관점으로 투영)
  // -------------------------------------------------------------

  // 1. 디렉토리 뷰: 디렉토리 묶음(Bundles)이 아래로 순서대로 나열되는 뷰
  const renderDirectoriesView = () => {
    return (
      <div className="space-y-2.5">
        {filteredBundles.map((bundle) => {
          const tree = buildTreeForItems(bundle.items, bundle.name);
          const isCollapsed = !!bundle.isCollapsed;

          return (
            <div
              key={bundle.id}
              className="rounded-lg border border-slate-800 bg-slate-950/60 overflow-hidden shadow-xs transition-all"
            >
              {/* 디렉토리 묶음 헤더 (아코디언 토글 + 파일 수 + 액션) */}
              <div
                onClick={() => onToggleBundleCollapse && onToggleBundleCollapse(bundle.id)}
                className="px-2.5 py-1.5 bg-slate-900/90 border-b border-slate-800/80 flex items-center justify-between cursor-pointer hover:bg-slate-850 select-none group"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-slate-400 group-hover:text-slate-200 transition-colors">
                    {isCollapsed ? (
                      <ChevronRight className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </span>
                  <Folder className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="text-xs font-bold text-slate-200 truncate group-hover:text-emerald-300 transition-colors">
                    {bundle.name}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-emerald-400 font-mono font-bold shrink-0">
                    {bundle.items.length}개
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  {onRemoveBundle && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveBundle(bundle.id);
                      }}
                      className="p-1 rounded hover:bg-slate-800 text-slate-500 hover:text-red-400 transition-colors cursor-pointer"
                      title="디렉토리 링크 해제"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* 묶음 내부 계층 트리 */}
              {!isCollapsed && (
                <div className="p-1.5 bg-slate-950/40">
                  {renderTreeNode(tree, 0)}
                  {bundle.items.length === 0 && (
                    <div className="py-3 text-center text-[11px] text-slate-500">
                      일치하는 파일이 없습니다.
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* 새 디렉토리 추가 카드 (밑으로 계속 추가) */}
        <button
          type="button"
          onClick={handleConnectDirectory}
          className="w-full py-2.5 px-3 rounded-lg border border-dashed border-slate-800 hover:border-indigo-500/70 bg-slate-900/30 hover:bg-slate-900/70 text-slate-400 hover:text-indigo-300 text-xs font-medium flex items-center justify-center gap-2 transition-all cursor-pointer group"
        >
          <FolderPlus className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition-colors" />
          <span>+ 다른 로컬 디렉토리 추가하기</span>
        </button>
      </div>
    );
  };

  // 2. 유형별 뷰: 동일한 전체 데이터를 포맷/유형별로 그룹핑
  const renderCategoriesView = () => {
    const groups: { title: string; icon: React.ReactNode; items: ResourceItem[] }[] = [
      {
        title: '문서 & 리포트 (HWP, PDF, DOCX)',
        icon: <FileText className="w-3.5 h-3.5 text-rose-400" />,
        items: filteredResources.filter((r) => ['hwp', 'pdf', 'docx'].includes(r.format.toLowerCase())),
      },
      {
        title: '코드 & 데이터 (JSON, TS, JS, HTML)',
        icon: <FileCode className="w-3.5 h-3.5 text-amber-400" />,
        items: filteredResources.filter((r) => ['json', 'ts', 'js', 'html'].includes(r.format.toLowerCase())),
      },
      {
        title: '마크다운 & 규격 (MD, TXT)',
        icon: <FileText className="w-3.5 h-3.5 text-sky-400" />,
        items: filteredResources.filter((r) => ['md', 'markdown', 'txt'].includes(r.format.toLowerCase())),
      },
      {
        title: '에셋 & 그래픽 (SVG, PNG, JPG)',
        icon: <ImageIcon className="w-3.5 h-3.5 text-purple-400" />,
        items: filteredResources.filter((r) => ['svg', 'png', 'jpg', 'webp'].includes(r.format.toLowerCase())),
      },
    ];

    return (
      <div className="space-y-3">
        {groups.map((grp) => {
          if (grp.items.length === 0) return null;
          return (
            <div key={grp.title} className="rounded-lg border border-slate-800 bg-slate-950/60 overflow-hidden">
              <div className="px-2.5 py-1.5 bg-slate-900/80 border-b border-slate-800/70 flex items-center justify-between text-xs font-bold text-slate-300">
                <div className="flex items-center gap-1.5">
                  {grp.icon}
                  <span>{grp.title}</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-400 font-mono">
                  {grp.items.length}
                </span>
              </div>
              <div className="p-1.5 space-y-1">
                {grp.items.map((res) => (
                  <div
                    key={res.id}
                    onClick={() => onOpenResource(res)}
                    className="flex items-center justify-between py-1 px-2 rounded hover:bg-slate-850 cursor-pointer text-xs group"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {renderFormatIcon(res.format)}
                      <span className="truncate text-slate-200 group-hover:text-indigo-300">
                        {res.name}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono shrink-0 ml-2">
                      {res.size}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // 3. 최근순 뷰: 동일한 전체 데이터를 최신 수정 순으로 타임라인 정렬
  const renderRecentView = () => {
    return (
      <div className="space-y-1.5">
        <div className="px-2 py-1 text-[11px] text-slate-400 flex items-center gap-1">
          <Clock className="w-3.5 h-3.5 text-indigo-400" />
          <span>최근 업데이트 타임라인</span>
        </div>
        {filteredResources.map((res) => (
          <div
            key={res.id}
            onClick={() => onOpenResource(res)}
            className="p-2 rounded-lg bg-slate-950/60 border border-slate-800/80 hover:border-indigo-500/70 hover:bg-slate-850 cursor-pointer text-xs group transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                {renderFormatIcon(res.format)}
                <span className="font-medium text-slate-200 truncate group-hover:text-indigo-300">
                  {res.name}
                </span>
              </div>
              <span className="text-[10px] text-emerald-400 font-mono shrink-0">
                {res.updatedAt}
              </span>
            </div>
            <div className="mt-1 flex items-center justify-between text-[10px] text-slate-500 font-mono">
              <span className="truncate text-slate-400">{res.bundleName || res.pipelineSource}</span>
              <span>{res.size}</span>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // 4. 캔바(Canva) 요소 패널 스타일 비주얼 뷰: 디렉토리별 자원 시각화 타일 그리드
  const renderListView = () => {
    // 캔바 스타일 비주얼 썸네일 타일 렌더러
    const renderVisualTile = (res: ResourceItem) => {
      const f = res.format.toLowerCase();
      const isImg = ['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(f) || !!res.thumbnailUrl;
      const isSvg = f === 'svg' && (res.content || res.thumbnailUrl);
      const isHwp = f === 'hwp';
      const isPdf = f === 'pdf';
      const isJson = f === 'json';
      const isMd = ['md', 'markdown', 'txt'].includes(f);

      return (
        <div
          key={res.id}
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData(
              'application/json',
              JSON.stringify({
                type: 'resource',
                resourceId: res.id,
                path: res.path,
                name: res.name,
              })
            );
            e.dataTransfer.effectAllowed = 'copyMove';
          }}
          onClick={() => onOpenResource(res)}
          className="group flex flex-col items-center w-[76px] shrink-0 cursor-pointer select-none"
          title={`${res.name} (${res.size}) • 클릭하여 우측 모달로 보기`}
        >
          {/* 캔바 스타일 비주얼 썸네일 타일 (직사각형) */}
          <div className="w-[76px] h-[76px] rounded-none bg-slate-950/90 border border-slate-800/90 group-hover:border-indigo-500/90 group-hover:bg-slate-850 group-hover:shadow-lg group-hover:-translate-y-0.5 transition-all flex items-center justify-center p-1.5 relative overflow-hidden">
            {/* 1. 이미지 및 SVG 실물 썸네일 프리뷰 */}
            {res.thumbnailUrl ? (
              <img
                src={res.thumbnailUrl}
                alt={res.name}
                className="w-full h-full object-cover rounded-none pointer-events-none"
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = 'none';
                }}
              />
            ) : isSvg ? (
              <div
                className="w-full h-full flex items-center justify-center pointer-events-none transform scale-90 group-hover:scale-100 transition-transform"
                dangerouslySetInnerHTML={{ __html: res.content || '' }}
              />
            ) : isImg ? (
              <div className="flex flex-col items-center justify-center space-y-1">
                <div className="w-8 h-8 rounded-sm bg-indigo-950/70 border border-indigo-800/90 flex items-center justify-center shadow-xs">
                  <ImageIcon className="w-4 h-4 text-indigo-400" />
                </div>
                <span className="text-[9px] font-mono text-indigo-300 uppercase font-bold">
                  {res.format}
                </span>
              </div>
            ) : isHwp ? (
              <div className="flex flex-col items-center justify-center space-y-1">
                <div className="w-8 h-10 rounded-sm bg-rose-950/70 border border-rose-800/90 flex items-center justify-center shadow-xs">
                  <span className="text-[10px] font-black font-mono text-rose-400">HWP</span>
                </div>
              </div>
            ) : isPdf ? (
              <div className="flex flex-col items-center justify-center space-y-1">
                <div className="w-8 h-10 rounded-sm bg-red-950/70 border border-red-800/90 flex items-center justify-center shadow-xs">
                  <span className="text-[10px] font-black font-mono text-red-400">PDF</span>
                </div>
              </div>
            ) : isJson ? (
              <div className="flex flex-col items-center justify-center space-y-1">
                <div className="w-8 h-8 rounded-sm bg-amber-950/70 border border-amber-800/90 flex items-center justify-center shadow-xs text-amber-400 font-mono font-bold text-xs">
                  {'{ }'}
                </div>
                {res.slotsCount !== undefined && (
                  <span className="text-[8px] font-bold text-amber-300 font-mono">
                    {res.slotsCount}s
                  </span>
                )}
              </div>
            ) : isMd ? (
              <div className="flex flex-col items-center justify-center space-y-1">
                <div className="w-8 h-10 rounded-sm bg-sky-950/70 border border-sky-800/90 flex items-center justify-center shadow-xs">
                  <span className="text-[10px] font-black font-mono text-sky-400">MD</span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center space-y-1">
                {renderFormatIcon(res.format)}
                <span className="text-[9px] font-mono text-slate-400 uppercase font-bold">
                  {res.format}
                </span>
              </div>
            )}
          </div>

          {/* 타일 하단 파일명 라벨 */}
          <span className="text-[10px] font-medium text-slate-300 group-hover:text-indigo-300 truncate w-full text-center mt-1 px-0.5 transition-colors">
            {res.name}
          </span>
        </div>
      );
    };

    return (
      <div className="space-y-4">
        {filteredBundles.map((bundle) => {
          const isExpanded = !!expandedBundleIds[bundle.id];
          const hasMultiple = bundle.items.length > 3;

          return (
            <div key={bundle.id} className="space-y-2">
              {/* 디렉토리 헤더: [📁 디렉토리명 (N개)] (좌) + [그리드로 보기 / 접기] (우) */}
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-1.5 min-w-0">
                  <Folder className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="text-xs font-bold text-slate-200 truncate">
                    {bundle.name}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    ({bundle.items.length})
                  </span>
                </div>

                {hasMultiple && (
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedBundleIds((prev) => ({
                        ...prev,
                        [bundle.id]: !prev[bundle.id],
                      }))
                    }
                    className="text-[11px] font-medium text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer shrink-0 transition-colors"
                    title={isExpanded ? '가로 스크롤 뷰로 전환' : '3열 바둑판 그리드로 펼치기'}
                  >
                    <span>{isExpanded ? '접기 (가로)' : '그리드로 보기'}</span>
                    <ChevronRight
                      className={`w-3 h-3 transition-transform ${
                        isExpanded ? 'rotate-90' : ''
                      }`}
                    />
                  </button>
                )}
              </div>

              {/* 캔바 스타일 비주얼 타일 행 / 그리드 (직사각형 컨테이너 + 가로 스크롤바 + 마우스 휠 지원) */}
              <div
                onWheel={(e) => {
                  if (!isExpanded && e.currentTarget) {
                    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
                      e.currentTarget.scrollLeft += e.deltaY;
                    }
                  }
                }}
                className={`p-2 rounded-none bg-slate-950/40 border border-slate-800/80 ${
                  isExpanded
                    ? 'grid grid-cols-3 gap-2.5 justify-items-center max-h-[380px] overflow-y-auto custom-scrollbar'
                    : 'flex items-center gap-2.5 overflow-x-auto custom-scrollbar pb-2.5'
                }`}
              >
                {bundle.items.map((res) => renderVisualTile(res))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-slate-900 border-l border-slate-800 text-slate-200 select-none overflow-hidden font-sans">
      {/* 히든 파일 디렉토리 인풋 (fallback) */}
      <input
        ref={fileInputRef}
        type="file"
        // @ts-expect-error - webkitdirectory standard fallback
        webkitdirectory=""
        directory=""
        multiple
        className="hidden"
        onChange={handleFileInputChange}
      />

      {/* 1. 패널 상단 헤더 */}
      <div className="h-9 px-3 border-b border-slate-800 flex items-center justify-between shrink-0 bg-slate-900/95">
        <div className="flex items-center gap-2">
          <FolderKanban className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-bold tracking-wide text-slate-100 uppercase">
            Resource Manager
          </span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-400 font-mono font-bold">
            {totalCount}
          </span>
        </div>

        <div className="flex items-center gap-1 text-slate-400">
          {/* 로컬 디렉토리 추가 버튼 */}
          <button
            type="button"
            onClick={handleConnectDirectory}
            className="p-1 rounded hover:bg-slate-800 hover:text-emerald-400 cursor-pointer transition-colors"
            title="+ 새 로컬 디렉토리 추가 (Connect Directory)"
          >
            <FolderPlus className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => setCollapsedFolderPaths({})}
            className="p-1 rounded hover:bg-slate-800 hover:text-slate-200 cursor-pointer transition-colors"
            title="모두 펼치기 / 새로고침"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded hover:bg-slate-800 hover:text-slate-200 cursor-pointer transition-colors"
            title="패널 닫기"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. 상단 4대 뷰모드 탭 (동일한 데이터를 다른 뷰모드로 투영) */}
      {/* 텍스트 세로 깨짐 완전 방지: whitespace-nowrap, grid 4분할 */}
      <div className="grid grid-cols-4 border-b border-slate-800 bg-slate-950/70 p-1 gap-1 text-xs shrink-0">
        <button
          type="button"
          onClick={() => onChangeViewMode('directories')}
          className={`flex items-center justify-center gap-1 py-1 px-1 rounded text-[11px] font-medium transition-colors cursor-pointer whitespace-nowrap ${
            viewMode === 'directories'
              ? 'bg-slate-800 text-emerald-400 font-semibold shadow-xs'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
          title="디렉토리 묶음 트리 뷰"
        >
          <FolderTree className="w-3 h-3 shrink-0" />
          <span>디렉토리</span>
        </button>

        <button
          type="button"
          onClick={() => onChangeViewMode('categories')}
          className={`flex items-center justify-center gap-1 py-1 px-1 rounded text-[11px] font-medium transition-colors cursor-pointer whitespace-nowrap ${
            viewMode === 'categories'
              ? 'bg-slate-800 text-purple-400 font-semibold shadow-xs'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
          title="파일 유형별 뷰"
        >
          <Boxes className="w-3 h-3 shrink-0" />
          <span>유형별</span>
        </button>

        <button
          type="button"
          onClick={() => onChangeViewMode('recent')}
          className={`flex items-center justify-center gap-1 py-1 px-1 rounded text-[11px] font-medium transition-colors cursor-pointer whitespace-nowrap ${
            viewMode === 'recent'
              ? 'bg-slate-800 text-sky-400 font-semibold shadow-xs'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
          title="최근 업데이트 타임라인"
        >
          <Clock className="w-3 h-3 shrink-0" />
          <span>최근순</span>
        </button>

        <button
          type="button"
          onClick={() => onChangeViewMode('list')}
          className={`flex items-center justify-center gap-1 py-1 px-1 rounded text-[11px] font-medium transition-colors cursor-pointer whitespace-nowrap ${
            viewMode === 'list'
              ? 'bg-slate-800 text-amber-400 font-semibold shadow-xs'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
          title="상세 카드 목록 뷰"
        >
          <LayoutGrid className="w-3 h-3 shrink-0" />
          <span>상세목록</span>
        </button>
      </div>

      {/* 3. 전역 실시간 검색창 */}
      <div className="p-2 border-b border-slate-800 bg-slate-900/40 shrink-0">
        <div className="relative flex items-center">
          <Search className="w-3.5 h-3.5 absolute left-2.5 text-slate-500 pointer-events-none" />
          <input
            type="text"
            placeholder="모든 디렉토리 파일, 파이프라인 검색..."
            value={searchQuery}
            onChange={(e) => onChangeSearchQuery(e.target.value)}
            className="w-full pl-8 pr-2.5 py-1 bg-slate-950 border border-slate-800 rounded text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>
      </div>

      {/* 4. 활성 뷰 모드에 따른 렌더링 영역 */}
      <div className="flex-1 overflow-y-auto p-2 scrollbar-thin">
        {viewMode === 'directories' && renderDirectoriesView()}
        {viewMode === 'categories' && renderCategoriesView()}
        {viewMode === 'recent' && renderRecentView()}
        {viewMode === 'list' && renderListView()}

        {filteredResources.length === 0 && (
          <div className="h-36 flex flex-col items-center justify-center text-center p-4 text-slate-500 text-xs gap-2">
            <p>검색 결과와 일치하는 파일이 없습니다.</p>
            <button
              type="button"
              onClick={handleConnectDirectory}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] flex items-center gap-1.5 cursor-pointer"
            >
              <FolderPlus className="w-3.5 h-3.5 text-emerald-400" />
              <span>새 디렉토리 추가</span>
            </button>
          </div>
        )}
      </div>

      {/* 5. 하단 안내 및 디렉토리 추가 바 */}
      <div className="p-2 border-t border-slate-800/80 bg-slate-950/80 text-[11px] text-slate-400 flex items-center justify-between shrink-0">
        <span className="truncate">💡 파일을 에디터 또는 캔버스로 드래그</span>
        <button
          type="button"
          onClick={handleConnectDirectory}
          className="text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 cursor-pointer shrink-0 ml-1"
        >
          <span>디렉토리 추가</span>
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
