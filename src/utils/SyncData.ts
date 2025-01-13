import { usePlugin } from '@/main'
import { debounce } from '@/utils'
import chalk from 'chalk'
import _ from 'lodash'
import {
  Ref,
  ref,
  watch,
} from 'vue'
import {
  enError,
  enLog,
  getColorStringWarn,
} from './Log'

/**
 * 同步模块的初始化配置
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

  /** 是否自动加载 */
  autoLoad?: boolean
}

export type Namespace = string

/**
 * 同步模块的数据结构
 * @field data 当前数据
 * @field defaultValue 默认数据
 */
export interface EnSyncModuleData<T> {
  data: T
  defaultValue: T
}

/**
 * 同步模块的数据引用 Ref<EnSyncModuleData<T>>
 */
export type EnSyncModuleDataRef<T> = Ref<EnSyncModuleData<T>>


/**
 * 同步模块的数据结构
 * @field dataRef 数据引用 EnSyncModuleDataRef
 * @field needSync - 是否需要多终端同步
 * @field doNotSync - 内部标记，为 true 则不发送更新
 * @field needSave - 是否需要保存至本地文件
 * @field doNotSave - 内部标记，为 true 则不调用思源插件的保存逻辑
 * @field loaded - 是否加载完成
 * @field loadingFlag - 提示是否加载的定时器 id
 */
interface EnSyncModule<T> {
  dataRef: EnSyncModuleDataRef<T>
  unwatch: () => void

  needSync?: EnSyncModuleProps<T>['needSync']
  // 为 true 则不发送更新
  doNotSync?: boolean


  needSave?: EnSyncModuleProps<T>['needSave']
  // 不保存的标记，为 true 则不调用思源插件的保存逻辑
  doNotSave?: boolean

  autoLoad?: boolean
  loaded?: boolean
  loading?: boolean
  loadingFlag?: any
}

export function getModuleStorageKey(namespace: Namespace) {
  // 前缀 SEP 不能改，否则旧版本的数据会有问题
  return `SEP-${namespace}`
}



interface EnSyncDataRefMap {
  [key: string]: EnSyncModule<any>
}
export const syncDataRefMap: EnSyncDataRefMap = {}


export const markAsDoNotSave = (namespace: string, value = true) => {
  const mapData = getModuleByNamespace(namespace)
  mapData.doNotSave = value
}
export const markAsDoNotSync = (namespace: string, value = true) => {
  const mapData = getModuleByNamespace(namespace)
  mapData.doNotSync = value
}



const getNamespaceLogString = (namespace: string) => {
  return `${chalk.cyan.bold(` [${namespace}] `)}`
}


// #region socket logics

const socketRef = ref<WebSocket>()
const socketIsOpen = () => {
  return socketRef.value && socketRef.value?.readyState == WebSocket.OPEN
}
const socketIsClosed = () => !socketIsOpen()


/**
 * 同步模块的数据消息结构
 * @field appId - 当前 app 的 appId
 * @field namespace - 当前同步的数据的命名空间
 * @field data - 当前同步的数据
 */
interface EnSyncModuleDataMsg<T> {
  // 当前 app 的 appId
  appId: string

  // 当前同步的数据的命名空间
  namespace: Namespace

  // 当前同步的数据
  data: EnSyncModuleData<T>
}

const getSyncDataByWebSocket = (event) => {
  try {
    const msg = JSON.parse(event.data) as EnSyncModuleDataMsg<any>
    enLog(
      `${getColorStringWarn('Received module data of')} [${getNamespaceLogString(msg.namespace)}] from other device: `,
      JSON.parse(JSON.stringify(msg.data)),
    )
    // 当前 app 的数据不处理
    if (msg.appId == window.siyuan.ws.app.appId) {
      return
    }

    const mapData = getModuleByNamespace(msg.namespace)
    if (!mapData)
      return

    // 标记相关逻辑
    markAsDoNotSave(msg.namespace)
    markAsDoNotSync(msg.namespace)
    const mapDataRef = mapData.dataRef
    mapDataRef.value = msg.data
  } catch (err) {
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

    const wsUrl = `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws/broadcast?channel=SEP-data-sync-channel`
    connecting = true
    const socket = new WebSocket(wsUrl)
    socketRef.value = socket

    socket.onopen = () => {
      enSuccess('Sync Data Websocket Channel Ready.')
      connecting = false

      resolve(socketRef.value)
    }

    socket.onmessage = getSyncDataByWebSocket

    socket.onerror = function () {
      connecting = false

      initWebsocket()
    }
  })
}

