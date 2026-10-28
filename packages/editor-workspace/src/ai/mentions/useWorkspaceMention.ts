import { useState, useCallback } from 'react';
import type { MentionItem, UseWorkspaceMentionReturn } from './types';

/**
 * useWorkspaceMention (안티그래비티 @ 멘션 트리거 제어 훅)
 *
 * 텍스트 입력 중 '@' 키 입력을 감지하고 쿼리 문자열을 추출하여 멘션 메뉴를 제어합니다.
 */
export function useWorkspaceMention(): UseWorkspaceMentionReturn {
  const [isMentionOpen, setIsMentionOpen] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');

  const openMention = useCallback((query: string = '') => {
    setMentionQuery(query);
    setIsMentionOpen(true);
  }, []);

  const closeMention = useCallback(() => {
    setIsMentionOpen(false);
    setMentionQuery('');
  }, []);

  const handleInputText = useCallback((text: string, cursorPosition: number) => {
    const textBeforeCursor = text.slice(0, cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');

    if (lastAtIndex !== -1) {
      const charBeforeAt = lastAtIndex > 0 ? textBeforeCursor[lastAtIndex - 1] : ' ';
      // 공백 뒤에 오는 @만 트리거 (이메일 등 오탐 방지)
      if (/\s/.test(charBeforeAt) || lastAtIndex === 0) {
        const query = textBeforeCursor.slice(lastAtIndex + 1);
        if (!/\s/.test(query)) {
          setIsMentionOpen(true);
          setMentionQuery(query);
          return { isTriggered: true, query };
        }
      }
    }

    setIsMentionOpen(false);
    setMentionQuery('');
    return { isTriggered: false, query: '' };
  }, []);

  const filterItems = useCallback((items: MentionItem[], query: string) => {
    if (!query) return items;
    const q = query.toLowerCase();
    return items.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        (item.detail?.toLowerCase() || '').includes(q) ||
        item.category.toLowerCase().includes(q)
    );
  }, []);

  return {
    isMentionOpen,
    mentionQuery,
    openMention,
    closeMention,
    filterItems,
    handleInputText,
  };
}
