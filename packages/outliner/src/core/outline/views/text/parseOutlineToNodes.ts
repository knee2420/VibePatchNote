/**
 * @file parseOutlineToNodes.ts
 * @description 들여쓴 텍스트, Markdown 중첩 목록, 또는 JSON 데이터를 계층적 OutlineNode 트리로 파싱
 */

import { generateNodeId } from '../../model/id';
import type { OutlineNode, OutlineNodeType } from '../../model/types';
import { isWebTarget } from '../../queries/fileTarget';

/** 노드 트리의 모든 ID를 새로 발급하여 복제 */
export function cloneTreeWithNewIds(nodes: OutlineNode[]): OutlineNode[] {
  const now = Date.now();
  return nodes.map((node) => ({
    ...node,
    id: generateNodeId(),
    createdAt: now,
    updatedAt: now,
    children: cloneTreeWithNewIds(node.children ?? []),
  }));
}

/** JSON 텍스트에서 노드 트리를 감지하여 복원 */
function tryParseJsonNodes(text: string): OutlineNode[] | null {
  const trimmed = text.trim();
  if (!trimmed.startsWith('[') && !trimmed.startsWith('{')) return null;

  try {
    const parsed = JSON.parse(trimmed) as unknown;
    if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'object' && parsed[0] !== null && 'text' in parsed[0]) {
      return cloneTreeWithNewIds(parsed as OutlineNode[]);
    }
    if (typeof parsed === 'object' && parsed !== null && 'rootNodes' in parsed && Array.isArray((parsed as { rootNodes: unknown }).rootNodes)) {
      return cloneTreeWithNewIds((parsed as { rootNodes: OutlineNode[] }).rootNodes);
    }
  } catch {
    // JSON 아님 -> 텍스트 파싱으로 폴백
  }
  return null;
}

interface ParsedLineInfo {
  indent: number;
  rawText: string;
  isBullet: boolean;
  boxCompleted?: boolean;
  isDivider?: boolean;
  fileTarget?: string;
  cleanedText: string;
}

/** 한 줄의 들여쓰기 공백 수 및 불릿/체크박스/파일 파싱 */
function parseLine(line: string): ParsedLineInfo | null {
  if (line.trim().length === 0) return null;

  // 들여쓰기 측정 (탭은 스페이스 2칸으로 환산)
  let indent = 0;
  let idx = 0;
  while (idx < line.length) {
    const ch = line[idx];
    if (ch === ' ') {
      indent += 1;
      idx++;
    } else if (ch === '\t') {
      indent += 2;
      idx++;
    } else {
      break;
    }
  }

  const content = line.slice(idx);
  let isBullet = false;
  let boxCompleted: boolean | undefined;
  let isDivider = false;
  let text = content;

  // 마크다운 불릿 기호 감지 (- , * , + , 1. )
  const bulletMatch = /^(?:[-*+]|\d+\.)\s+/.exec(text);
  if (bulletMatch) {
    isBullet = true;
    text = text.slice(bulletMatch[0].length);
  }

  // 구분선 감지
  if (text.trim() === '---' || text.trim() === '***') {
    isDivider = true;
    text = '';
  }

  // 체크박스 감지 (- [ ] 또는 - [x])
  const checkMatch = /^\[([ xX])\]\s*/.exec(text);
  if (checkMatch) {
    boxCompleted = checkMatch[1].toLowerCase() === 'x';
    text = text.slice(checkMatch[0].length);
  }

  // 딸린 파일 감지 (![[target]] 또는 끝의 웹 주소)
  let fileTarget: string | undefined;
  const embedMatch = /!\[\[([^\]]+)\]\]\s*$/.exec(text);
  if (embedMatch) {
    fileTarget = embedMatch[1];
    text = text.slice(0, embedMatch.index).trim();
  } else {
    // 텍스트 맨 끝의 웹 URL 감지
    const urlMatch = /(https?:\/\/\S+)\s*$/.exec(text);
    if (urlMatch && isWebTarget(urlMatch[1])) {
      fileTarget = urlMatch[1];
      text = text.slice(0, urlMatch.index).trim();
    }
  }

  return {
    indent,
    rawText: line,
    isBullet,
    boxCompleted,
    isDivider,
    fileTarget,
    cleanedText: text,
  };
}

/**
 * 들여쓴 텍스트나 Markdown 목록 문자열을 OutlineNode 트리로 파싱
 */
export function parseOutlineToNodes(rawText: string): OutlineNode[] {
  const jsonNodes = tryParseJsonNodes(rawText);
  if (jsonNodes) return jsonNodes;

  const lines = rawText.split(/\r?\n/);
  const now = Date.now();

  interface StackEntry {
    indent: number;
    node: OutlineNode;
  }

  const roots: OutlineNode[] = [];
  const stack: StackEntry[] = [];

  for (const line of lines) {
    const info = parseLine(line);
    if (!info) continue;

    // 만약 불릿 기호가 없고 앞선 노드가 존재하며, 앞선 노드보다 더 깊이 들여써진 일반 텍스트라면
    // 앞선 노드의 '부연설명 노트(note)'로 취급
    if (!info.isBullet && !info.isDivider && stack.length > 0 && info.indent > stack[stack.length - 1].indent) {
      const lastNode = stack[stack.length - 1].node;
      lastNode.note = lastNode.note ? `${lastNode.note}\n${info.cleanedText}` : info.cleanedText;
      continue;
    }

    // 새 노드 생성
    let nodeType: OutlineNodeType = 'bullet';
    if (info.isDivider) {
      nodeType = 'divider';
    } else if (info.boxCompleted !== undefined) {
      nodeType = 'todo';
    }

    const newNode: OutlineNode = {
      id: generateNodeId(),
      text: info.cleanedText,
      nodeType,
      isCompleted: info.boxCompleted,
      file: info.fileTarget ? { target: info.fileTarget } : undefined,
      children: [],
      createdAt: now,
      updatedAt: now,
    };

    // 스택에서 현재 indent보다 크거나 같은 엔트리들을 pop
    while (stack.length > 0 && stack[stack.length - 1].indent >= info.indent) {
      stack.pop();
    }

    if (stack.length === 0) {
      roots.push(newNode);
    } else {
      const parent = stack[stack.length - 1].node;
      parent.children.push(newNode);
    }

    stack.push({ indent: info.indent, node: newNode });
  }

  return roots;
}
