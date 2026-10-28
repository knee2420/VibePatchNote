---
type: index
title: "Kibo UI 41 Component Specs"
description: "드롭존, 간트, 칸반, 에디터, 태그 피커 등 41개 고밀도 위젯 공식 사용 명세"
resource: "../../../../../../99.archive/kiboui/apps/docs/content/components"
timestamp: "2026-09-16"
---

# 이 섹션은

Kibo UI가 제공하는 **41개 복합 UI 컴포넌트의 기능 명세와 사용 예시**를 모아둔 섹션이다.
각 카드는 해당 위젯의 사용자 인터랙션, 옵션, 프리뷰 사례를 다루며, 실제 구현체인 `packages/*` 와 1:1로 매핑된다.

# 카드

| 카드 | 핵심 가치 (값나가는 것) | elements |
|---|---|---|
| [Announcement Component Spec](C-announcement.md) | A compound badge designed to display an announcement. | 4 |
| [Avatar Stack Component Spec](C-avatar-stack.md) | Avatar Stack is a component that allows you to stack and overlap avatars. | 4 |
| [Banner Component Spec](C-banner.md) | A banner is a full-width component that can be used to show a message and action to the user. | 4 |
| [Calendar Component Spec](C-calendar.md) | The calendar view displays features on a grid calendar. Specifically it shows the end date of each feature, and groups features by day. | 4 |
| [Choicebox Component Spec](C-choicebox.md) | Choiceboxes are a great way to show radio or checkbox options with a card style. | 4 |
| [Code Block Component Spec](C-code-block.md) | Provides syntax highlighting, line numbers, and copy to clipboard functionality for code blocks. | 4 |
| [Color Picker Component Spec](C-color-picker.md) | Allows users to select a color. Modeled after the color picker in Figma. | 4 |
| [Combobox Component Spec](C-combobox.md) | Autocomplete input and command palette with a list of suggestions. | 4 |
| [Comparison Component Spec](C-comparison.md) | A slider-based component for comparing two items in an overlay. | 4 |
| [Contribution Graph Component Spec](C-contribution-graph.md) | A GitHub-style contribution graph component that displays activity levels over time. | 4 |
| [Credit Card Component Spec](C-credit-card.md) | Credit card components for displaying and validating credit card information. | 4 |
| [Cursor Component Spec](C-cursor.md) | A cursor component, great for realtime interactive applications. | 4 |
| [Deck Component Spec](C-deck.md) | A Tinder-like swipeable card stack component with smooth animations. | 4 |
| [Dialog Stack Component Spec](C-dialog-stack.md) | Composable stacked dialogs, useful for creating a wizard, nested form or multi-step process. It provides a consistent layout and styling for each dialog, and includes navigation components to move between them. | 4 |
| [Dropzone Component Spec](C-dropzone.md) | Allows users to drag-and-drop files into a container to upload or process them. | 4 |
| [Editor Component Spec](C-editor.md) | The Editor component is a powerful and flexible text editor that allows you to create and edit rich text content. | 4 |
| [Gantt Component Spec](C-gantt.md) | The Gantt chart is a powerful tool for visualizing project schedules and tracking the progress of tasks. It provides a clear, hierarchical view of tasks, allowing you to easily identify manage project timelines. | 4 |
| [Glimpse Component Spec](C-glimpse.md) | A component that shows a preview of a URL when hovering over a link. | 4 |
| [Image Crop Component Spec](C-image-crop.md) | A component that allows users to crop images with customizable aspect ratios and circular cropping options. | 4 |
| [Image Zoom Component Spec](C-image-zoom.md) | Image zoom is a component that allows you to zoom in on an image. | 4 |
| [Kanban Component Spec](C-kanban.md) | A kanban board is a visual tool that helps you manage and visualize your work. It is a board with columns, and each column represents a status, e.g. "Backlog", "In Progress", "Done". | 4 |
| [List Component Spec](C-list.md) | List views are a great way to show a list of tasks grouped by status and ranked by priority. | 4 |
| [Marquee Component Spec](C-marquee.md) | Marquees are a great way to show a list of items in a horizontal scrolling motion. | 4 |
| [Mini Calendar Component Spec](C-mini-calendar.md) | A composable mini calendar component for picking dates close to today. | 4 |
| [Pill Component Spec](C-pill.md) | A flexible badge component designed for a variety of use cases. | 4 |
| [QR Code Component Spec](C-qr-code.md) | QR Code is a component that generates a QR code from a string. | 4 |
| [Rating Component Spec](C-rating.md) | A star rating component with keyboard navigation and hover effects. | 4 |
| [Reel Component Spec](C-reel.md) | A composable, Instagram-style Reel component with progress indicators and navigation controls. | 4 |
| [Relative Time Component Spec](C-relative-time.md) | A component that displays time in various timezones. | 4 |
| [Sandbox Component Spec](C-sandbox.md) | The sandbox component allows you to preview and test components in a sandboxed environment. | 4 |
| [Snippet Component Spec](C-snippet.md) | Snippet is a component that allows you to display and copy code in a tabbed interface. | 4 |
| [Spinner Component Spec](C-spinner.md) | The Spinner component expands the shadcn spinner component with additional variants. | 4 |
| [Status Component Spec](C-status.md) | Status components are used to display the uptime of a service. | 4 |
| [Stories Component Spec](C-stories.md) | A carousel of friends' stories, in video, image or avatar format. | 4 |
| [Table Component Spec](C-table.md) | Table views are used to display data in a tabular format. They are useful for displaying large amounts of data in a structured way. | 4 |
| [Tags Component Spec](C-tags.md) | Tags are a way to apply multiple labels to an item. | 4 |
| [Theme Switcher Component Spec](C-theme-switcher.md) | A component to switch between light, dark and system theme. | 4 |
| [Ticker Component Spec](C-ticker.md) | A composable finance ticker for displaying symbols, prices and changes. | 4 |
| [Tree Component Spec](C-tree.md) | A composable tree component with animated expand/collapse and customizable nodes for displaying hierarchical data structures. | 4 |
| [Typography Component Spec](C-typography.md) | A component for applying consistent typography styles across your application. | 4 |
| [Video Player Component Spec](C-video-player.md) | A composable, shadcn/ui styled video player component that uses the media-chrome library. | 4 |

# 이 섹션 밖

- [코드 구현체 매핑] 각 컴포넌트의 실제 코드는 `[packages/](../../../../packages/index.md)` 하위의 개별 패키지 카드에서 확인한다.
- [페이지 조립 블록] 여러 컴포넌트가 결합된 완성형 섹션은 `[blocks/](../blocks/index.md)`를 참조한다.
