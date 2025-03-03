import type { Plugin } from 'siyuan'

export type ViewMode = 'dock' | 'tab'

// 添加显示模式类型
export type DisplayMode = 'timeline' | 'card' | 'gallery' | 'waterfall'

export interface EnLeafPanelProps {
  mode?: ViewMode
  plugin: Plugin
} 