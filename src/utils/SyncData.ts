import { usePlugin } from '@/main'
import { Ref, ref, watch } from 'vue'
import { debounce } from '@/utils'
import { enLog, enError, getColorStringWarn } from './Log'
import chalk from 'chalk'

/** 如果 needSave 和 needSync 都为 false。
 * 则只是当前 window 内进行同步，相当于只做窗口内同步，不进行跨窗口同步。
 *
 * 如果 needSave: true, needSync: false。仅保存
 *
 * 如果 needSave: false, needSync: true。仅多窗口同步
*/
export interface EnSyncModuleProps<T> {
  namespace: string
  defaultData: T
  /** 是否需要保存至本地 */
  needSave?: boolean

  /** 是否需要多终端同步 */
  needSync?: boolean
}

type Namespace = string

export interface EnSyncModuleData<T> {
  data: T,
  defaultValue: T,
}
export type EnSyncModuleDataRef<T> = Ref<EnSyncModuleData<T>>

interface EnSyncModuleDataMsg<T> {
  // 当前 app 的 appId
  appId: string,

  // 当前同步的数据的命名空间
  namespace: Namespace,

  // 当前同步的数据
  data: EnSyncModuleData<T>,
}

interface EnSyncModule<T> {
  dataRef: Ref<EnSyncModuleData<T>>,

  needSync?: EnSyncModuleProps<T>['needSync']
  // 为 true 则不发送更新
  doNotSync?: boolean,


  needSave?: EnSyncModuleProps<T>['needSave']
  // 不保存的标记，为 true 则不调用思源插件的保存逻辑
  doNotSave?: boolean,
}

export function getModuleStorageKey(namespace: Namespace) {
  return `SEP-${namespace}`
}

interface EnSyncDataRefMap {
  [key: string]: EnSyncModule<any>,
}
const syncDataRefMap: EnSyncDataRefMap = {}
window.en_SyncDataRefMap = syncDataRefMap

const getNamespaceLogString = (namespace: string) => {
  return `${chalk.bgCyanBright.cyan.bold(` [${namespace}] `)}`
}

function getInitModuleData(defaultData) {
  const defaultValue = JSON.parse(JSON.stringify(defaultData))
  const data = JSON.parse(JSON.stringify(defaultData))

  return {
    data,
    defaultValue,
  }
}

// 根据 namespace 注册全局 module 数据
export function useSyncModuleData<T>({
  namespace,
  defaultData = {} as T,
  needSave = true,
  needSync = true,
}: EnSyncModuleProps<T>): EnSyncModuleDataRef<T> {

  const exist = syncDataRefMap[namespace]?.dataRef
  if (exist) {
    return exist
  }

  const dataRef = ref<EnSyncModuleDataRef<T>>({} as any)
  syncDataRefMap[namespace] = {
    dataRef,
    needSave,
    needSync,
  }
  dataRef.value = getInitModuleData(defaultData)

  enLog(`${getColorStringWarn('Module registered:')} ${getNamespaceLogString(namespace)}.`)
  enLog(`Module map data is: `, syncDataRefMap)
  enLog(`The Module data is: `, JSON.parse(JSON.stringify(dataRef.value)))

  const saveData = debounce(async () => {
    if (!needSave) {
      enLog(`Module ${getNamespaceLogString(namespace)} do not need to save. Cancel to save.`)
      return
    }

    const mapData = getModuleByNamespace(namespace)
    if (mapData.doNotSave) {
      enLog(`Module ${getNamespaceLogString(namespace)} marked as doNotSave. Cancel to save.`)
      mapData.doNotSave = false
      return
    }
    const plugin = usePlugin()
    const storageKey = getModuleStorageKey(namespace)
    enLog(`${getColorStringWarn('Ready to save module data')} of ${getNamespaceLogString(namespace)} into file [${storageKey}]: `, JSON.parse(JSON.stringify(dataRef.value)))
    await plugin.saveData(storageKey, dataRef.value)
    enLog(`${getColorStringWarn('Saved module data')} of ${getNamespaceLogString(namespace)} into file [${storageKey}].`)
  })

  const syncDataByWebsocket = () => {
    if (!needSync) {
      enLog(`Module ${getNamespaceLogString(namespace)} do not need to sync. Cancel to sync.`)
      return
    }
    sendToSyncByData<T>(namespace, dataRef.value)
  }

  watch(dataRef, () => {
    const mapData = getModuleByNamespace(namespace)
    enLog(`Watched module data of ${getNamespaceLogString(namespace)} change. [DoNotSave: ${mapData.doNotSave}, DoNotSync: ${mapData.doNotSync}].`)
    enLog(`The Data is: `, JSON.parse(JSON.stringify(dataRef.value)))
    saveData()
    syncDataByWebsocket()
  }, {
    deep: true,
  })

  return dataRef
}

