import { useSyBroadcast } from '@/utils/websocket/useSyBroadcast'
import {
  computed,
  watch,
} from 'vue'


// 创建全局唯一的同步数据 ws 通道
export const syncDataSocket = useSyBroadcast('SEP-data-sync-channel', {
  immediate: false,
})
window.syncDataSocket = syncDataSocket

export const syncDataSocketOpened = computed(() => {
  return syncDataSocket.isOpen.value
})

export function sendSyncData<T>(data: SyncDataMsg<T>) {
  const msgData = Object.assign({
    appId: window.siyuan.ws.app.appId,
  }, data)
  syncDataSocket.send(JSON.stringify(msgData))
}

const parseSyncDataAndCheck = (socketData: string) => {
  let data = null
  try {
    data = JSON.parse(socketData)
  } catch (err) {
    enWarn(`Sync data parse error, cancel handling.`, err.message)
    return
  }
  if (!data) {
    enWarn(`No data need to be handle.`)
    return
  }
  if (data.appId == window.siyuan.ws.app.appId) {
    enLog(`Is sent by current app. Not need to be handled.`)
    return
  }

  return data
}

export function useSyncDataChannel<T>({
  onDataChange,
}: {
  onDataChange: (data: SyncDataMsg<T>) => void
}) {
  watch(() => syncDataSocket.data.value, () => {
    if (!syncDataSocket.isOpen.value) {
      return
    }
    const socketData = syncDataSocket.data.value
    if (!socketData) {
      return
    }
    const checkResult = parseSyncDataAndCheck(socketData)
    if (!checkResult) {
      enWarn(`Sync data check failed, cancel handling.`)
      return
    }
    onDataChange(checkResult)
  }, {
    immediate: true,
    deep: true,
  })
  return syncDataSocket
}

export function onReceiveSyncData<T>(onDataChange: (data: SyncDataMsg<T>) => void) {
  useSyncDataChannel<T>({
    onDataChange,
  })
}
