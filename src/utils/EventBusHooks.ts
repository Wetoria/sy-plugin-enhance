import { usePlugin } from '@/main'
import { IEventBusMap } from 'siyuan'

export function useSiyuanEvent(event: keyof IEventBusMap, cb: (event: any) => void) {
  const plugin = usePlugin()
  plugin.eventBus.on(event, (event) => {
    cb(event)
  })
  return () => {
    plugin.eventBus.off(event, cb)
  }
}

export function useSiyuanEventOnce(event: keyof IEventBusMap, cb: (event: any) => void) {
  const plugin = usePlugin()
  plugin.eventBus.once(event, (event) => {
    cb(event)
  })
}

export function useSiyuanEventLoadedProtyleStatic(cb: (event: any) => void) {
  return useSiyuanEvent('loaded-protyle-static', cb)
}

export function useSiyuanEventWsMain(cb: (event: any) => void) {
  return useSiyuanEvent('ws-main', cb)
}

export function useSiyuanEventTransactions(cb: (event: any) => void) {
  return useSiyuanEventWsMain((event) => {
    const { detail } = event
    if (detail.cmd === 'transactions') {
      cb(event)
    }
  })
}

export function useSiyuanNotebookMount(cb: (event?: any) => void) {
  return useSiyuanEventWsMain((event) => {
    const { detail } = event
    if (detail.cmd === 'mount') {
      cb(event)
    }
  })
}

export function useSiyuanNotebookUnmount(cb: (event?: any) => void) {
  return useSiyuanEventWsMain((event) => {
    const { detail } = event
    if (detail.cmd === 'unmount') {
      cb(event)
    }
  })
}
