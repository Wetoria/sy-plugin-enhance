import { EN_EVENT_BUS_KEYS } from '@/utils/Constants';
import mitt from 'mitt'; // 需要先安装 mitt 包: npm install mitt

// 创建一个 mitt 实例
const emitter = mitt()

// 导出类型定义
export interface EventBusType {
  [EN_EVENT_BUS_KEYS.SETTINGS_OPEN_ON_ENTRY]: void
  [EN_EVENT_BUS_KEYS.AUTH_OPEN_MODAL]: void
  [EN_EVENT_BUS_KEYS.CREATE_TODAY_DAILY_NOTE_MOBILE]: void
  [EN_EVENT_BUS_KEYS.LIFELOG_LOAD_RECORDS_BY_DATE_LIST]: string[]
  [EN_EVENT_BUS_KEYS.MEMO_FOCUS_INPUT]: void
  [EN_EVENT_BUS_KEYS.LIFELOG_OPEN_GRAPH_MODAL]: {
    dateList: string[]
  }
  [EN_EVENT_BUS_KEYS.WHITEBOARD_SYNC_FRAME_CONTENT]: string // 需要同步内容的frame节点ID
  [EN_EVENT_BUS_KEYS.WHITEBOARD_CALCULATE_IS_IN_VIEWPORT]: {
    whiteBoardId: string
  }
}

// 导出类型化的 eventBus
export const enEventBus = {
  emit: <K extends keyof EventBusType>(event: K, data?: EventBusType[K]) => {
    emitter.emit(event, data)
  },
  on: <K extends keyof EventBusType>(event: K, callback: (data?: EventBusType[K]) => void) => {
    emitter.on(event, callback as any)
  },
  off: <K extends keyof EventBusType>(event: K, callback: (data?: EventBusType[K]) => void) => {
    emitter.off(event, callback as any)
  },
}
