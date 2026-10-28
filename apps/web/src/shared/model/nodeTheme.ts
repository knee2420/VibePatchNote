/**
 * 캔버스 카드에 적용할 수 있는 색상 테마 토큰.
 *
 * 특정 도메인에 종속되지 않는 순수 표현 토큰이므로 shared 에 둡니다.
 * 실제 Tailwind 클래스 매핑은 AHA 원칙에 따라 각 노드 컴포넌트가 스스로 소유합니다.
 */
export type NodeTheme = 'default' | 'yellow' | 'green' | 'blue' | 'purple';

export const NODE_THEMES: readonly NodeTheme[] = ['default', 'yellow', 'green', 'blue', 'purple'];
