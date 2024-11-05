import { usePlugin } from '@/main'
import { onMounted, Ref, ref, watch } from 'vue'

interface IProps<T> {
  namespace: string
  defaultData: T
  needSave?: boolean
  needSync?: boolean
}

export interface EnSyncModuleData<T> {
  data: T,
  defaultValue: T,
}
export interface EnSyncModuleDataResult<T> {
  data: Ref<EnSyncModuleData<T>>,
}

interface EnSyncModuleDataMsg<T> {
  // 当前 app 的 appId
  appId: string,

  // 当前同步的数据的命名空间
  namespace: string,

  // 当前同步的数据
  data: EnSyncModuleData<T>,
}

interface EnSyncDataRefMap {
  [key: string]: {
    dataRef: Ref<EnSyncModuleData<any>>,

    // 由 websocket 同步的标记，为 true 则不发送更新
    changedByWebsocket?: boolean,

    // 不保存的标记，为 true 则不调用思源插件的保存逻辑
    donotSave?: boolean,
  },
}
const syncDataRefMap: EnSyncDataRefMap = {}
window.en_SyncDataRefMap = syncDataRefMap

const socketRef = ref<WebSocket>()
const socketIsOpen = () => socketRef.value && socketRef.value?.readyState == WebSocket.OPEN
const socketIsClosed = () => !socketIsOpen()

const getSyncDataByWebSocket = (event) => {
  try {
    const msg = JSON.parse(event.data) as EnSyncModuleDataMsg<any>
    enLog('getWebSocketMessage', msg)
    enLog('is same app', msg.appId, window.siyuan.ws.app.appId, msg.appId == window.siyuan.ws.app.appId)
    // 当前 app 的数据不处理
    if (msg.appId == window.siyuan.ws.app.appId) {
      return
    }

    const mapData = syncDataRefMap[msg.namespace]
    enLog('mapData is ', mapData)
    if (!mapData) return

    // 标记相关逻辑
    mapData.donotSave = true
    mapData.changedByWebsocket = true

    const mapDataRef = mapData.dataRef
    mapDataRef.value = msg.data
  } catch(err) {
    enError('[Enhance Error]: ', err)
  }
}

const sendToSyncByData = <T>(namespace: string, data: EnSyncModuleData<T>) => {
  // 如果 socket 未连接，则不处理

  if (socketIsClosed()) return

  const mapData = syncDataRefMap[namespace]

  // 如果是由 websocket 同步的，则不处理
  if (!mapData || mapData.changedByWebsocket) {
    mapData.changedByWebsocket = false
    return
  }

  const msgData: EnSyncModuleDataMsg<T> = {
    appId: window.siyuan.ws.app.appId,
    namespace,
    data,
  }
  const msgStr = JSON.stringify(msgData)
  enLog('sendToSyncByData', msgData)
  enLog('sendToSyncByData', msgStr)
  socketRef.value.send(msgStr)
}
let connecting = false
const initWebsocket = () => {
  if (socketIsOpen()) return
  if (connecting) return

  const wsUrl = `ws://${location.host}/ws/broadcast?channel=SEP-data-sync-channel`
  connecting = true
  const socket = new WebSocket(wsUrl)
  socketRef.value = socket

  socket.onopen = () => {
    enLog('Sync Data websocket connected.')
  }

  socket.onmessage = getSyncDataByWebSocket

  socket.onerror = function() {
    initWebsocket()
  }
}

export function useSyncModuleData<T>({
  namespace,
  defaultData = {} as T,
  needSave = true,
  needSync = true
}: IProps<T>): Ref<EnSyncModuleData<T>> {
  enWarn('useSyncModuleData', namespace, defaultData, needSave)

  const existData = syncDataRefMap[namespace]
  enLog('existData is ', namespace, existData)

  const defaultDataCopy = JSON.parse(JSON.stringify(defaultData))
  const dataRef = existData ? existData.dataRef : ref<EnSyncModuleData<T>>()
  const storageKey = `SEP-${namespace}`

  dataRef.value = {
    data: defaultDataCopy,
    defaultValue: defaultDataCopy,
  }

  syncDataRefMap[namespace] = {
    dataRef,
  }

  onMounted(() => {
    const plugin = usePlugin()

    initWebsocket()

    const saveData = () => {
      const mapData = syncDataRefMap[namespace]
      if (!needSave) return

      if (mapData.donotSave) {
        mapData.donotSave = false
        return
      }
      const plugin = usePlugin()
      plugin.saveData(storageKey, dataRef.value)
    }
    const syncDataByWebsocket = () => {
      if (!needSync) return
      sendToSyncByData<T>(namespace, dataRef.value)
    }

    if (!existData) {
      if (needSave) {
        plugin.loadData(storageKey).then((res: EnSyncModuleData<T>) => {
          // 合并默认值到返回值中，方便新增字段
          const mergedData = Object.assign(defaultDataCopy, res?.data)
          const mergedRes = {
            data: mergedData,
            defaultValue: defaultDataCopy,
          }
          enLog('mergedRes ', mergedRes)
          dataRef.value = mergedRes || {
            data: defaultDataCopy,
            defaultValue: defaultDataCopy,
          }
        })
      }

      watch(dataRef, () => {
        saveData()
        syncDataByWebsocket()
      }, {
        deep: true,
      })
    }
  })

  return dataRef
}
