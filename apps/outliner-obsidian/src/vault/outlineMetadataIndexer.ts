/**
 * @file outlineMetadataIndexer.ts
 * @description .outline 파일 내부의 [[위키링크]]·#태그와 불릿에 딸린 파일을 추출하여 옵시디언 MetadataCache 및 resolvedLinks에 공식 등록
 * - 옵시디언 그래프 뷰(Graph View), 백링크 패널(Backlinks)과 공식 연결선 형성
 */

import { type App, type CachedMetadata, type ReferenceCache, type TagCache, TFile } from 'obsidian';
import { type OutlineNode, getTargetName, isWebTarget } from '@vibe/outliner/core';
import { parseProjectFile } from '@vibe/outliner/dto';

const WIKI_LINK_REGEX = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;
const TAG_REGEX = /(?:^|\s)(#[a-zA-Z0-9_\uAC00-\uD7A3/-]+)/g;

/** 불릿의 글자·노트와, 불릿에 딸린 파일의 주소(웹 주소는 빼고)를 모은다. */
function collectNodeTexts(nodes: OutlineNode[], out: string[], fileTargets: string[]) {
  for (const node of nodes) {
    if (node.text) out.push(node.text);
    if (node.note) out.push(node.note);
    if (node.file && !isWebTarget(node.file.target)) fileTargets.push(node.file.target);
    if (node.children && node.children.length > 0) {
      collectNodeTexts(node.children, out, fileTargets);
    }
  }
}

export function extractOutlineMetadata(text: string): CachedMetadata {
  const parsed = parseProjectFile(text);
  if (!parsed.success) {
    return {};
  }

  const texts: string[] = [];
  const fileTargets: string[] = [];
  collectNodeTexts(parsed.project.rootNodes, texts, fileTargets);
  const combined = texts.join('\n');

  // 딸린 파일도 링크다. 그래프와 백링크에 글자 속 링크와 똑같이 잡힌다.
  const links: ReferenceCache[] = fileTargets.map((target) => ({
    link: target,
    original: target,
    displayText: getTargetName(target),
    position: {
      start: { line: 0, col: 0, offset: 0 },
      end: { line: 0, col: 0, offset: 0 },
    },
  }));
  let match: RegExpExecArray | null;

  WIKI_LINK_REGEX.lastIndex = 0;
  while ((match = WIKI_LINK_REGEX.exec(combined)) !== null) {
    const rawTarget = match[1]?.trim();
    if (rawTarget) {
      links.push({
        link: rawTarget,
        original: match[0],
        displayText: match[2]?.trim() || rawTarget,
        position: {
          start: { line: 0, col: match.index, offset: match.index },
          end: { line: 0, col: match.index + match[0].length, offset: match.index + match[0].length },
        },
      });
    }
  }

  const tags: TagCache[] = [];
  TAG_REGEX.lastIndex = 0;
  while ((match = TAG_REGEX.exec(combined)) !== null) {
    const rawTag = match[1]?.trim();
    if (rawTag) {
      tags.push({
        tag: rawTag,
        position: {
          start: { line: 0, col: match.index, offset: match.index },
          end: { line: 0, col: match.index + match[0].length, offset: match.index + match[0].length },
        },
      });
    }
  }

  return {
    links: links.length > 0 ? links : undefined,
    tags: tags.length > 0 ? tags : undefined,
  };
}

interface MetadataCacheInternal {
  resolvedLinks?: Record<string, Record<string, number>>;
  unresolvedLinks?: Record<string, Record<string, number>>;
  fileCache?: Record<string, CachedMetadata>;
  setFileCache?: (f: TFile, c: CachedMetadata) => void;
  trigger?: (event: string, ...args: unknown[]) => void;
}

/**
 * .outline 파일의 메타데이터를 옵시디언 캐시 및 resolvedLinks와 동기화
 */
export async function syncOutlineMetadata(app: App, file: TFile) {
  try {
    const content = await app.vault.read(file);
    const metadata = extractOutlineMetadata(content);

    const cacheManager = app.metadataCache as unknown as MetadataCacheInternal;

    // 1. fileCache 및 getFileCache 등록
    if (typeof cacheManager.setFileCache === 'function') {
      cacheManager.setFileCache(file, metadata);
    } else if (cacheManager.fileCache) {
      cacheManager.fileCache[file.path] = metadata;
    }

    // 2. resolvedLinks (백링크 & 그래프 뷰의 핵심 데이터 소스) 주입
    if (!cacheManager.resolvedLinks) {
      cacheManager.resolvedLinks = {};
    }
    if (!cacheManager.unresolvedLinks) {
      cacheManager.unresolvedLinks = {};
    }

    const fileResolved: Record<string, number> = {};
    const fileUnresolved: Record<string, number> = {};

    if (metadata.links) {
      for (const linkRef of metadata.links) {
        // #앵커 분리 (문서 타겟 식별)
        const [cleanDoc] = linkRef.link.split('#');
        const docName = cleanDoc.trim();
        if (!docName) continue;

        // 1) 공식 Resolver 조회
        let destFile = app.metadataCache.getFirstLinkpathDest(docName, file.path);
        if (!destFile && !docName.endsWith('.md')) {
          destFile = app.metadataCache.getFirstLinkpathDest(`${docName}.md`, file.path);
        }
        if (!destFile && !docName.endsWith('.outline')) {
          destFile = app.metadataCache.getFirstLinkpathDest(`${docName}.outline`, file.path);
        }

        // 2) Vault 전체 검색 폴백
        if (!destFile) {
          const allFiles = app.vault.getFiles();
          const baseName = docName.split('/').pop() ?? docName;
          destFile =
            allFiles.find(
              (f) =>
                f.name === baseName ||
                f.basename === baseName ||
                f.name === `${baseName}.md` ||
                f.name === `${baseName}.outline` ||
                f.path.endsWith(`/${baseName}`) ||
                f.path.endsWith(`/${docName}`)
            ) ?? null;
        }

        if (destFile) {
          fileResolved[destFile.path] = (fileResolved[destFile.path] || 0) + 1;
        } else {
          fileUnresolved[linkRef.link] = (fileUnresolved[linkRef.link] || 0) + 1;
        }
      }
    }

    cacheManager.resolvedLinks[file.path] = fileResolved;
    cacheManager.unresolvedLinks[file.path] = fileUnresolved;

    // 3. 옵시디언 내부 캐시 변경 이벤트 트리거
    // 주의: 'changed' 이벤트는 마크다운 에디터 인스턴스들의 전체 리로드를 유발하여
    // 사용자의 미저장 버퍼를 파괴할 위험이 있으므로 호출하지 않고, 링크 해결('resolve')만 안전하게 전파합니다.
    if (typeof cacheManager.trigger === 'function') {
      cacheManager.trigger('resolve', file);

      // 대상 파일들의 백링크 패널 새로고침을 위해 resolve 이벤트 전파
      for (const targetPath of Object.keys(fileResolved)) {
        const dest = app.vault.getAbstractFileByPath(targetPath);
        if (dest instanceof TFile) {
          cacheManager.trigger('resolve', dest);
        }
      }
    }
  } catch (err) {
    console.error('[VibeOutliner Indexer] 메타데이터 색인 실패:', err);
  }
}

/**
 * 지워지거나 이름이 바뀐 .outline 파일의 옛 색인을 걷어낸다.
 * 남겨 두면 그래프와 백링크에 없는 파일이 계속 보인다.
 */
export function clearOutlineMetadata(app: App, path: string) {
  const cacheManager = app.metadataCache as unknown as MetadataCacheInternal;
  const formerTargets = Object.keys(cacheManager.resolvedLinks?.[path] ?? {});

  delete cacheManager.resolvedLinks?.[path];
  delete cacheManager.unresolvedLinks?.[path];
  delete cacheManager.fileCache?.[path];

  // 이 파일이 가리키던 문서들의 백링크 패널을 새로 고친다.
  if (typeof cacheManager.trigger === 'function') {
    for (const targetPath of formerTargets) {
      const dest = app.vault.getAbstractFileByPath(targetPath);
      if (dest instanceof TFile) {
        cacheManager.trigger('resolve', dest);
      }
    }
  }
}
