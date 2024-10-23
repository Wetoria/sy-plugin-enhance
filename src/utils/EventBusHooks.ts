import { usePlugin } from '@/main'
import { IEventBusMap } from 'siyuan'

export function useEventBus(event: keyof IEventBusMap, cb: (event: any) => void) {
  const plugin = usePlugin()
  plugin.eventBus.on(event, (event) => {
    cb(event)
  })
  return () => {
    plugin.eventBus.off(event, cb)
  }
}

export function useLoadedProtyleStatic(cb: (event: any) => void) {
  return useEventBus('loaded-protyle-static', cb)
}

export function useWsMain(cb: (event: any) => void) {
  return useEventBus('ws-main', cb)
}

export function useTransactions(cb: (event: any) => void) {
  return useWsMain((event) => {
    const { detail } = event
    if (detail.cmd === 'transactions') {
      cb(event)
    }
  })
}