// 根据 namespace 加载 module 数据
export async function loadModuleDataByNamespace<T>(namespace: Namespace) {
  const plugin = usePlugin()
  const storageKey = getModuleStorageKey(namespace)

  enLog(`${getColorStringWarn('Ready to load module data')} of ${getNamespaceLogString(namespace)} from file [${storageKey}]`)
  const res: EnSyncModuleData<T> = await plugin.loadData(storageKey)
  enLog(`${getColorStringWarn('Loaded module data')} of ${getNamespaceLogString(namespace)} is: `, res)

  const dataRef = syncDataRefMap[namespace]?.dataRef

  if (!dataRef) {
    enError(`Module ${getNamespaceLogString(namespace)} was not found.`)
    return
  }

  if (!res) {
    enWarn(`${getColorStringWarn('Module data not found')} for ${getNamespaceLogString(namespace)}.`)
    enLog(`Ready to save and return default data.`)
    await saveModuleDataByNamespace(namespace)
    enSuccess(`Saved default Module data. for ${getNamespaceLogString(namespace)}`)
    return syncDataRefMap[namespace]?.dataRef
  }

  const defaultDataCopy = JSON.parse(JSON.stringify(dataRef.value.defaultValue))

  // 合并默认值到返回值中，方便新增字段
  const mergedData = Object.assign(
    {},
    defaultDataCopy,
    res?.data
  )
  const mergedRes = {
    data: mergedData,
    defaultValue: defaultDataCopy,
  }

  markAsDoNotSave(namespace)
  markAsDoNotSync(namespace)
  dataRef.value = mergedRes
  return dataRef
}

export function getModuleByNamespace<T>(namespace: string): EnSyncModule<T> {
  const module = syncDataRefMap[namespace]
  if (!module) {
    enError(`Module ${getNamespaceLogString(namespace)} was not registered.`)
    return
  }
  return module
}

export function getModuleRefByNamespace<T>(namespace: string): EnSyncModuleDataRef<T> {
  return getModuleByNamespace<T>(namespace).dataRef
}


export const markAsDoNotSave = (namespace: string, value = true) => {
  const mapData = getModuleByNamespace(namespace)
  mapData.doNotSave = value
}
export const markAsDoNotSync = (namespace: string, value = true) => {
  const mapData = getModuleByNamespace(namespace)
  mapData.doNotSync = value
}

// 根据 namespace 保存数据
export const saveModuleDataByNamespace = debounce(async (namespace: Namespace) => {
  const mapData = getModuleByNamespace(namespace)

  if (!mapData.needSave) {
    enLog(`Module ${getNamespaceLogString(namespace)} do not need to save. Cancel to save.`)
    return
  }

  if (mapData.doNotSave) {
    enLog(`Module ${getNamespaceLogString(namespace)} marked as doNotSave. Cancel to save.`)
    mapData.doNotSave = false
    return
  }
  const plugin = usePlugin()
  const dataRef = mapData.dataRef
  const storageKey = getModuleStorageKey(namespace)
  enLog(`${getColorStringWarn('Ready to save module')} ${getNamespaceLogString(namespace)} data into file [${storageKey}]: `, JSON.parse(JSON.stringify(dataRef.value)))
  await plugin.saveData(storageKey, dataRef.value)
  enLog(`${getColorStringWarn('Saved Module Data: ')} ${getNamespaceLogString(namespace)}`)
})

// #region socket logics

const socketRef = ref<WebSocket>()
const socketIsOpen = () => socketRef.value && socketRef.value?.readyState == WebSocket.OPEN
const socketIsClosed = () => !socketIsOpen()

const getSyncDataByWebSocket = (event) => {
  try {
    const msg = JSON.parse(event.data) as EnSyncModuleDataMsg<any>
    enLog(`${getColorStringWarn('Received module data of')} [${getNamespaceLogString(msg.namespace)}] from other device: `, JSON.parse(JSON.stringify(msg.data)))
    // 当前 app 的数据不处理
    if (msg.appId == window.siyuan.ws.app.appId) {
      return
    }

    const mapData = getModuleByNamespace(msg.namespace)
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

  const mapData = getModuleByNamespace(namespace)
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
  enLog(`${getColorStringWarn('Ready to send module')} ${getNamespaceLogString(namespace)} data to sync: `, JSON.parse(JSON.stringify(msgData)))
  const msgStr = JSON.stringify(msgData)
  socketRef.value.send(msgStr)
}
let connecting = false
const initWebsocket = () => {
  if (socketIsOpen()) return
  if (connecting) return

  // IMP 支持加密
  const wsUrl = `ws://${location.host}/ws/broadcast?channel=SEP-data-sync-channel`
  connecting = true
  const socket = new WebSocket(wsUrl)
  socketRef.value = socket

  socket.onopen = () => {
    enSuccess('Sync Data Websocket Channel Ready.')
  }

  socket.onmessage = getSyncDataByWebSocket

  socket.onerror = function() {
    initWebsocket()
  }
}

// #endregion socket logics
