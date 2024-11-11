import { usePlugin } from '@/main'
import { Ref, ref, watch } from 'vue'
import { debounce } from '@/utils'
import { enLog, enError, getColorStringWarn } from './Log'
import chalk from 'chalk'

/** 同步模块的初始化配置
 * @field namespace - 模块的命名空间，用于标识模块
 * @field defaultData - 模块的默认数据
 * @field needSave - 是否需要保存至本地文件
 * @field needSync - 是否需要在多终端间同步数据
 *
 * needSave 和 needSync 的组合效果:
 * - needSave=false, needSync=false: 仅在当前终端内同步数据
 * - needSave=true, needSync=false: 仅保存数据到本地文件
 * - needSave=false, needSync=true: 仅在多终端间同步数据，不保存数据到本地文件
 * - needSave=true, needSync=true: 保存到本地文件并在多终端间同步
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

/**
 * 同步模块的数据结构
 * @field data 当前数据
 * @field defaultValue 默认数据
 */
export interface EnSyncModuleData<T> {
  data: T,
  defaultValue: T,
}

/**
 * 同步模块的数据引用 Ref<EnSyncModuleData<T>>
 */
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
  dataRef: EnSyncModuleDataRef<T>,

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
export const syncDataRefMap: EnSyncDataRefMap = {}
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
    enLog(`${getColorStringWarn(`Module already registered. Return the exist module dataRef of`)} ${getNamespaceLogString(namespace)}`)
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
    enLog(`${getColorStringWarn(`Ready to sync module data:`)} ${getNamespaceLogString(namespace)}`)
    sendToSyncByData<T>(namespace, dataRef.value)
  }

  watch(dataRef, () => {
    const mapData = getModuleByNamespace(namespace)
    enLog(`${getColorStringWarn(`Watched module data changed:`)} ${getNamespaceLogString(namespace)}`)
    enLog(`The module flag is [DoNotSave: ${mapData.doNotSave}, DoNotSync: ${mapData.doNotSync}].`)
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
    enWarn(`${getColorStringWarn('Module data not found')} for ${getNamespaceLogString(namespace)}`)
    enWarn(`Ready to save and return default data.`)
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

export async function updateModuleDataByNamespaceWithLoadFile<T>(namespace: string) {
  const module = getModuleByNamespace<T>(namespace)
  const res = await loadModuleDataByNamespace<T>(namespace)
  module.dataRef.value = res.value
}

export function getModuleByNamespace<T>(namespace: string): EnSyncModule<T> {
  const module = syncDataRefMap[namespace]
  if (!module) {
    enError(`Module was not registered: ${getNamespaceLogString(namespace)}`)
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
const socketIsOpen = () => {
  // enLog(`Socket is open: ${socketRef.value?.readyState == WebSocket.OPEN}`)
  // enLog(`Socket ref is: `, socketRef.value)
  // enLog(`Socket readyState is: `, socketRef.value?.readyState)
  return socketRef.value && socketRef.value?.readyState == WebSocket.OPEN
}
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
  if (socketIsClosed()) {
    enWarn(`${getColorStringWarn(`Socket is closed. Can not send module data:`)} ${getNamespaceLogString(namespace)}`)
    return
  }

  const mapData = getModuleByNamespace(namespace)
  if (!mapData) {
    enLog(`${getColorStringWarn(`Module ${getNamespaceLogString(namespace)} was not registered. Cancel to send module data.`)}`)
    return
  }

  // 如果是由 websocket 同步的，则不处理
  if (mapData.doNotSync) {
    enLog(`${getColorStringWarn(`Module ${getNamespaceLogString(namespace)} marked as doNotSync. Cancel to send module data.`)}`)
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
export const initWebsocket = () => {
  return new Promise((resolve) => {
    if (socketIsOpen()) {
      resolve(socketRef.value)
      return
    }

    if (connecting) {
      return
    }

    // IMP 支持加密
    const wsUrl = `ws://${location.host}/ws/broadcast?channel=SEP-data-sync-channel`
    connecting = true
    const socket = new WebSocket(wsUrl)
    socketRef.value = socket

    socket.onopen = () => {
      enSuccess('Sync Data Websocket Channel Ready.')
      resolve(socketRef.value)
    }

    socket.onmessage = getSyncDataByWebSocket

    socket.onerror = function() {
      initWebsocket()
    }
  })
}

// #endregion socket logics
