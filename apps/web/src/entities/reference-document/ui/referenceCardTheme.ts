import type { NodeTheme } from '@/shared/model';

interface ReferenceCardThemeStyle {
  container: string;
  header: string;
}

/**
 * 참고 문서 카드의 테마별 Tailwind 클래스 맵.
 *
 * 다른 노드 카드와 값이 비슷해 보여도 합치지 않습니다. (AHA — P6)
 * 카드마다 배경 투명도와 테두리 강도가 독립적으로 조정되기 때문입니다.
 */
const themeStyles: Record<string, ReferenceCardThemeStyle> = {
  default: { container: 'bg-white border-slate-300', header: 'bg-slate-50 border-slate-200 text-slate-700' },
  yellow: { container: 'bg-amber-50/70 border-amber-300', header: 'bg-amber-100 border-amber-200 text-amber-900' },
  green: { container: 'bg-emerald-50/70 border-emerald-300', header: 'bg-emerald-100 border-emerald-200 text-emerald-900' },
  blue: { container: 'bg-sky-50/70 border-sky-300', header: 'bg-sky-100 border-sky-200 text-sky-900' },
  purple: { container: 'bg-purple-50/70 border-purple-300', header: 'bg-purple-100 border-purple-200 text-purple-900' },
};

export function getReferenceCardTheme(theme?: NodeTheme): ReferenceCardThemeStyle {
  return (typeof theme === 'string' && themeStyles[theme]) || themeStyles.default;
}
