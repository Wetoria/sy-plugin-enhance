import { usePlugin } from '@/main'
import { IEventBusMap } from 'siyuan'

export type offSiyuanEvent = () => void

export function useSiyuanEvent(event: keyof IEventBusMap, cb: (event: any) => void): offSiyuanEvent {
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

export function useSiyuanEventLoadedProtyleStatic(cb: (event: any) => void): offSiyuanEvent {
  return useSiyuanEvent('loaded-protyle-static', cb)
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
