import { usePlugin } from '@/main'
import { Ref, ref, watch } from 'vue'

interface IProps<T> {
  namespace: string
  defaultData: T
  /** 如果 needSave 和 needSync 都为 false，则只是当前 window 内进行同步
   * 相当于只做窗口内同步，不进行跨窗口同步
   * 如果 needSave: true, needSync: false, 则只是保存
   * 如果 needSave: false, needSync: true, 则只是多窗口同步
  */
  // 是否需要保存至本地
  needSave?: boolean

  // 是否需要多终端同步
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

    // 为 true 则不发送更新
    doNotSync?: boolean,

    // 不保存的标记，为 true 则不调用思源插件的保存逻辑
    doNotSave?: boolean,
  },
}
const syncDataRefMap: EnSyncDataRefMap = {}
window.en_SyncDataRefMap = syncDataRefMap

export const markAsDoNotSave = (namespace: string) => {
  const mapData = syncDataRefMap[namespace]
  mapData.doNotSave = true
}
export const markAsDoNotSync = (namespace: string) => {
  const mapData = syncDataRefMap[namespace]
  mapData.doNotSync = true
}

const socketRef = ref<WebSocket>()
const socketIsOpen = () => socketRef.value && socketRef.value?.readyState == WebSocket.OPEN
const socketIsClosed = () => !socketIsOpen()

const getSyncDataByWebSocket = (event) => {
  try {
    const msg = JSON.parse(event.data) as EnSyncModuleDataMsg<any>
    enLog('getWebSocketMessage', msg)
    // 当前 app 的数据不处理
    if (msg.appId == window.siyuan.ws.app.appId) {
      return
    }

    const mapData = syncDataRefMap[msg.namespace]
    if (!mapData) return

    // 标记相关逻辑
    markAsDoNotSave(msg.namespace)
    markAsDoNotSync(msg.namespace)
    const mapDataRef = mapData.dataRef
    mapDataRef.value = msg.data
  } catch(err) {
    enError(err)
  }
}

const sendToSyncByData = <T>(namespace: string, data: EnSyncModuleData<T>) => {
  // 如果 socket 未连接，则不处理
  if (socketIsClosed()) return

  const mapData = syncDataRefMap[namespace]
  if (!mapData) return

  // 如果是由 websocket 同步的，则不处理
  if (mapData.doNotSync) {
    mapData.doNotSync = false
    return
  }

  const msgData: EnSyncModuleDataMsg<T> = {
    appId: window.siyuan.ws.app.appId,
    namespace,
    data,
  }
  const msgStr = JSON.stringify(msgData)
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
  initWebsocket()

  const existData = syncDataRefMap[namespace]

  // 如果已经创建，直接返回。不执行后续的创建逻辑
  if (existData) {
    return existData.dataRef
  }

  // 对默认值进行拷贝，防止修改默认值
  const defaultDataCopy = JSON.parse(JSON.stringify(defaultData))

  const dataRef = ref<EnSyncModuleData<T>>()
  const storageKey = `SEP-${namespace}`

  syncDataRefMap[namespace] = {
    dataRef,
  }

  markAsDoNotSave(namespace)
  markAsDoNotSync(namespace)
  dataRef.value = {
    data: defaultDataCopy,
    defaultValue: defaultDataCopy,
  }

  const saveData = async () => {
    if (!needSave) return

    const mapData = syncDataRefMap[namespace]
    if (mapData.doNotSave) {
      mapData.doNotSave = false
      return
    }
    const plugin = usePlugin()
    await plugin.saveData(storageKey, dataRef.value)
  }
  const syncDataByWebsocket = () => {
    if (!needSync) return
    sendToSyncByData<T>(namespace, dataRef.value)
  }

  if (needSave) {
    const plugin = usePlugin()
    plugin.loadData(storageKey).then((res: EnSyncModuleData<T>) => {
      // 合并默认值到返回值中，方便新增字段
      const mergedData = Object.assign(defaultDataCopy, res?.data)
      const mergedRes = {
        data: mergedData,
        defaultValue: defaultDataCopy,
      }
      markAsDoNotSave(namespace)
      markAsDoNotSync(namespace)
      dataRef.value = mergedRes || {
        data: defaultDataCopy,
        defaultValue: defaultDataCopy,
      }
    })
  }

  watch(dataRef, () => {
    enError('watch dataRef', namespace, dataRef.value)
    saveData()
    syncDataByWebsocket()
  }, {
    deep: true,
  })

  return dataRef
}
