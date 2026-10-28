import type { ReactNode } from 'react';

/** 멘션 대상 아이템 모델 */
export interface MentionItem {
  id: string;
  category: 'slot' | 'section' | 'doc' | 'segment' | 'snapshot';
  label: string;
  detail?: string;
  icon?: ReactNode;
}

/** 멘션 드롭다운 메뉴 Props */
export interface ContextMentionMenuProps {
  isOpen: boolean;
  query: string;
  items: MentionItem[];
  onSelect: (item: MentionItem) => void;
  onClose: () => void;
  position?: { top: number; left: number };
  className?: string;
}

/** useWorkspaceMention 반환값 */
export interface UseWorkspaceMentionReturn {
  isMentionOpen: boolean;
  mentionQuery: string;
  openMention: (query?: string) => void;
  closeMention: () => void;
  filterItems: (items: MentionItem[], query: string) => MentionItem[];
  handleInputText: (text: string, cursorPosition: number) => { isTriggered: boolean; query: string };
}