export const closeWebsocket = () => {
  if (socketIsOpen()) {
    if (socketRef.value) {
      socketRef.value.onopen = null
      socketRef.value.onmessage = null
      socketRef.value.onerror = null
      socketRef.value.onclose = null

      socketRef.value.close()
      socketRef.value = null

      connecting = false
    }
  }
}

// #endregion socket logics


function getInitModuleData(defaultData) {
  const defaultValue = JSON.parse(JSON.stringify(defaultData))
  const data = JSON.parse(JSON.stringify(defaultData))

  return {
    data,
    defaultValue,
  }
}


// 根据 namespace 保存数据
export const saveModuleDataByNamespace = async (namespace: Namespace) => {
  const mapData = getModuleByNamespace(namespace)

  if (!mapData) {
    enError(`Module was not registered: ${getNamespaceLogString(namespace)}`)
    return
  }

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
  // IMP 记录保存状态，在设置页面进行展示
  enLog(`${getColorStringWarn('Ready to save module')} ${getNamespaceLogString(namespace)} data into file [${storageKey}]: `, JSON.parse(JSON.stringify(dataRef.value)))
  await plugin.saveData(storageKey, dataRef.value)
  enLog(`${getColorStringWarn('Saved Module Data: ')} ${getNamespaceLogString(namespace)}`)
}



// 根据 namespace 注册全局 module 数据
export function useSyncModuleData<T>({
  namespace,
  defaultData = {} as T,
  needSave = true,
  needSync = true,
  autoLoad = true,
}: EnSyncModuleProps<T>): EnSyncModuleDataRef<T> {

  const exist = syncDataRefMap[namespace]?.dataRef
  if (exist) {
    enLog(`${getColorStringWarn(`Module already registered. Return the exist module dataRef of`)} ${getNamespaceLogString(namespace)}`)
    return exist
  }

  const dataRef = ref<EnSyncModuleDataRef<T>>({} as any)
  const mapData: EnSyncModule<T> = {
    dataRef,
    needSave,
    needSync,
    autoLoad,
    unwatch: () => {},
  }
  syncDataRefMap[namespace] = mapData
  dataRef.value = getInitModuleData(defaultData)

  if (needSave && autoLoad) {
    // 标记模块没有加载
    mapData.loadingFlag = setTimeout(() => {
      if (!mapData.loaded) {
        enWarn(`${getColorStringWarn(`Module ${getNamespaceLogString(namespace)} was not loaded from file. You seem forget to load it.`)}`)
      }
    }, 5000)
  }

  enLog(`${getColorStringWarn('Module registered:')} ${getNamespaceLogString(namespace)}.`)
  enLog(`Module map data is: `, syncDataRefMap)
  enLog(`The Module data is: `, JSON.parse(JSON.stringify(dataRef.value)))



  const saveData = debounce(async () => {
    await saveModuleDataByNamespace(namespace)
  })



  const syncDataByWebsocket = debounce(() => {
    if (!needSync) {
      enLog(`Module ${getNamespaceLogString(namespace)} do not need to sync. Cancel to sync.`)
      return
    }
    enLog(`${getColorStringWarn(`Ready to sync module data:`)} ${getNamespaceLogString(namespace)}`)
    sendToSyncByData<T>(namespace, dataRef.value)
  })


  // 监听数据变化，执行保存和同步的逻辑
  const unwatch = watch(dataRef, () => {
    const mapData = getModuleByNamespace(namespace)

    enLog(`${getColorStringWarn(`Watched module data changed:`)} ${getNamespaceLogString(namespace)}`)
    enLog(`The module flag is [DoNotSave: ${mapData.doNotSave}, DoNotSync: ${mapData.doNotSync}].`)
    enLog(`The Data is: `, JSON.parse(JSON.stringify(dataRef.value)))

    saveData()
    syncDataByWebsocket()
  }, {
    deep: true,
  })
  mapData.unwatch = unwatch

  return dataRef
}


