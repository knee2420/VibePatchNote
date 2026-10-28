---
type: card
title: "announcement Core Package Implementation"
description: "TypeScript 및 React 기반 Announcement 컴포넌트의 소스코드 구현체와 Props 인터페이스"
resource: "../../../../99.archive/kiboui/packages/announcement/index.tsx"
timestamp: "2026-09-16"
---

# summary
Kibo UI `announcement` 패키지의 **실제 프로덕션 구현체(`index.tsx`)**로, Announcement 렌더러와 AnnouncementProps 인터페이스를 제공한다.

# elements
| id | kind | label | 무엇이 들어있나 | anchor |
|---|---|---|---|---|
| E1 | 코드 | Announcement 컴포넌트 구현체 | React 클라이언트 환경에서 동작하는 Announcement 코어 UI 렌더링 함수 | `export const Announcement = ({` |
| E2 | 인터페이스 | AnnouncementProps 타입 선언 | Announcement의 동작 제어, 스타일링 및 이벤트 콜백 Props 명세 | `export type AnnouncementProps = ComponentProps<typeof Badge> & {` |
| E3 | 구조 | Context 및 상태 동기화 | 하위 컴포넌트 간 상태 공유를 위한 Context Provider 및 훅 바인딩 | `export const` |
| E4 | 규칙 | 접근성 및 스타일 합성 | cn() 유틸리티를 통한 Tailwind 스타일 오버라이드 및 ARIA 속성 매핑 | `cn(` |

# 밖으로
- [E1, E2] 이 컴포넌트의 사용 예시와 프리뷰 명세는 `[C-announcement.md](../../apps/docs/content/components/C-announcement.md)`에서 확인한다.
- [E4] 스타일링의 기반이 되는 Tailwind CSS 변수 테마는 `[C-setup.md](../../apps/docs/content/docs/C-setup.md)`를 참조한다.

# 원문
[index.tsx](../../../../99.archive/kiboui/packages/announcement/index.tsx)
