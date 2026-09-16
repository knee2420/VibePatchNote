import type { FC } from 'react';
import type {
  DockviewApi,
  DockviewReadyEvent,
  IDockviewPanel,
  IDockviewPanelProps,
  IDockviewPanelHeaderProps,
  IDockviewHeaderActionsProps,
  DockviewGroupPanel,
} from 'dockview';
import type { DockviewDefaultTab } from 'dockview-react';

export type {
  DockviewApi,
  DockviewReadyEvent,
  IDockviewPanel,
  IDockviewPanelProps,
  IDockviewPanelHeaderProps,
  IDockviewHeaderActionsProps,
  DockviewGroupPanel,
  DockviewDefaultTab,
};

export interface DockPanelConfig {
  id: string;
  component: string;
  title: string;
  params?: Record<string, unknown>;
  position?: {
    referencePanel?: string;
    direction?: 'left' | 'right' | 'above' | 'below' | 'within';
  };
}

export interface EditorDockShellProps {
  onReady?: (event: DockviewReadyEvent) => void;
  components: Record<string, FC<IDockviewPanelProps>>;
  tabComponents?: Record<string, FC<IDockviewPanelHeaderProps>>;
  rightHeaderActionsComponent?: FC<IDockviewHeaderActionsProps>;
  theme?: string;
  className?: string;
  disableFloatingGroups?: boolean;
}
