---
type: index
title: "Kibo UI Knowledge Pipeline (Root Index)"
description: "shadcn/ui 기반 40+ 고밀도 확장 컴포넌트와 28개 빌딩 블록의 종합 지식 체계"
resource: "../../99.archive/kiboui"
timestamp: "2026-09-16"
---

원문 출처: [github.com/haydenbleasel/kibo](https://github.com/haydenbleasel/kibo) · 총 40+ 패키지 / 핵심 지식 카드 124장

# 이 지식 파이프라인은

Kibo UI는 shadcn/ui 생태계를 확장하여 단순한 버튼이나 인풋 같은 원자 부품을 넘어, **실제 업무 프로덕션에서 즉시 사용 가능한 복합 데이터 위젯(드롭존, 간트 차트, 칸반, 태그 피커, 테이블 등)과 페이지 빌딩 블록**을 제공하는 오픈소스 컴포넌트 레지스트리이다.

모든 컴포넌트는 React 19, Next.js, Tailwind CSS 변수 테마, Radix UI Primitives를 기반으로 구축되었으며, 외부 런타임 종속성을 최소화하여 개발자가 코드의 완전한 소유권(Copy & Paste 및 shadcn CLI)을 가질 수 있도록 설계되었다.

이 데이터 파이프라인은 원본 저장소의 디렉터리 구조를 1:1로 정확하게 미러링하여, 공식 가이드(`docs/`), 41개 컴포넌트 명세(`components/`), 28개 완성형 섹션 블록(`blocks/`), 그리고 40개 코어 TypeScript 구현체(`packages/*`)를 에이전트가 단 한 번의 하향식 라우팅으로 정확히 인용할 수 있도록 체계화했다.

# 지도

```text
kiboui/
├── root/                                   [모노레포 설정 및 린트 규약]            카드 4장
├── apps/docs/content/docs/                 [공식 가이드 & 아키텍처 철학]          카드 10장
├── apps/docs/content/components/           [41개 컴포넌트 사용 명세서]            카드 41장
├── apps/docs/content/blocks/               [28개 페이지 빌딩 블록]                카드 28장
└── packages/*/                             [40개 코어 TypeScript 소스코드]        카드 41장

원문: ../../99.archive/kiboui/
```

# 전체 카드

## Root Configuration & Architecture
- [Kibo UI Overview & Architecture](C-README.md) — shadcn/ui 기반 고밀도 확장 컴포넌트 라이브러리 및 커스텀 레지스트리 개요
- [Root Package & Workspace Config](C-package.md) — Kibo UI 모노레포 루트 워크스페이스 의존성 및 빌드/린트 스크립트 명세
- [Turborepo Pipeline Configuration](C-turbo.md) — Kibo UI Turborepo 빌드 캐시, dev/lint 태스크 파이프라인 구성
- [Biome Linter & Formatter Rules](C-biome.md) — 고속 Rust 기반 Biome 코드 포맷팅 및 린팅 엄격 모드 규칙

## Documentation Guides & Principles
- [Kibo UI Introduction](apps/docs/content/docs/C-index.md) — Kibo UI의 정의, shadcn/ui와의 관계 및 확장 컴포넌트 생태계 개요
- [Kibo UI Philosophy](apps/docs/content/docs/C-philosophy.md) — Composability, Simplicity, Accessibility를 관통하는 핵심 설계 철학
- [Kibo UI Project Setup](apps/docs/content/docs/C-setup.md) — 프로젝트 초기화, 패키지 설치, Tailwind 테마 변수 및 글로벌 CSS 설정 규약
- [Kibo UI Usage & CLI](apps/docs/content/docs/C-usage.md) — shadcn CLI와 Kibo 커스텀 레지스트리를 통한 컴포넌트 추가 및 활용법
- [Model Context Protocol (MCP) Integration](apps/docs/content/docs/C-mcp.md) — AI 코딩 어시스턴트에게 Kibo UI 컴포넌트 명세와 지식을 직접 주입하는 MCP 프로토콜
- [Kibo UI Core Benefits](apps/docs/content/docs/C-benefits.md) — 개발 속도 가속화, 접근성 보장, 코드 소유권 확보의 실질적 이점
- [Authoring New Components](apps/docs/content/docs/C-new-components.md) — 새로운 복합 위젯을 제작할 때 준수해야 할 구조, 네이밍, Props 컨벤션
- [Contribution Guide](apps/docs/content/docs/C-how-to-contribute.md) — 오픈소스 기여 절차, PR 작성 규칙, 모노레포 로컬 개발 환경 구동법
- [Troubleshooting & Common Issues](apps/docs/content/docs/C-troubleshooting.md) — Tailwind 변수 누락, React 19 호환성, 하이드레이션 오류 해결 가이드
- [Community & Support](apps/docs/content/docs/C-community.md) — GitHub Discussions, Discord, 이슈 트래킹 채널 및 피드백 루프

## 41 Component Documentation Specs
- [Announcement Component Spec](apps/docs/content/components/C-announcement.md) — A compound badge designed to display an announcement.
- [Avatar Stack Component Spec](apps/docs/content/components/C-avatar-stack.md) — Avatar Stack is a component that allows you to stack and overlap avatars.
- [Banner Component Spec](apps/docs/content/components/C-banner.md) — A banner is a full-width component that can be used to show a message and action to the user.
- [Calendar Component Spec](apps/docs/content/components/C-calendar.md) — The calendar view displays features on a grid calendar. Specifically it shows the end date of each feature, and groups features by day.
- [Choicebox Component Spec](apps/docs/content/components/C-choicebox.md) — Choiceboxes are a great way to show radio or checkbox options with a card style.
- [Code Block Component Spec](apps/docs/content/components/C-code-block.md) — Provides syntax highlighting, line numbers, and copy to clipboard functionality for code blocks.
- [Color Picker Component Spec](apps/docs/content/components/C-color-picker.md) — Allows users to select a color. Modeled after the color picker in Figma.
- [Combobox Component Spec](apps/docs/content/components/C-combobox.md) — Autocomplete input and command palette with a list of suggestions.
- [Comparison Component Spec](apps/docs/content/components/C-comparison.md) — A slider-based component for comparing two items in an overlay.
- [Contribution Graph Component Spec](apps/docs/content/components/C-contribution-graph.md) — A GitHub-style contribution graph component that displays activity levels over time.
- [Credit Card Component Spec](apps/docs/content/components/C-credit-card.md) — Credit card components for displaying and validating credit card information.
- [Cursor Component Spec](apps/docs/content/components/C-cursor.md) — A cursor component, great for realtime interactive applications.
- [Deck Component Spec](apps/docs/content/components/C-deck.md) — A Tinder-like swipeable card stack component with smooth animations.
- [Dialog Stack Component Spec](apps/docs/content/components/C-dialog-stack.md) — Composable stacked dialogs, useful for creating a wizard, nested form or multi-step process. It provides a consistent layout and styling for each dialog, and includes navigation components to move between them.
- [Dropzone Component Spec](apps/docs/content/components/C-dropzone.md) — Allows users to drag-and-drop files into a container to upload or process them.
- [Editor Component Spec](apps/docs/content/components/C-editor.md) — The Editor component is a powerful and flexible text editor that allows you to create and edit rich text content.
- [Gantt Component Spec](apps/docs/content/components/C-gantt.md) — The Gantt chart is a powerful tool for visualizing project schedules and tracking the progress of tasks. It provides a clear, hierarchical view of tasks, allowing you to easily identify manage project timelines.
- [Glimpse Component Spec](apps/docs/content/components/C-glimpse.md) — A component that shows a preview of a URL when hovering over a link.
- [Image Crop Component Spec](apps/docs/content/components/C-image-crop.md) — A component that allows users to crop images with customizable aspect ratios and circular cropping options.
- [Image Zoom Component Spec](apps/docs/content/components/C-image-zoom.md) — Image zoom is a component that allows you to zoom in on an image.
- [Kanban Component Spec](apps/docs/content/components/C-kanban.md) — A kanban board is a visual tool that helps you manage and visualize your work. It is a board with columns, and each column represents a status, e.g. "Backlog", "In Progress", "Done".
- [List Component Spec](apps/docs/content/components/C-list.md) — List views are a great way to show a list of tasks grouped by status and ranked by priority.
- [Marquee Component Spec](apps/docs/content/components/C-marquee.md) — Marquees are a great way to show a list of items in a horizontal scrolling motion.
- [Mini Calendar Component Spec](apps/docs/content/components/C-mini-calendar.md) — A composable mini calendar component for picking dates close to today.
- [Pill Component Spec](apps/docs/content/components/C-pill.md) — A flexible badge component designed for a variety of use cases.
- [QR Code Component Spec](apps/docs/content/components/C-qr-code.md) — QR Code is a component that generates a QR code from a string.
- [Rating Component Spec](apps/docs/content/components/C-rating.md) — A star rating component with keyboard navigation and hover effects.
- [Reel Component Spec](apps/docs/content/components/C-reel.md) — A composable, Instagram-style Reel component with progress indicators and navigation controls.
- [Relative Time Component Spec](apps/docs/content/components/C-relative-time.md) — A component that displays time in various timezones.
- [Sandbox Component Spec](apps/docs/content/components/C-sandbox.md) — The sandbox component allows you to preview and test components in a sandboxed environment.
- [Snippet Component Spec](apps/docs/content/components/C-snippet.md) — Snippet is a component that allows you to display and copy code in a tabbed interface.
- [Spinner Component Spec](apps/docs/content/components/C-spinner.md) — The Spinner component expands the shadcn spinner component with additional variants.
- [Status Component Spec](apps/docs/content/components/C-status.md) — Status components are used to display the uptime of a service.
- [Stories Component Spec](apps/docs/content/components/C-stories.md) — A carousel of friends' stories, in video, image or avatar format.
- [Table Component Spec](apps/docs/content/components/C-table.md) — Table views are used to display data in a tabular format. They are useful for displaying large amounts of data in a structured way.
- [Tags Component Spec](apps/docs/content/components/C-tags.md) — Tags are a way to apply multiple labels to an item.
- [Theme Switcher Component Spec](apps/docs/content/components/C-theme-switcher.md) — A component to switch between light, dark and system theme.
- [Ticker Component Spec](apps/docs/content/components/C-ticker.md) — A composable finance ticker for displaying symbols, prices and changes.
- [Tree Component Spec](apps/docs/content/components/C-tree.md) — A composable tree component with animated expand/collapse and customizable nodes for displaying hierarchical data structures.
- [Typography Component Spec](apps/docs/content/components/C-typography.md) — A component for applying consistent typography styles across your application.
- [Video Player Component Spec](apps/docs/content/components/C-video-player.md) — A composable, shadcn/ui styled video player component that uses the media-chrome library.

## 28 Page Building Blocks
- [About Block Spec](apps/docs/content/blocks/C-about.md) — An about block showcasing company information, achievements, and team content.
- [Awards Block Spec](apps/docs/content/blocks/C-awards.md) — An awards block showcasing achievements, recognitions, and accolades in a table layout.
- [Blog Block Spec](apps/docs/content/blocks/C-blog.md) — A blog post grid section with cards featuring images, titles, authors, summaries, and read more links.
- [Blog Post Block Spec](apps/docs/content/blocks/C-blogpost.md) — A full blog post layout with hero image, author avatar, publication date, and prose content with alerts, tables, and blockquotes.
- [Careers Block Spec](apps/docs/content/blocks/C-careers.md) — A component displaying job openings with categories, titles, and locations, styled with a central heading and grid layout for job listings.
- [Case Studies Block Spec](apps/docs/content/blocks/C-case-studies.md) — A case studies section with testimonial quotes, customer stats, and ROI metrics in a two-column layout.
- [Case Study Block Spec](apps/docs/content/blocks/C-case-study.md) — A detailed case study page with prose content and a company info sidebar featuring logo, industry, location, and website details.
- [Changelog Block Spec](apps/docs/content/blocks/C-changelog.md) — A changelog section with versioned entries, dates, descriptions, feature lists, images, and action buttons.
- [Code Example Block Spec](apps/docs/content/blocks/C-code-example.md) — A code example section with multi-language tabs, syntax highlighting, and copy functionality alongside marketing content.
- [Codebase Block Spec](apps/docs/content/blocks/C-codebase.md) — A codebase block combines a file explorer tree with a code viewer for browsing and viewing source code.
- [Collaborative Canvas Block Spec](apps/docs/content/blocks/C-collaborative-canvas.md) — Create an online, realtime collaborative canvas with Kibo UI components.
- [Community Block Spec](apps/docs/content/blocks/C-community.md) — A component showcasing 4 social platform links in a 1-2-4 column layout, encouraging community engagement through actions like follow, connect, contribute, and join.
- [Compare Block Spec](apps/docs/content/blocks/C-compare.md) — A comparison table component with 3 columns highlighting features of two frameworks with tooltips for additional info.
- [Compliance Block Spec](apps/docs/content/blocks/C-compliance.md) — A two-column component featuring compliance and security features, highlighted with badges, images, and outlined sections for automated audit trails, monitoring, and reporting.
- [Contact Block Spec](apps/docs/content/blocks/C-contact.md) — A contact block with title, description, and a grid of contact options including email, address, phone, and live chat.
- [CTA Block Spec](apps/docs/content/blocks/C-cta.md) — A call-to-action block with a heading, description, and action buttons to drive user engagement.
- [Download Block Spec](apps/docs/content/blocks/C-download.md) — A component displaying download options for desktop, iOS, and Android, alongside descriptions and buttons/links for each platform, arranged in a three-column layout.
- [Experience Block Spec](apps/docs/content/blocks/C-experience.md) — A component listing experiences with download CV button, 3-column layout for period, title/description, and company.
- [FAQ Block Spec](apps/docs/content/blocks/C-faq.md) — An accordion-style FAQ block with a customizable heading and list of questions and answers.
- [Feature Block Spec](apps/docs/content/blocks/C-feature.md) — A feature block showcasing product features with a 2-column layout featuring a title, description, buttons, and an image.
- [Footer Block Spec](apps/docs/content/blocks/C-footer.md) — A footer component with a logo and tagline, 1-4 columns of menu items, and a bottom row for copyright and policy links.
- [Form Block Spec](apps/docs/content/blocks/C-form.md) — A form block allows users to submit data to a website or application.
- [Hero Block Spec](apps/docs/content/blocks/C-hero.md) — A hero block is a large, full-width block that is used to introduce a new product or service.
- [Pricing Block Spec](apps/docs/content/blocks/C-pricing.md) — A pricing page with a list of plans and features.
- [Roadmap Block Spec](apps/docs/content/blocks/C-roadmap.md) — A roadmap block is a large, full-width block that is used to introduce a new product or service.
- [Stats Block Spec](apps/docs/content/blocks/C-stats.md) — A statistics display block with a heading, description, link, and a responsive 4-column grid for key metrics.
- [Team Block Spec](apps/docs/content/blocks/C-team.md) — A team showcase block with a title, description, and a responsive grid of team member avatars, names, and roles.
- [Testimonial Block Spec](apps/docs/content/blocks/C-testimonial.md) — A testimonial block with a central quote, author's name, role, and avatar in a clean vertical layout.

## 40 Core Component Packages (TypeScript Source)
- [announcement Core Package Implementation](packages/announcement/C-index.md) — TypeScript 및 React 기반 Announcement 컴포넌트의 소스코드 구현체와 Props 인터페이스
- [avatar-stack Core Package Implementation](packages/avatar-stack/C-index.md) — TypeScript 및 React 기반 AvatarStack 컴포넌트의 소스코드 구현체와 Props 인터페이스
- [banner Core Package Implementation](packages/banner/C-index.md) — TypeScript 및 React 기반 BannerContext 컴포넌트의 소스코드 구현체와 Props 인터페이스
- [calendar Core Package Implementation](packages/calendar/C-index.md) — TypeScript 및 React 기반 useCalendarMonth 컴포넌트의 소스코드 구현체와 Props 인터페이스
- [choicebox Core Package Implementation](packages/choicebox/C-index.md) — TypeScript 및 React 기반 Choicebox 컴포넌트의 소스코드 구현체와 Props 인터페이스
- [code-block Core Package Implementation](packages/code-block/C-index.md) — TypeScript 및 React 기반 CodeBlock 컴포넌트의 소스코드 구현체와 Props 인터페이스
- [color-picker Core Package Implementation](packages/color-picker/C-index.md) — TypeScript 및 React 기반 useColorPicker 컴포넌트의 소스코드 구현체와 Props 인터페이스
- [combobox Core Package Implementation](packages/combobox/C-index.md) — TypeScript 및 React 기반 Combobox 컴포넌트의 소스코드 구현체와 Props 인터페이스
- [comparison Core Package Implementation](packages/comparison/C-index.md) — TypeScript 및 React 기반 Comparison 컴포넌트의 소스코드 구현체와 Props 인터페이스
- [contribution-graph Core Package Implementation](packages/contribution-graph/C-index.md) — TypeScript 및 React 기반 ContributionGraph 컴포넌트의 소스코드 구현체와 Props 인터페이스
- [credit-card Core Package Implementation](packages/credit-card/C-index.md) — TypeScript 및 React 기반 CreditCard 컴포넌트의 소스코드 구현체와 Props 인터페이스
- [cursor Core Package Implementation](packages/cursor/C-index.md) — TypeScript 및 React 기반 Cursor 컴포넌트의 소스코드 구현체와 Props 인터페이스
- [deck Core Package Implementation](packages/deck/C-index.md) — TypeScript 및 React 기반 Deck 컴포넌트의 소스코드 구현체와 Props 인터페이스
- [dialog-stack Core Package Implementation](packages/dialog-stack/C-index.md) — TypeScript 및 React 기반 DialogStack 컴포넌트의 소스코드 구현체와 Props 인터페이스
- [dropzone Core Package Implementation](packages/dropzone/C-index.md) — TypeScript 및 React 기반 Dropzone 컴포넌트의 소스코드 구현체와 Props 인터페이스
- [editor Core Package Implementation](packages/editor/C-index.md) — TypeScript 및 React 기반 defaultSlashSuggestions: 컴포넌트의 소스코드 구현체와 Props 인터페이스
- [gantt Core Package Implementation](packages/gantt/C-index.md) — TypeScript 및 React 기반 useGanttDragging 컴포넌트의 소스코드 구현체와 Props 인터페이스
- [glimpse Core Package Implementation](packages/glimpse/C-index.md) — TypeScript 및 React 기반 Glimpse 컴포넌트의 소스코드 구현체와 Props 인터페이스
- [image-crop Core Package Implementation](packages/image-crop/C-index.md) — TypeScript 및 React 기반 ImageCrop 컴포넌트의 소스코드 구현체와 Props 인터페이스
- [image-zoom Core Package Implementation](packages/image-zoom/C-index.md) — TypeScript 및 React 기반 ImageZoom 컴포넌트의 소스코드 구현체와 Props 인터페이스
- [kanban Core Package Implementation](packages/kanban/C-index.md) — TypeScript 및 React 기반 KanbanBoard 컴포넌트의 소스코드 구현체와 Props 인터페이스
- [list Core Package Implementation](packages/list/C-index.md) — TypeScript 및 React 기반 ListItems 컴포넌트의 소스코드 구현체와 Props 인터페이스
- [marquee Core Package Implementation](packages/marquee/C-index.md) — TypeScript 및 React 기반 Marquee 컴포넌트의 소스코드 구현체와 Props 인터페이스
- [mini-calendar Core Package Implementation](packages/mini-calendar/C-index.md) — TypeScript 및 React 기반 MiniCalendar 컴포넌트의 소스코드 구현체와 Props 인터페이스
- [pill Core Package Implementation](packages/pill/C-index.md) — TypeScript 및 React 기반 Pill 컴포넌트의 소스코드 구현체와 Props 인터페이스
- [qr-code Core Package Implementation](packages/qr-code/C-index.md) — TypeScript 및 React 기반 QRCode 컴포넌트의 소스코드 구현체와 Props 인터페이스
- [rating Core Package Implementation](packages/rating/C-index.md) — TypeScript 및 React 기반 RatingButton 컴포넌트의 소스코드 구현체와 Props 인터페이스
- [reel Core Package Implementation](packages/reel/C-index.md) — TypeScript 및 React 기반 Reel 컴포넌트의 소스코드 구현체와 Props 인터페이스
- [relative-time Core Package Implementation](packages/relative-time/C-index.md) — TypeScript 및 React 기반 RelativeTime 컴포넌트의 소스코드 구현체와 Props 인터페이스
- [sandbox Core Package Implementation](packages/sandbox/C-index.md) — TypeScript 및 React 기반 SandboxProvider 컴포넌트의 소스코드 구현체와 Props 인터페이스
- [snippet Core Package Implementation](packages/snippet/C-index.md) — TypeScript 및 React 기반 Snippet 컴포넌트의 소스코드 구현체와 Props 인터페이스
- [spinner Core Package Implementation](packages/spinner/C-index.md) — TypeScript 및 React 기반 Spinner 컴포넌트의 소스코드 구현체와 Props 인터페이스
- [status Core Package Implementation](packages/status/C-index.md) — TypeScript 및 React 기반 Status 컴포넌트의 소스코드 구현체와 Props 인터페이스
- [stories Core Package Implementation](packages/stories/C-index.md) — TypeScript 및 React 기반 Stories 컴포넌트의 소스코드 구현체와 Props 인터페이스
- [table Core Package Implementation](packages/table/C-index.md) — TypeScript 및 React 기반 TableContext 컴포넌트의 소스코드 구현체와 Props 인터페이스
- [tags Core Package Implementation](packages/tags/C-index.md) — TypeScript 및 React 기반 Tags 컴포넌트의 소스코드 구현체와 Props 인터페이스
- [theme-switcher Core Package Implementation](packages/theme-switcher/C-index.md) — TypeScript 및 React 기반 ThemeSwitcher 컴포넌트의 소스코드 구현체와 Props 인터페이스
- [ticker Core Package Implementation](packages/ticker/C-index.md) — TypeScript 및 React 기반 useTickerContext 컴포넌트의 소스코드 구현체와 Props 인터페이스
- [tree Core Package Implementation](packages/tree/C-index.md) — TypeScript 및 React 기반 TreeProvider 컴포넌트의 소스코드 구현체와 Props 인터페이스
- [typography Core Stylesheet](packages/typography/C-index.md) — Kibo UI 전역 타이포그래피(Heading, Body, Code, List) CSS 스타일 시트 명세
- [video-player Core Package Implementation](packages/video-player/C-index.md) — TypeScript 및 React 기반 VideoPlayer 컴포넌트의 소스코드 구현체와 Props 인터페이스

# 가로축 — 전체를 관통하는 핵심 줄기

1. **[복합 위젯 컴포넌트 파이프라인]**
   [C-setup.md](apps/docs/content/docs/C-setup.md) 테마 토큰 → [C-dropzone.md](apps/docs/content/components/C-dropzone.md) 사용 명세 → [packages/dropzone/C-index.md](packages/dropzone/C-index.md) 구현체
   → shadcn 기본 테마 변수를 바탕으로 고수준 컴포넌트 스펙을 확인하고, 실제 복사해 쓸 소스코드로 직행하는 표준 흐름.

2. **[블록 기반 고속 페이지 어셈블리]**
   [C-philosophy.md](apps/docs/content/docs/C-philosophy.md) 합성 가능성 → [C-hero.md](apps/docs/content/blocks/C-hero.md) 블록 조립 → [packages/marquee/C-index.md](packages/marquee/C-index.md) 원자 위젯
   → 여러 위젯을 조합해 완성형 페이지 섹션을 즉시 구축하는 탑다운 조립 흐름.

3. **[AI 에이전트 연동 표준]**
   [C-mcp.md](apps/docs/content/docs/C-mcp.md) MCP 프로토콜 → Kibo 컴포넌트 레지스트리 자동 탐색 → 코드베이스 자동 주입
   → AI 코딩 어시스턴트가 Kibo UI의 정확한 props와 패턴을 학습해 무결점 코드를 작성하게 하는 지능형 파이프라인.

# 어디로 갈지 (목적별 라우팅 테이블)

| 개발/설계 시 필요한 것 | 바로 가야 할 카드 / 인덱스 |
|---|---|
| 파일 드롭존, 업로드 UI가 필요할 때 | [C-dropzone.md](apps/docs/content/components/C-dropzone.md) / [dropzone 코드](packages/dropzone/C-index.md) |
| 태그 입력기, 다중 셀렉트 피커가 필요할 때 | [C-tags.md](apps/docs/content/components/C-tags.md) / [tags 코드](packages/tags/C-index.md) |
| 계층형 트리 뷰 구조가 필요할 때 | [C-tree.md](apps/docs/content/components/C-tree.md) / [tree 코드](packages/tree/C-index.md) |
| 간트 차트, 일정 시각화가 필요할 때 | [C-gantt.md](apps/docs/content/components/C-gantt.md) / [gantt 코드](packages/gantt/C-index.md) |
| 칸반 보드 작업 관리가 필요할 때 | [C-kanban.md](apps/docs/content/components/C-kanban.md) / [kanban 코드](packages/kanban/C-index.md) |
| 리치 텍스트 에디터가 필요할 때 | [C-editor.md](apps/docs/content/components/C-editor.md) / [editor 코드](packages/editor/C-index.md) |
| Kibo UI 설치 및 테마 토큰 설정법을 알고 싶을 때 | [C-setup.md](apps/docs/content/docs/C-setup.md) |
| AI 어시스턴트에 Kibo UI 지식을 주입하고 싶을 때 | [C-mcp.md](apps/docs/content/docs/C-mcp.md) |
