import type { Plugin } from 'siyuan'

export type ViewMode = 'dock' | 'tab'

export interface EnLeafPanelProps {
  mode?: ViewMode
  plugin: Plugin
} 