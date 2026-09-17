import { useState, useCallback, useEffect, useRef } from 'react';
import { useScaffoldDocumentDetail } from '@/entities/scaffold-document';
import { updatePageInFullHtml } from '../lib/scaffoldPageUtils';
import type {
  ActivityBarTab,
  BottomPanelTab,
  EditorTabItem,
  FileTreeNode,
  TerminalSessionItem,
  ChatMessageItem,
  DragPayload,
} from './types';
import { initialFileTree } from './mockFileSystem';

const DEFAULT_SCAFFOLD_ID = 'scaffold-1a0a0008250-fabfd713';

export function useIdeWorkspaceState(scaffoldId: string = DEFAULT_SCAFFOLD_ID) {
  // 실제 백엔드 스캐폴드 아카이브 데이터 연동
  const {
    detail,
    isLoading: isLoadingScaffold,
    error: scaffoldError,
    syncState,
    liveHtml,
    liveMarkdown,
    setLiveHtml,
    setLiveMarkdown,
    saveImmediately,
    reload: reloadScaffold,
  } = useScaffoldDocumentDetail(scaffoldId);

  // 1. 패널 레이아웃 및 크기 상태
  const [showPrimarySidebar, setShowPrimarySidebar] = useState(true);
  const [showSecondarySidebar, setShowSecondarySidebar] = useState(true);
  const [showBottomPanel, setShowBottomPanel] = useState(true);

  const [primarySidebarWidth, setPrimarySidebarWidth] = useState(260);
  const [secondarySidebarWidth, setSecondarySidebarWidth] = useState(360);
  const [bottomPanelHeight, setBottomPanelHeight] = useState(200);
  const [splitRatio, setSplitRatio] = useState(55); // 좌우 에디터 분할 비율 (와이어프레임 캔버스 55% : 소스코드 45%)

  const [isDraggingAnyResizer, setIsDraggingAnyResizer] = useState(false);

  // 2. Activity Bar & Bottom Panel 활성 탭
  const [activeActivityTab, setActiveActivityTab] = useState<ActivityBarTab>('explorer');
  const [activeBottomTab, setActiveBottomTab] = useState<BottomPanelTab>('terminal');

  // 3. 파일 트리 상태
  const [fileTree, setFileTree] = useState<FileTreeNode[]>(initialFileTree);

  // 4. 멀티 Pane 에디터 상태 (Pane 1: 와이어프레임 캔버스, Pane 2: 소스 코드/규격)
  const [isSplitEditor, setIsSplitEditor] = useState<boolean>(true);

  const [pane1Tabs, setPane1Tabs] = useState<EditorTabItem[]>([
    {
      id: 'tab-wireframe-canvas',
      name: 'wireframe.canvas',
      path: 'wireframe/canvas',
      language: 'canvas',
      type: 'wireframe',
      scaffoldId,
      isModified: false,
      content: '',
    },
    {
      id: 'tab-wireframe-html',
      name: 'render.html',
      path: 'wireframe/render.html',
      language: 'html',
      type: 'code',
      scaffoldId,
      isModified: false,
      content: '<!-- 로딩 중... -->',
    },
  ]);
  const [pane1ActiveId, setPane1ActiveId] = useState<string>('tab-wireframe-canvas');

  const [pane2Tabs, setPane2Tabs] = useState<EditorTabItem[]>([
    {
      id: 'tab-wireframe-md',
      name: 'content.md',
      path: 'wireframe/content.md',
      language: 'markdown',
      type: 'code',
      scaffoldId,
      isModified: false,
      content: '# 로딩 중...',
    },
    {
      id: 'tab-wireframe-slots',
      name: 'slots.json',
      path: 'wireframe/slots.json',
      language: 'json',
      type: 'code',
      scaffoldId,
      isModified: false,
      content: '[]',
    },
  ]);
  const [pane2ActiveId, setPane2ActiveId] = useState<string>('tab-wireframe-md');

  const [cursorPosition, setCursorPosition] = useState<{ line: number; col: number }>({ line: 1, col: 1 });

  // 5. 터미널 상태
  const [terminalSessions, setTerminalSessions] = useState<TerminalSessionItem[]>([
    {
      id: 'powershell-1',
      name: 'powershell',
      history: [
        'PS C:\\AI_Projects\\WebNovelAssistant\\VibePatchNote> git status',
        'On branch add-document-editor',
        'Changes not staged for commit:',
        '  modified:   apps/web/src/pages/editor-lab/ui/EditorLabPage.tsx',
      ],
    },
    {
      id: 'turbo-dev',
      name: 'turbo',
      history: [
        'PS C:\\AI_Projects\\WebNovelAssistant\\VibePatchNote> pnpm dev',
        '@vibe/web:dev:   Local:   http://localhost:5173/',
        '@vibe/api:dev: INFO:     Uvicorn running on http://127.0.0.1:8000',
      ],
    },
  ]);
  const [activeTerminalId, setActiveTerminalId] = useState<string>('turbo-dev');
  const [terminalCommandInput, setTerminalCommandInput] = useState<string>('');

  // 6. AI 챗 패널 상태
  const [chatMessages, setChatMessages] = useState<ChatMessageItem[]>([
    {
      id: 'msg-1',
      sender: 'user',
      timestamp: '23:05',
      content: '화면 스플릿, 탭 이동, 패널 크기 조절 기능이 가능한가?',
    },
    {
      id: 'msg-2',
      sender: 'agent',
      timestamp: '23:06',
      content: '네, 탭 드래그 앤 드롭 이동, 탐색기 파일 드롭, 4대 패널 마우스 리사이징을 완벽하게 지원합니다.',
      filesChanged: { count: 4, additions: 420, deletions: 80 },
    },
  ]);
  const [promptInput, setPromptInput] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<string>('Gemini 3.8 Flash High');
  const [isAiStreaming, setIsAiStreaming] = useState<boolean>(false);

  // 활성 탭 객체 도출
  const pane1ActiveTab = pane1Tabs.find((t) => t.id === pane1ActiveId) || pane1Tabs[0];
  const pane2ActiveTab = pane2Tabs.find((t) => t.id === pane2ActiveId) || pane2Tabs[0];

  // 파일 트리 내 파일 검색 헬퍼
  const findFileNodeById = (nodes: FileTreeNode[], fileId: string): FileTreeNode | null => {
    for (const node of nodes) {
      if (node.id === fileId) return node;
      if (node.children) {
        const found = findFileNodeById(node.children, fileId);
        if (found) return found;
      }
    }
    return null;
  };

  // 폴더 접기/펼치기
  const toggleFolderRecursive = (nodes: FileTreeNode[], targetId: string): FileTreeNode[] => {
    return nodes.map((node) => {
      if (node.id === targetId) return { ...node, isOpen: !node.isOpen };
      if (node.children) return { ...node, children: toggleFolderRecursive(node.children, targetId) };
      return node;
    });
  };

  const handleToggleFolder = useCallback((folderId: string) => {
    setFileTree((prev) => toggleFolderRecursive(prev, folderId));
  }, []);

  // 탭 닫기
  const handleCloseTab = useCallback((tabId: string, pane: 'pane1' | 'pane2', e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (pane === 'pane1') {
      setPane1Tabs((prev) => {
        const next = prev.filter((t) => t.id !== tabId);
        if (tabId === pane1ActiveId && next.length > 0) {
          setPane1ActiveId(next[next.length - 1].id);
        }
        return next;
      });
    } else {
      setPane2Tabs((prev) => {
        const next = prev.filter((t) => t.id !== tabId);
        if (tabId === pane2ActiveId && next.length > 0) {
          setPane2ActiveId(next[next.length - 1].id);
        }
        return next;
      });
    }
  }, [pane1ActiveId, pane2ActiveId]);

  // 탭을 다른 Pane으로 이전 (Move to other pane)
  const handleMoveTab = useCallback((tabId: string, fromPane: 'pane1' | 'pane2', toPane: 'pane1' | 'pane2') => {
    if (fromPane === toPane) return;

    if (fromPane === 'pane1') {
      const targetTab = pane1Tabs.find((t) => t.id === tabId);
      if (!targetTab) return;
      // Pane 1에서 제거
      setPane1Tabs((prev) => {
        const next = prev.filter((t) => t.id !== tabId);
        if (tabId === pane1ActiveId && next.length > 0) {
          setPane1ActiveId(next[next.length - 1].id);
        }
        return next;
      });
      // Pane 2에 추가
      setPane2Tabs((prev) => {
        const exists = prev.find((t) => t.id === tabId);
        if (exists) return prev;
        return [...prev, targetTab];
      });
      setPane2ActiveId(tabId);
      setIsSplitEditor(true);
    } else {
      const targetTab = pane2Tabs.find((t) => t.id === tabId);
      if (!targetTab) return;
      // Pane 2에서 제거
      setPane2Tabs((prev) => {
        const next = prev.filter((t) => t.id !== tabId);
        if (tabId === pane2ActiveId && next.length > 0) {
          setPane2ActiveId(next[next.length - 1].id);
        }
        return next;
      });
      // Pane 1에 추가
      setPane1Tabs((prev) => {
        const exists = prev.find((t) => t.id === tabId);
        if (exists) return prev;
        return [...prev, targetTab];
      });
      setPane1ActiveId(tabId);
    }
  }, [pane1Tabs, pane2Tabs, pane1ActiveId, pane2ActiveId]);

  // 탭 순서 변경 및 Pane 간 위치 지정 이동 (Reorder / Insert)
  const handleReorderTab = useCallback(
    (
      sourceTabId: string,
      targetTabId: string | null,
      sourcePane: 'pane1' | 'pane2',
      targetPane: 'pane1' | 'pane2',
      position: 'before' | 'after' = 'before'
    ) => {
      // 1. 동일 Pane 내에서 탭 순서 변경 (Reorder)
      if (sourcePane === targetPane) {
        if (sourceTabId === targetTabId) return;

        const updateTabs = (prevTabs: EditorTabItem[]) => {
          const sourceTab = prevTabs.find((t) => t.id === sourceTabId);
          if (!sourceTab) return prevTabs;

          const remaining = prevTabs.filter((t) => t.id !== sourceTabId);
          if (!targetTabId) {
            return [...remaining, sourceTab];
          }

          const targetIndex = remaining.findIndex((t) => t.id === targetTabId);
          if (targetIndex === -1) {
            return [...remaining, sourceTab];
          }

          const insertIndex = position === 'after' ? targetIndex + 1 : targetIndex;
          const nextTabs = [...remaining];
          nextTabs.splice(insertIndex, 0, sourceTab);
          return nextTabs;
        };

        if (sourcePane === 'pane1') {
          setPane1Tabs(updateTabs);
          setPane1ActiveId(sourceTabId);
        } else {
          setPane2Tabs(updateTabs);
          setPane2ActiveId(sourceTabId);
        }
        return;
      }

      // 2. 다른 Pane 간 이동 및 위치 삽입 (Cross-pane transfer with position)
      if (sourcePane === 'pane1') {
        const movedTab = pane1Tabs.find((t) => t.id === sourceTabId);
        if (!movedTab) return;

        setPane1Tabs((prev) => {
          const next = prev.filter((t) => t.id !== sourceTabId);
          if (sourceTabId === pane1ActiveId && next.length > 0) {
            setPane1ActiveId(next[next.length - 1].id);
          }
          return next;
        });

        setPane2Tabs((prev) => {
          const remaining = prev.filter((t) => t.id !== sourceTabId);
          if (!targetTabId) {
            return [...remaining, movedTab];
          }
          const targetIndex = remaining.findIndex((t) => t.id === targetTabId);
          if (targetIndex === -1) {
            return [...remaining, movedTab];
          }
          const insertIndex = position === 'after' ? targetIndex + 1 : targetIndex;
          const next = [...remaining];
          next.splice(insertIndex, 0, movedTab);
          return next;
        });

        setPane2ActiveId(sourceTabId);
        setIsSplitEditor(true);
      } else {
        const movedTab = pane2Tabs.find((t) => t.id === sourceTabId);
        if (!movedTab) return;

        setPane2Tabs((prev) => {
          const next = prev.filter((t) => t.id !== sourceTabId);
          if (sourceTabId === pane2ActiveId && next.length > 0) {
            setPane2ActiveId(next[next.length - 1].id);
          }
          return next;
        });

        setPane1Tabs((prev) => {
          const remaining = prev.filter((t) => t.id !== sourceTabId);
          if (!targetTabId) {
            return [...remaining, movedTab];
          }
          const targetIndex = remaining.findIndex((t) => t.id === targetTabId);
          if (targetIndex === -1) {
            return [...remaining, movedTab];
          }
          const insertIndex = position === 'after' ? targetIndex + 1 : targetIndex;
          const next = [...remaining];
          next.splice(insertIndex, 0, movedTab);
          return next;
        });

        setPane1ActiveId(sourceTabId);
      }
    },
    [pane1Tabs, pane2Tabs, pane1ActiveId, pane2ActiveId]
  );

  // 백엔드 스캐폴드 아카이브 상세 데이터가 로드되면 탭 및 파일 트리에 실시간 반영
  const isInitialPopulatedRef = useRef(false);

  useEffect(() => {
    if (!detail) return;

    // 총 페이지 수 계산 (기본 2페이지)
    const totalPages = detail.totalPages || (detail.pages ? detail.pages.length : 2);
    const pageNodes: FileTreeNode[] = [];

    // 페이지별 단독 캔버스 노드 생성
    for (let p = 1; p <= totalPages; p++) {
      pageNodes.push({
        id: `tab-wireframe-p${p}`,
        name: `page-${p}.canvas`,
        path: `wireframe/page-${p}`,
        isFolder: false,
        type: 'wireframe',
        language: 'canvas',
        scaffoldId: detail.scaffoldId,
        pageNumber: p,
      });
    }

    // 1. 파일 트리에 실제 와이어프레임 아카이브 노드 주입
    const archiveNode: FileTreeNode = {
      id: `archive-${detail.scaffoldId}`,
      name: `${detail.title || '와이어프레임'} [${detail.scaffoldId.slice(-8)}]`,
      path: 'wireframe',
      isFolder: true,
      isOpen: true,
      children: [
        {
          id: 'tab-wireframe-canvas',
          name: 'wireframe (전체).canvas',
          path: 'wireframe/canvas',
          isFolder: false,
          type: 'wireframe',
          language: 'canvas',
          scaffoldId: detail.scaffoldId,
        },
        ...pageNodes,
        {
          id: 'tab-wireframe-html',
          name: 'render.html',
          path: 'wireframe/render.html',
          isFolder: false,
          type: 'code',
          language: 'html',
          scaffoldId: detail.scaffoldId,
          content: liveHtml || detail.htmlContent || '',
        },
        {
          id: 'tab-wireframe-md',
          name: 'content.md',
          path: 'wireframe/content.md',
          isFolder: false,
          type: 'code',
          language: 'markdown',
          scaffoldId: detail.scaffoldId,
          content: liveMarkdown || detail.markdownContent || '',
        },
        {
          id: 'tab-wireframe-prompt-spec',
          name: 'prompt_spec.md',
          path: 'wireframe/prompt_spec.md',
          isFolder: false,
          type: 'code',
          language: 'markdown',
          scaffoldId: detail.scaffoldId,
          content: detail.promptSpecMd || '# 와이어프레임 엔진 규격\n',
        },
        {
          id: 'tab-wireframe-slots',
          name: 'slots.json',
          path: 'wireframe/slots.json',
          isFolder: false,
          type: 'code',
          language: 'json',
          scaffoldId: detail.scaffoldId,
          content: JSON.stringify(detail.slots || [], null, 2),
        },
      ],
    };

    setFileTree([archiveNode, ...initialFileTree]);

    // 2. 초기 1회 로드 시: Pane 1에는 Page 1, Pane 2에는 Page 2를 스플릿으로 자동 배치!
    if (!isInitialPopulatedRef.current) {
      setPane1Tabs([
        {
          id: 'tab-wireframe-p1',
          name: 'Page 1.canvas',
          path: 'wireframe/page-1',
          language: 'canvas',
          type: 'wireframe',
          scaffoldId: detail.scaffoldId,
          pageNumber: 1,
          isModified: false,
          content: '',
        },
        {
          id: 'tab-wireframe-canvas',
          name: 'wireframe (전체).canvas',
          path: 'wireframe/canvas',
          language: 'canvas',
          type: 'wireframe',
          scaffoldId: detail.scaffoldId,
          isModified: false,
          content: '',
        },
        {
          id: 'tab-wireframe-html',
          name: 'render.html',
          path: 'wireframe/render.html',
          language: 'html',
          type: 'code',
          scaffoldId: detail.scaffoldId,
          isModified: false,
          content: liveHtml || detail.htmlContent || '',
        },
      ]);
      setPane1ActiveId('tab-wireframe-p1');

      setPane2Tabs([
        {
          id: 'tab-wireframe-p2',
          name: 'Page 2.canvas',
          path: 'wireframe/page-2',
          language: 'canvas',
          type: 'wireframe',
          scaffoldId: detail.scaffoldId,
          pageNumber: 2,
          isModified: false,
          content: '',
        },
        {
          id: 'tab-wireframe-md',
          name: 'content.md',
          path: 'wireframe/content.md',
          language: 'markdown',
          type: 'code',
          scaffoldId: detail.scaffoldId,
          isModified: false,
          content: liveMarkdown || detail.markdownContent || '',
        },
        {
          id: 'tab-wireframe-slots',
          name: 'slots.json',
          path: 'wireframe/slots.json',
          language: 'json',
          type: 'code',
          scaffoldId: detail.scaffoldId,
          isModified: false,
          content: JSON.stringify(detail.slots || [], null, 2),
        },
      ]);
      setPane2ActiveId('tab-wireframe-p2');
      setIsSplitEditor(true);
      isInitialPopulatedRef.current = true;
    } else {
      // 이후 동기화 시: render.html / content.md 내용 업데이트
      setPane1Tabs((prev) =>
        prev.map((t) => {
          if (t.id === 'tab-wireframe-html' && !t.isModified) {
            return {
              ...t,
              content: liveHtml || detail.htmlContent || '',
              scaffoldId: detail.scaffoldId,
            };
          }
          return t;
        })
      );

      setPane2Tabs((prev) =>
        prev.map((t) => {
          if (t.id === 'tab-wireframe-md' && !t.isModified) {
            return {
              ...t,
              content: liveMarkdown || detail.markdownContent || '',
              scaffoldId: detail.scaffoldId,
            };
          }
          if (t.id === 'tab-wireframe-slots') {
            return {
              ...t,
              content: JSON.stringify(detail.slots || [], null, 2),
              scaffoldId: detail.scaffoldId,
            };
          }
          return t;
        })
      );
    }
  }, [detail, liveHtml, liveMarkdown]);

  // 파일 클릭 시 열기
  const handleOpenFile = useCallback((node: FileTreeNode, targetPane: 'pane1' | 'pane2' = 'pane1') => {
    if (node.isFolder) {
      handleToggleFolder(node.id);
      return;
    }

    const isWireframe = node.type === 'wireframe' || node.name.endsWith('.canvas');

    const newTab: EditorTabItem = {
      id: node.id,
      name: node.name,
      path: node.path,
      content: node.content || (isWireframe ? '' : `// ${node.name}\n`),
      language: node.language || (isWireframe ? 'canvas' : 'typescript'),
      type: isWireframe ? 'wireframe' : (node.type || 'code'),
      scaffoldId: node.scaffoldId || scaffoldId,
      pageNumber: node.pageNumber,
      isModified: node.gitStatus === 'M',
    };

    if (targetPane === 'pane1') {
      setPane1Tabs((prev) => {
        const exists = prev.find((t) => t.id === node.id);
        if (exists) return prev;
        return [...prev, newTab];
      });
      setPane1ActiveId(node.id);
    } else {
      setPane2Tabs((prev) => {
        const exists = prev.find((t) => t.id === node.id);
        if (exists) return prev;
        return [...prev, newTab];
      });
      setPane2ActiveId(node.id);
      setIsSplitEditor(true);
    }
  }, [handleToggleFolder, scaffoldId]);

  // 드래그 앤 드롭 아이템 드롭 처리기
  const handleDropItem = useCallback((payload: DragPayload, targetPane: 'pane1' | 'pane2') => {
    if (payload.type === 'tab') {
      handleReorderTab(payload.tabId, null, payload.sourcePane, targetPane, 'after');
    } else if (payload.type === 'file') {
      const fileNode = findFileNodeById(fileTree, payload.fileId);
      if (fileNode) {
        handleOpenFile(fileNode, targetPane);
      }
    }
  }, [fileTree, handleReorderTab, handleOpenFile]);

  // 특정 페이지(pageNumber)에서 HTML 편집 시 전체 문서(SSOT)에 병합 반영
  const handlePageWireframeChangeHtml = useCallback(
    (pageNumber: number, pageHtml: string) => {
      const mergedHtml = updatePageInFullHtml(liveHtml, pageNumber, pageHtml);
      setLiveHtml(mergedHtml);
      setPane1Tabs((prev) =>
        prev.map((t) => (t.id === 'tab-wireframe-html' ? { ...t, content: mergedHtml } : t))
      );
      setPane2Tabs((prev) =>
        prev.map((t) => (t.id === 'tab-wireframe-html' ? { ...t, content: mergedHtml } : t))
      );
    },
    [liveHtml, setLiveHtml]
  );

  // 캔버스 에디터에서 전체 HTML 변경 시 핸들러
  const handleWireframeChangeHtml = useCallback((nextHtml: string) => {
    setLiveHtml(nextHtml);
    // 열려있는 render.html 탭에도 동기화
    setPane1Tabs((prev) =>
      prev.map((t) => (t.id === 'tab-wireframe-html' ? { ...t, content: nextHtml } : t))
    );
    setPane2Tabs((prev) =>
      prev.map((t) => (t.id === 'tab-wireframe-html' ? { ...t, content: nextHtml } : t))
    );
  }, [setLiveHtml]);

  // 캔버스 에디터에서 Markdown 변경 시 핸들러
  const handleWireframeChangeMarkdown = useCallback((nextMd: string) => {
    setLiveMarkdown(nextMd);
    // 열려있는 content.md 탭에도 동기화
    setPane1Tabs((prev) =>
      prev.map((t) => (t.id === 'tab-wireframe-md' ? { ...t, content: nextMd } : t))
    );
    setPane2Tabs((prev) =>
      prev.map((t) => (t.id === 'tab-wireframe-md' ? { ...t, content: nextMd } : t))
    );
  }, [setLiveMarkdown]);

  // 코드 텍스트 에디터에서 수정 시 핸들러
  const handleContentChange = useCallback((newContent: string, pane: 'pane1' | 'pane2') => {
    const activeId = pane === 'pane1' ? pane1ActiveId : pane2ActiveId;

    if (pane === 'pane1' && pane1ActiveId) {
      setPane1Tabs((prev) =>
        prev.map((t) => (t.id === pane1ActiveId ? { ...t, content: newContent, isModified: true } : t))
      );
    } else if (pane === 'pane2' && pane2ActiveId) {
      setPane2Tabs((prev) =>
        prev.map((t) => (t.id === pane2ActiveId ? { ...t, content: newContent, isModified: true } : t))
      );
    }

    // 만약 render.html 또는 content.md 탭이 수정되었다면 실제 데이터에도 반영
    if (activeId === 'tab-wireframe-html') {
      setLiveHtml(newContent);
    } else if (activeId === 'tab-wireframe-md') {
      setLiveMarkdown(newContent);
    }
  }, [pane1ActiveId, pane2ActiveId, setLiveHtml, setLiveMarkdown]);

  // ---------------- 리사이저 드래그 핸들러들 ---------------- //
  // A. 좌측 사이드바 리사이징 (너비)
  const handleMouseDownPrimaryResizer = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraggingAnyResizer(true);
    const startX = e.clientX;
    const startWidth = primarySidebarWidth;

    const handleMouseMove = (ev: MouseEvent) => {
      const delta = ev.clientX - startX;
      const newWidth = Math.max(160, Math.min(500, startWidth + delta));
      setPrimarySidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsDraggingAnyResizer(false);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }, [primarySidebarWidth]);

  // B. 우측 AI 패널 리사이징 (너비)
  const handleMouseDownSecondaryResizer = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraggingAnyResizer(true);
    const startX = e.clientX;
    const startWidth = secondarySidebarWidth;

    const handleMouseMove = (ev: MouseEvent) => {
      const delta = startX - ev.clientX;
      const newWidth = Math.max(240, Math.min(650, startWidth + delta));
      setSecondarySidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsDraggingAnyResizer(false);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }, [secondarySidebarWidth]);

  // C. 하단 패널 리사이징 (높이)
  const handleMouseDownBottomResizer = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraggingAnyResizer(true);
    const startY = e.clientY;
    const startHeight = bottomPanelHeight;

    const handleMouseMove = (ev: MouseEvent) => {
      const delta = startY - ev.clientY;
      const newHeight = Math.max(100, Math.min(550, startHeight + delta));
      setBottomPanelHeight(newHeight);
    };

    const handleMouseUp = () => {
      setIsDraggingAnyResizer(false);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }, [bottomPanelHeight]);

  // D. 중앙 스플릿 에디터 리사이징 (좌우 비율 %)
  const handleMouseDownSplitResizer = useCallback((containerWidth: number) => (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraggingAnyResizer(true);
    const startX = e.clientX;
    const startRatio = splitRatio;

    const handleMouseMove = (ev: MouseEvent) => {
      const delta = ev.clientX - startX;
      const deltaRatio = (delta / containerWidth) * 100;
      const newRatio = Math.max(20, Math.min(80, startRatio + deltaRatio));
      setSplitRatio(newRatio);
    };

    const handleMouseUp = () => {
      setIsDraggingAnyResizer(false);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }, [splitRatio]);

  // Activity Bar 클릭 핸들러
  const handleSelectActivityTab = useCallback((tab: ActivityBarTab) => {
    if (activeActivityTab === tab) {
      setShowPrimarySidebar((prev) => !prev);
    } else {
      setActiveActivityTab(tab);
      setShowPrimarySidebar(true);
    }
  }, [activeActivityTab]);

  // 터미널 명령 제출
  const handleTerminalSubmit = useCallback((e?: React.FormEvent) => {
    e?.preventDefault();
    if (!terminalCommandInput.trim()) return;

    const cmd = terminalCommandInput.trim();
    setTerminalSessions((prev) =>
      prev.map((sess) => {
        if (sess.id !== activeTerminalId) return sess;
        let response = '';
        if (cmd === 'clear') return { ...sess, history: [] };
        if (cmd === 'pnpm lint') response = 'Found 0 errors. Finished in 0.8s on 176 files.';
        else if (cmd === 'pnpm typecheck') response = '> tsc -b (Success, 0 errors)';
        else response = `Command executed: ${cmd}`;
        return {
          ...sess,
          history: [...sess.history, `PS C:\\AI_Projects\\WebNovelAssistant\\VibePatchNote> ${cmd}`, response],
        };
      })
    );
    setTerminalCommandInput('');
  }, [activeTerminalId, terminalCommandInput]);

  // 터미널 세션 추가
  const handleAddTerminalSession = useCallback(() => {
    const newId = `bash-${Date.now()}`;
    setTerminalSessions((prev) => [
      ...prev,
      {
        id: newId,
        name: `bash ${prev.length + 1}`,
        history: ['Welcome to Antigravity Integrated Bash Console'],
      },
    ]);
    setActiveTerminalId(newId);
  }, []);

  // AI 프롬프트 전송
  const handleSendPrompt = useCallback(() => {
    if (!promptInput.trim()) return;

    const userPrompt = promptInput.trim();
    const userMsg: ChatMessageItem = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
      content: userPrompt,
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setPromptInput('');
    setIsAiStreaming(true);

    setTimeout(() => {
      const agentReply: ChatMessageItem = {
        id: `msg-${Date.now() + 1}`,
        sender: 'agent',
        timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
        content: `"${userPrompt}" 요청에 따른 에디터 탭 및 레이아웃 상태를 동기화했습니다.`,
      };
      setChatMessages((prev) => [...prev, agentReply]);
      setIsAiStreaming(false);
    }, 1000);
  }, [promptInput]);

  return {
    // 레이아웃 토글 & 너비/높이
    showPrimarySidebar,
    setShowPrimarySidebar,
    showSecondarySidebar,
    setShowSecondarySidebar,
    showBottomPanel,
    setShowBottomPanel,
    primarySidebarWidth,
    secondarySidebarWidth,
    bottomPanelHeight,
    splitRatio,
    isDraggingAnyResizer,

    // 리사이저 마우스 핸들러
    handleMouseDownPrimaryResizer,
    handleMouseDownSecondaryResizer,
    handleMouseDownBottomResizer,
    handleMouseDownSplitResizer,

    // 탭
    activeActivityTab,
    handleSelectActivityTab,
    activeBottomTab,
    setActiveBottomTab,

    // 파일 트리
    fileTree,
    handleToggleFolder,
    handleOpenFile,

    // 멀티 Pane 에디터
    isSplitEditor,
    setIsSplitEditor,
    pane1Tabs,
    pane1ActiveId,
    setPane1ActiveId,
    pane1ActiveTab,
    pane2Tabs,
    pane2ActiveId,
    setPane2ActiveId,
    pane2ActiveTab,
    handleCloseTab,
    handleMoveTab,
    handleReorderTab,
    handleDropItem,
    handleContentChange,
    cursorPosition,
    setCursorPosition,

    // 터미널
    terminalSessions,
    activeTerminalId,
    setActiveTerminalId,
    terminalCommandInput,
    setTerminalCommandInput,
    handleTerminalSubmit,
    handleAddTerminalSession,

    // AI
    chatMessages,
    promptInput,
    setPromptInput,
    selectedModel,
    setSelectedModel,
    isAiStreaming,
    handleSendPrompt,

    // 실제 백엔드 스캐폴드/와이어프레임 데이터 및 핸들러
    scaffoldId,
    detail,
    isLoadingScaffold,
    scaffoldError,
    syncState,
    liveHtml,
    liveMarkdown,
    handleWireframeChangeHtml,
    handlePageWireframeChangeHtml,
    handleWireframeChangeMarkdown,
    saveImmediately,
    reloadScaffold,
  };
}
