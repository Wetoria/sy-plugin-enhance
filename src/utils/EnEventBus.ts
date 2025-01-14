import mitt from 'mitt' // 需要先安装 mitt 包: npm install mitt

// 创建一个 mitt 实例
const emitter = mitt()

// 导出类型定义
export interface EventBusType {
  'settings:openOnEntry': void
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
