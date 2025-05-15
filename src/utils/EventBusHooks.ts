import { usePlugin } from '@/main'
import { IEventBusMap } from 'siyuan'

export type offSiyuanEvent = () => void

export function useSiyuanEvent(eventName: keyof IEventBusMap, cb: (event: any) => void): offSiyuanEvent {
  const plugin = usePlugin()
  const wrappedCallback = (event: any) => cb(event)
  plugin.eventBus.on(eventName, wrappedCallback)
  return () => {
    plugin.eventBus.off(eventName, wrappedCallback)
  }
}

export function useSiyuanEventOnce(eventName: keyof IEventBusMap, cb: (event: any) => void) {
  const plugin = usePlugin()
  plugin.eventBus.once(eventName, (event) => {
    cb(event)
  })
}

export function useSiyuanEventLoadedProtyleStatic(cb: (event: any) => void): offSiyuanEvent {
  return useSiyuanEvent('loaded-protyle-static', cb)
}
export function useSiyuanEventLoadedProtyleDynamic(cb: (event: any) => void): offSiyuanEvent {
  return useSiyuanEvent('loaded-protyle-dynamic', cb)
}

export function useSiyuanEventProtyleDestroy(cb: (event: any) => void): offSiyuanEvent {
  return useSiyuanEvent('destroy-protyle', cb)
}

export function useSiyuanClickBlockIcon(cb: (event: any) => void): offSiyuanEvent {
  return useSiyuanEvent('click-blockicon', cb)
}


export function useSiyuanEventWsMain(cb: (event: any) => void): offSiyuanEvent {
  return useSiyuanEvent('ws-main', cb)
}

export enum WsMainCmd {
  Transactions = 'transactions',
  DatabaseIndexCommit = 'databaseIndexCommit',
  Mount = 'mount',
  Unmount = 'unmount',
}

export function useSiyuanEventSpecialWsMain(specialCmd: WsMainCmd, cb: (event: any) => void): offSiyuanEvent {
  return useSiyuanEventWsMain((event) => {
    const { detail } = event
    if (detail.cmd === specialCmd) {
      cb(event)
    }
  })
}

export function useSiyuanEventTransactions(cb: (event: any) => void): offSiyuanEvent {
  return useSiyuanEventSpecialWsMain(WsMainCmd.Transactions, (event) => {
    cb(event)
  })
}

export function useSiyuanNotebookMount(cb: (event?: any) => void): offSiyuanEvent {
  return useSiyuanEventSpecialWsMain(WsMainCmd.Mount, (event) => {
    cb(event)
  })
}

export function useSiyuanNotebookUnmount(cb: (event?: any) => void): offSiyuanEvent {
  return useSiyuanEventSpecialWsMain(WsMainCmd.Unmount, (event) => {
    cb(event)
  })
}

export function useSiyuanDatabaseIndexCommit(cb: (event: any) => void): offSiyuanEvent {
  return useSiyuanEventSpecialWsMain(WsMainCmd.DatabaseIndexCommit, (event) => {
    cb(event)
  })
}
