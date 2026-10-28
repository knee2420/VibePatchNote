---
type: index
title: "Origin UI Knowledge Pipeline (Root Index)"
description: "Tailwind CSS 및 React 19 기반 400+ 프로덕션 UI 위젯과 54개 코어 컴포넌트의 지식 체계"
resource: "../../99.archive/originui/"
timestamp: "2026-09-06"
---

원문 출처: [github.com/origin-space/originui](https://github.com/origin-space/originui) · 총 400+ 컴포넌트 / 핵심 지식 카드 120장

# 이 지식 파이프라인은

Origin UI는 Tailwind CSS, React 19, Radix UI Primitives를 기반으로 구축된 최상위 카피-페이스트 디자인 시스템이다.
일반적인 shadcn/ui 가 버튼, 인풋 등 원자 단위 부품만 제공하는 한계를 넘어, 실무 프로덕션 애플리케이션에서 즉시 복사해 쓸 수 있는 수백 개의 복합 위젯(Composite UI) 패턴을 제공한다.

이 데이터 파이프라인은 `originui` 저장소의 디렉터리 구조를 1:1로 정확히 모사하여, 공식 사용법(Docs)부터 실제 TypeScript 구현체(Core Code), 실무 변형(Variants)까지 필요한 컴포넌트를 에이전트가 단 한 번의 라우팅으로 정확히 인용할 수 있도록 체계화했다.

# 지도

```text
originui/
├── root/                               [모노레포 설정 및 에이전트 지침]       카드 4장
├── apps/ui/content/docs/(root)/        [공식 가이드 & 스타일링 원칙]         카드 7장
├── apps/ui/content/docs/components/    [56개 컴포넌트 사용 명세서]          카드 55장
└── packages/ui/src/components/         [54개 코어 TypeScript 구현체]         카드 54장

원문: ../../99.archive/originui/
```

# 전체 카드

## Root Configuration & Architecture
- [Origin UI Overview](C-README.md) — Tailwind CSS 및 React 기반의 모던 카피-페이스트 UI 컴포넌트 라이브러리 개요
- [Agent Instructions](C-AGENTS.md) — AI 에이전트 전용 코딩 및 컴포넌트 생성 가이드라인
- [Root Package Config](C-package.md) — 모노레포 루트 패키지 설정 및 워크스페이스 스크립트
- [Turborepo Pipeline Config](C-turbo.md) — Turborepo 캐시 및 태스크 의존성 파이프라인 설정

## Documentation Guides & Principles
- [Changelog Docs](apps/ui/content/docs/%28root%29/C-changelog.md) — Breaking changes, migration guides, and notable updates.
- [Get Started Docs](apps/ui/content/docs/%28root%29/C-get-started.md) — A quick guide to adding your first component.
- [Introduction Docs](apps/ui/content/docs/%28root%29/C-index.md) — A new, modern UI component library built on top of Base UI. Built for developers and AI.
- [Migrating from Radix Docs](apps/ui/content/docs/%28root%29/C-radix-migration.md) — A practical guide for migrating from Radix-based libraries to coss ui components.
- [Roadmap Docs](apps/ui/content/docs/%28root%29/C-roadmap.md) — Current state of coss ui and where we’re headed next.
- [Skills Docs](apps/ui/content/docs/%28root%29/C-skills.md) — Give your AI assistant deep knowledge of coss ui components, patterns, and best practices.
- [Styling Docs](apps/ui/content/docs/%28root%29/C-styling.md) — A guide to styling components with our color system.

## 56 Component Documentation Specs
- [Accordion Component Spec](apps/ui/content/docs/components/C-accordion.md) — A set of collapsible panels with headings and content.
- [Alert Dialog Component Spec](apps/ui/content/docs/components/C-alert-dialog.md) — A dialog that requires user response to proceed.
- [Alert Component Spec](apps/ui/content/docs/components/C-alert.md) — A callout for displaying important information.
- [Autocomplete Component Spec](apps/ui/content/docs/components/C-autocomplete.md) — An input that suggests options as you type.
- [Avatar Component Spec](apps/ui/content/docs/components/C-avatar.md) — An image element with a fallback for representing the user.
- [Badge Component Spec](apps/ui/content/docs/components/C-badge.md) — A badge or a component that looks like a badge.
- [Breadcrumb Component Spec](apps/ui/content/docs/components/C-breadcrumb.md) — Displays the path to the current resource using a hierarchy of links.
- [Button Component Spec](apps/ui/content/docs/components/C-button.md) — A button or a component that looks like a button.
- [Calendar Component Spec](apps/ui/content/docs/components/C-calendar.md) — A date picker component with range and multi-select support.
- [Card Component Spec](apps/ui/content/docs/components/C-card.md) — A content container for grouping related information.
- [Checkbox Group Component Spec](apps/ui/content/docs/components/C-checkbox-group.md) — Provides shared state to a series of checkboxes.
- [Checkbox Component Spec](apps/ui/content/docs/components/C-checkbox.md) — A control allowing the user to toggle between checked and not checked.
- [Collapsible Component Spec](apps/ui/content/docs/components/C-collapsible.md) — A collapsible panel controlled by a button trigger.
- [Combobox Component Spec](apps/ui/content/docs/components/C-combobox.md) — An input combined with a list of predefined items to select.
- [Command Component Spec](apps/ui/content/docs/components/C-command.md) — A command palette component built with Dialog and Autocomplete for searching and executing commands.
- [Context Menu Component Spec](apps/ui/content/docs/components/C-context-menu.md) — A menu that appears at the pointer on right click or long press.
- [Date Picker Component Spec](apps/ui/content/docs/components/C-date-picker.md) — A date picker component built with Calendar and Popover.
- [Dialog Component Spec](apps/ui/content/docs/components/C-dialog.md) — A popup that opens on top of the entire page.
- [Drawer Component Spec](apps/ui/content/docs/components/C-drawer.md) — A panel that slides in from the edge of the screen with swipe gestures, snap points, and nested drawer support.
- [Empty Component Spec](apps/ui/content/docs/components/C-empty.md) — A container for displaying empty state information.
- [Field Component Spec](apps/ui/content/docs/components/C-field.md) — A component that provides labelling and validation for form controls.
- [Fieldset Component Spec](apps/ui/content/docs/components/C-fieldset.md) — A native fieldset element with a legend.
- [Form Component Spec](apps/ui/content/docs/components/C-form.md) — A form wrapper component that simplifies validation and submission.
- [Frame Component Spec](apps/ui/content/docs/components/C-frame.md) — A framed container for grouping related information.
- [Group Component Spec](apps/ui/content/docs/components/C-group.md) — A component for visually grouping a series of controls.
- [Input Group Component Spec](apps/ui/content/docs/components/C-input-group.md) — A flexible component for grouping inputs with addons, buttons, and other elements.
- [Input Component Spec](apps/ui/content/docs/components/C-input.md) — A native input element.
- [Kbd Component Spec](apps/ui/content/docs/components/C-kbd.md) — A component for displaying keyboard keys and shortcuts.
- [Label Component Spec](apps/ui/content/docs/components/C-label.md) — Renders an accessible label associated with controls.
- [Menu Component Spec](apps/ui/content/docs/components/C-menu.md) — A list of actions in a dropdown, enhanced with keyboard navigation.
- [Meter Component Spec](apps/ui/content/docs/components/C-meter.md) — A graphical display of a numeric value within a range.
- [Number Field Component Spec](apps/ui/content/docs/components/C-number-field.md) — A numeric input element with increment and decrement buttons, and a scrub area.
- [OTP Field Component Spec](apps/ui/content/docs/components/C-otp-field.md) — A segmented input for one-time passwords and verification codes.
- [Pagination Component Spec](apps/ui/content/docs/components/C-pagination.md) — A pagination with page navigation, next and previous links.
- [Popover Component Spec](apps/ui/content/docs/components/C-popover.md) — An accessible popup anchored to a button.
- [Preview Card Component Spec](apps/ui/content/docs/components/C-preview-card.md) — A popup that appears when a link is hovered, showing a preview for sighted users.
- [Progress Component Spec](apps/ui/content/docs/components/C-progress.md) — Displays the status of a task that takes a long time.
- [Radio Group Component Spec](apps/ui/content/docs/components/C-radio-group.md) — A set of checkable buttons where no more than one of the buttons can be checked at a time.
- [Scroll Area Component Spec](apps/ui/content/docs/components/C-scroll-area.md) — A native scroll container with custom scrollbars.
- [Segmented Control Component Spec](apps/ui/content/docs/components/C-segmented-control.md) — A visual pattern for presenting related choices, navigation destinations, filters, or content views.
- [Select Component Spec](apps/ui/content/docs/components/C-select.md) — A common form component for choosing a predefined value in a dropdown menu.
- [Separator Component Spec](apps/ui/content/docs/components/C-separator.md) — A separator element accessible to screen readers.
- [Sheet Component Spec](apps/ui/content/docs/components/C-sheet.md) — A flyout that opens from the side of the screen, based on the dialog component.
- [Skeleton Component Spec](apps/ui/content/docs/components/C-skeleton.md) — A loading state skeleton for your components.
- [Slider Component Spec](apps/ui/content/docs/components/C-slider.md) — An input where the user selects a value from within a given range.
- [Spinner Component Spec](apps/ui/content/docs/components/C-spinner.md) — An indicator that can be used to show a loading state.
- [Switch Component Spec](apps/ui/content/docs/components/C-switch.md) — A control that indicates whether a setting is on or off.
- [Table Component Spec](apps/ui/content/docs/components/C-table.md) — A simple table component for displaying tabular data.
- [Tabs Component Spec](apps/ui/content/docs/components/C-tabs.md) — A component for toggling between related panels on the same page.
- [Textarea Component Spec](apps/ui/content/docs/components/C-textarea.md) — A native textarea element.
- [Toast Component Spec](apps/ui/content/docs/components/C-toast.md) — A temporary notification that appears on screen to inform users.
- [Toggle Group Component Spec](apps/ui/content/docs/components/C-toggle-group.md) — Provides a shared state to a series of toggle buttons.
- [Toggle Component Spec](apps/ui/content/docs/components/C-toggle.md) — A two-state button that can be toggled on or off.
- [Toolbar Component Spec](apps/ui/content/docs/components/C-toolbar.md) — A container for grouping a set of buttons and controls.
- [Tooltip Component Spec](apps/ui/content/docs/components/C-tooltip.md) — A popup that appears when an element is hovered or focused, showing a hint for sighted users.

## 54 Core Component Implementations
- [accordion Implementation](packages/ui/src/components/C-accordion.md) — accordion TypeScript 코어 컴포넌트 소스코드
- [alert-dialog Implementation](packages/ui/src/components/C-alert-dialog.md) — alert-dialog TypeScript 코어 컴포넌트 소스코드
- [alert Implementation](packages/ui/src/components/C-alert.md) — alert TypeScript 코어 컴포넌트 소스코드
- [autocomplete Implementation](packages/ui/src/components/C-autocomplete.md) — autocomplete TypeScript 코어 컴포넌트 소스코드
- [avatar Implementation](packages/ui/src/components/C-avatar.md) — avatar TypeScript 코어 컴포넌트 소스코드
- [badge Implementation](packages/ui/src/components/C-badge.md) — badge TypeScript 코어 컴포넌트 소스코드
- [breadcrumb Implementation](packages/ui/src/components/C-breadcrumb.md) — breadcrumb TypeScript 코어 컴포넌트 소스코드
- [button Implementation](packages/ui/src/components/C-button.md) — button TypeScript 코어 컴포넌트 소스코드
- [calendar Implementation](packages/ui/src/components/C-calendar.md) — calendar TypeScript 코어 컴포넌트 소스코드
- [card Implementation](packages/ui/src/components/C-card.md) — card TypeScript 코어 컴포넌트 소스코드
- [checkbox-group Implementation](packages/ui/src/components/C-checkbox-group.md) — checkbox-group TypeScript 코어 컴포넌트 소스코드
- [checkbox Implementation](packages/ui/src/components/C-checkbox.md) — checkbox TypeScript 코어 컴포넌트 소스코드
- [collapsible Implementation](packages/ui/src/components/C-collapsible.md) — collapsible TypeScript 코어 컴포넌트 소스코드
- [combobox Implementation](packages/ui/src/components/C-combobox.md) — combobox TypeScript 코어 컴포넌트 소스코드
- [command Implementation](packages/ui/src/components/C-command.md) — command TypeScript 코어 컴포넌트 소스코드
- [context-menu Implementation](packages/ui/src/components/C-context-menu.md) — context-menu TypeScript 코어 컴포넌트 소스코드
- [dialog Implementation](packages/ui/src/components/C-dialog.md) — dialog TypeScript 코어 컴포넌트 소스코드
- [drawer Implementation](packages/ui/src/components/C-drawer.md) — drawer TypeScript 코어 컴포넌트 소스코드
- [empty Implementation](packages/ui/src/components/C-empty.md) — empty TypeScript 코어 컴포넌트 소스코드
- [field Implementation](packages/ui/src/components/C-field.md) — field TypeScript 코어 컴포넌트 소스코드
- [fieldset Implementation](packages/ui/src/components/C-fieldset.md) — fieldset TypeScript 코어 컴포넌트 소스코드
- [form Implementation](packages/ui/src/components/C-form.md) — form TypeScript 코어 컴포넌트 소스코드
- [frame Implementation](packages/ui/src/components/C-frame.md) — frame TypeScript 코어 컴포넌트 소스코드
- [group Implementation](packages/ui/src/components/C-group.md) — group TypeScript 코어 컴포넌트 소스코드
- [input-group Implementation](packages/ui/src/components/C-input-group.md) — input-group TypeScript 코어 컴포넌트 소스코드
- [input Implementation](packages/ui/src/components/C-input.md) — input TypeScript 코어 컴포넌트 소스코드
- [kbd Implementation](packages/ui/src/components/C-kbd.md) — kbd TypeScript 코어 컴포넌트 소스코드
- [label Implementation](packages/ui/src/components/C-label.md) — label TypeScript 코어 컴포넌트 소스코드
- [menu Implementation](packages/ui/src/components/C-menu.md) — menu TypeScript 코어 컴포넌트 소스코드
- [meter Implementation](packages/ui/src/components/C-meter.md) — meter TypeScript 코어 컴포넌트 소스코드
- [number-field Implementation](packages/ui/src/components/C-number-field.md) — number-field TypeScript 코어 컴포넌트 소스코드
- [otp-field Implementation](packages/ui/src/components/C-otp-field.md) — otp-field TypeScript 코어 컴포넌트 소스코드
- [pagination Implementation](packages/ui/src/components/C-pagination.md) — pagination TypeScript 코어 컴포넌트 소스코드
- [popover Implementation](packages/ui/src/components/C-popover.md) — popover TypeScript 코어 컴포넌트 소스코드
- [preview-card Implementation](packages/ui/src/components/C-preview-card.md) — preview-card TypeScript 코어 컴포넌트 소스코드
- [progress Implementation](packages/ui/src/components/C-progress.md) — progress TypeScript 코어 컴포넌트 소스코드
- [radio-group Implementation](packages/ui/src/components/C-radio-group.md) — radio-group TypeScript 코어 컴포넌트 소스코드
- [scroll-area Implementation](packages/ui/src/components/C-scroll-area.md) — scroll-area TypeScript 코어 컴포넌트 소스코드
- [select Implementation](packages/ui/src/components/C-select.md) — select TypeScript 코어 컴포넌트 소스코드
- [separator Implementation](packages/ui/src/components/C-separator.md) — separator TypeScript 코어 컴포넌트 소스코드
- [sheet Implementation](packages/ui/src/components/C-sheet.md) — sheet TypeScript 코어 컴포넌트 소스코드
- [sidebar Implementation](packages/ui/src/components/C-sidebar.md) — sidebar TypeScript 코어 컴포넌트 소스코드
- [skeleton Implementation](packages/ui/src/components/C-skeleton.md) — skeleton TypeScript 코어 컴포넌트 소스코드
- [slider Implementation](packages/ui/src/components/C-slider.md) — slider TypeScript 코어 컴포넌트 소스코드
- [spinner Implementation](packages/ui/src/components/C-spinner.md) — spinner TypeScript 코어 컴포넌트 소스코드
- [switch Implementation](packages/ui/src/components/C-switch.md) — switch TypeScript 코어 컴포넌트 소스코드
- [table Implementation](packages/ui/src/components/C-table.md) — table TypeScript 코어 컴포넌트 소스코드
- [tabs Implementation](packages/ui/src/components/C-tabs.md) — tabs TypeScript 코어 컴포넌트 소스코드
- [textarea Implementation](packages/ui/src/components/C-textarea.md) — textarea TypeScript 코어 컴포넌트 소스코드
- [toast Implementation](packages/ui/src/components/C-toast.md) — toast TypeScript 코어 컴포넌트 소스코드
- [toggle-group Implementation](packages/ui/src/components/C-toggle-group.md) — toggle-group TypeScript 코어 컴포넌트 소스코드
- [toggle Implementation](packages/ui/src/components/C-toggle.md) — toggle TypeScript 코어 컴포넌트 소스코드
- [toolbar Implementation](packages/ui/src/components/C-toolbar.md) — toolbar TypeScript 코어 컴포넌트 소스코드
- [tooltip Implementation](packages/ui/src/components/C-tooltip.md) — tooltip TypeScript 코어 컴포넌트 소스코드

# 가로축 — 전체를 관통하는 핵심 줄기

1. **[스타일링 원칙에서 컴포넌트 구현체로의 연결]**
   [C-styling](apps/ui/content/docs/%28root%29/C-styling.md) E1 → [C-card Spec](apps/ui/content/docs/components/C-card.md) E1 → [C-card Implementation](packages/ui/src/components/C-card.md) E3
   → Origin UI의 시맨틱 토큰과 라운딩 규칙이 실제 `<Card>` 컴포넌트의 Tailwind 클래스 조합으로 완벽히 상속되는 핵심 줄기.

2. **[복합 위젯 패턴(Composite UI) 적용 흐름]**
   [C-AGENTS](C-AGENTS.md) E2 → [C-table Spec](apps/ui/content/docs/components/C-table.md) E3 → [C-table Implementation](packages/ui/src/components/C-table.md) E1
   → 테이블, 툴바, 뱃지 등 복합 UI를 구현할 때 에이전트가 단독 `div`를 조잡하게 짜지 않고 완성형 패턴을 그대로 복제하는 표준 워크플로우.

# 어디로 갈지 (목적별 라우팅 테이블)

| 개발/설계 시 필요한 것 | 바로 가야 할 카드 |
|---|---|
| Origin UI의 기본 스타일링 및 Tailwind 토큰 규칙 | [C-styling](apps/ui/content/docs/%28root%29/C-styling.md) |
| 카드, 모달, 테이블 등 특정 UI의 공식 명세 및 CLI 설치 | [apps/ui/content/docs/components/](apps/ui/content/docs/components/index.md) |
| 우리 프로젝트 `shared/ui`에 직접 복사할 코어 TSX 소스코드 | [packages/ui/src/components/](packages/ui/src/components/index.md) |
| AI 에이전트 전용 컴포넌트 조립 규칙 및 주의사항 | [C-AGENTS](C-AGENTS.md) |