// 根据 namespace 加载 module 数据
export async function loadModuleDataByNamespace<T>(namespace: Namespace) {
  enLog(`${getColorStringWarn('Triggered to load module data')} of ${getNamespaceLogString(namespace)}`)
  const plugin = usePlugin()
  const storageKey = getModuleStorageKey(namespace)

  if (!syncDataRefMap[namespace]) {
    enError(`Module was not registered: ${getNamespaceLogString(namespace)}`)
    return
  }

  const loading = syncDataRefMap[namespace]?.loading
  if (loading) {
    enLog(`${getColorStringWarn('Module data is loading')} of ${getNamespaceLogString(namespace)}`)
    return
  }

  // 如果已经加载过了，则不重新加载了
  const loaded = syncDataRefMap[namespace]?.loaded
  if (loaded) {
    enLog(`${getColorStringWarn('Module data already loaded')} of ${getNamespaceLogString(namespace)}`)
    return syncDataRefMap[namespace]?.dataRef
  }

  enLog(`${getColorStringWarn('Ready to load module data')} of ${getNamespaceLogString(namespace)} from file [${storageKey}]`)
  syncDataRefMap[namespace].loading = true
  const res: EnSyncModuleData<T> = await plugin.loadData(storageKey)
  syncDataRefMap[namespace].loading = false


  syncDataRefMap[namespace].loaded = true
  enLog(`${getColorStringWarn('Loaded module data')} of ${getNamespaceLogString(namespace)} is: `, res)

  clearTimeout(syncDataRefMap[namespace].loadingFlag)
  const dataRef = syncDataRefMap[namespace]?.dataRef

  if (!dataRef) {
    enError(`Module ${getNamespaceLogString(namespace)} was not found.`)
    return
  }


  // 如果加载为空，则保存默认值到文件里
  if (!res) {
    enWarn(`${getColorStringWarn('Module data was not saved ')} for ${getNamespaceLogString(namespace)}`)
    enWarn(`Ready to save and return default data.`)
    await saveModuleDataByNamespace(namespace)
    enSuccess(`Saved default Module data. for ${getNamespaceLogString(namespace)}`)
    return syncDataRefMap[namespace]?.dataRef
  }

  const defaultDataCopy = _.cloneDeep(dataRef.value.defaultValue)

  // 合并默认值到返回值中，方便新增字段
  const mergedData = _.merge({}, defaultDataCopy, res?.data)
  const mergedRes = {
    data: mergedData,
    defaultValue: defaultDataCopy,
  }

  markAsDoNotSave(namespace)
  markAsDoNotSync(namespace)
  // 这里会重新更新数据
  dataRef.value = mergedRes
  return dataRef
}

/**
 * 重新加载 module 数据
 * @param {Namespace} namespace
 */
export async function reloadModuleDataByNamespace<T>(namespace: Namespace) {
  const module = getModuleByNamespace<T>(namespace)
  module.loaded = false
  return loadModuleDataByNamespace<T>(namespace)
}


/**
 * 根据 namespace 获取 module
 *
 * 获取 ref 使用 getModuleRefByNamespace
 * @returns EnSyncModule<T>
 */
export function getModuleByNamespace<T>(namespace: string): EnSyncModule<T> {
  const module = syncDataRefMap[namespace]
  if (!module) {
    enError(`Module was not registered: ${getNamespaceLogString(namespace)}`)
    return
  }
  return module
}


/**
 * 根据 namespace 获取 module 的数据引用
 * @returns EnSyncModuleDataRef<T>
 */
export function getModuleRefByNamespace<T>(namespace: string): EnSyncModuleDataRef<T> {
  return getModuleByNamespace<T>(namespace).dataRef
}


/**
 * Test
 */
export function unuseModuleByNamespace(namespace: string) {
  enLog(`${getColorStringWarn('Unuse module')} ${getNamespaceLogString(namespace)}`)
  const mapData = getModuleByNamespace(namespace)
  mapData.unwatch()
  delete syncDataRefMap[namespace]
}
