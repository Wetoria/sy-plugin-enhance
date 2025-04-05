import {
  IGlobalData,
  useGlobalData,
  useModule,
} from '@/modules/EnModuleControl/ModuleProvide'
import {
  generateUUIDWithTimestamp,
} from '@/utils'
import {
  EN_CONSTANTS,
  EN_MODULE_LIST,
} from '@/utils/Constants'
import { isSequentialMatch } from '@/utils/String'
import {
  loadModuleDataByNamespace,
  unuseModuleByNamespace,
} from '@/utils/SyncData'
import { Notification } from '@arco-design/web-vue'
import {
  Edge,
  Node,
  ViewportTransform,
} from '@vue-flow/core'
import { cloneDeep } from 'lodash-es'

import {
  computed,
  reactive,
  Ref,
  ref,
} from 'vue'



export function generateWhiteBoardIdWithPrefix(prefix: string) {
  const shortUUID = generateUUIDWithTimestamp()
  return `${prefix}-${shortUUID}`
}


export function generateWhiteBoardId() {
  return generateWhiteBoardIdWithPrefix('en-whiteboard-id')
}
export function generateWhiteBoardNodeId() {
  return generateWhiteBoardIdWithPrefix('en-whiteboard-node-id')
}
export function generateWhiteBoardEdgeId() {
  return generateWhiteBoardIdWithPrefix('en-whiteboard-edge-id')
}

export interface EnWhiteBoardBlockDomTarget {
  whiteBoardId: string
  nodeId: string
  idList: string[]
  domRef: HTMLElement
  // 返回 html 块元素
  getDom: () => HTMLElement
}

export function getWhiteBoardCardMainByWhiteBoardNodeId(target: HTMLElement, whiteBoardNodeId: string) {
  return target.querySelector(`.EnWhiteBoardNodeProtyleMain[data-en-flow-node-id="${whiteBoardNodeId}"]`) as HTMLElement
}


export interface EnWhiteBoardSetting extends EnModule {
  embedBlockMinHeight: number
  siderLeftWidthDefault: number
  siderLeftShowDefault: boolean
  siderRightWidthDefault: number
  siderRightShowDefault: boolean

  autoMergeToSuperBlock: boolean
  autoMergeToSuperBlockDelay: number

  cardWidthDefault: number
  cardHeightDefault: number

  backgroundVariant: 'dots' | 'lines' | 'none'
  
  // 节点块创建模式相关配置
  notebookId: string
  targetId: string
  autoSaveConfigByWindow: boolean

  // 边默认配置
  edgeTypeDefault: 'smoothstep' | 'step' | 'straight' | 'bezier'  // 边类型
  edgeWidthDefault: '1' | '2' | '3'                              // 边粗细
  edgeStyleDefault: 'solid' | 'dashed' | 'dotted'                // 边样式
  edgeMarkerStartDefault: '' | 'circle-solid' | 'line' | 'circle-hollow' | 'arrow-start'  // 起点箭头
  edgeMarkerEndDefault: '' | 'circle-solid' | 'line' | 'circle-hollow' | 'arrow'          // 终点箭头
}
export function useWhiteBoardModule() {
  return useModule<EnWhiteBoardSetting>(EN_MODULE_LIST.EN_WHITE_BOARD)
}


export const Module_EnWhiteBoardIndexMap = EN_CONSTANTS.EN_WHITE_BOARD_INDEX_MAP

export interface EnWhiteBoardIndexMap {
  [key: string]: {
    // 方便后续新增加相关字段
    whiteBoardId: string
    whiteBoardName: string
  }
}


export const EN_WHITEBOARD_CONFIG_BASE_PATH = `${EN_CONSTANTS.WHITEBOARD_BASE_PATH}/`
export function getWhiteBoardConfigPathById(whiteBoardId: string) {
  return `${EN_WHITEBOARD_CONFIG_BASE_PATH}${whiteBoardId}`
}


export interface EnWhiteBoardNodeData {
  // 思源块 id
  blockId: string
  // 节点样式配置
  style?: {
    // 节点变体类型: default | card | note
    variant?: 'default' | 'card' | 'note'
    // 节点背景色
    backgroundColor?: string
  }
  // 父节点ID
  parentId?: string
  // 子节点ID列表，用于frame节点存储嵌套的节点
  childNodeIds?: string[]
}

export interface EnWhiteBoardEdgeData {
  // 连接线上的描述文本
  // 未来可能会是块引的锚文本
  label: string
}

export interface EnWhiteBoardConfig {
  id: string
  name: string

  loaded?: boolean

  // 白板嵌入时的配置
  // 比如不同文档下渲染同一个白板，可以分别配置一个高度
  // 每一个嵌入的白板有一个单独的配置
  embedOptions: {
    // 如果以后想每个 tab、window 都展示不同的效果，可以在这里扩展
    // 比如生成 wb-tab-id-xxx 和 wb-window-id-xxx
    [id: string]: {
      // 嵌入的白板高度
      height: number

      SiderLeftShow: boolean
      SiderLeftWidth: number
      SiderLeftWidthLast?: number

      SiderRightShow: boolean
      SiderRightWidth: number
      SiderRightWidthLast?: number
    }
  }

  // 白板的配置
  // 所有白板都使用同一个渲染配置
  // 如果是嵌入的白板，就不让显示侧边栏了，除非展开显示
  boardOptions: {
    keepEmbedOptionsSame: boolean

    nodes: Node<EnWhiteBoardNodeData>[]
    edges: Edge<EnWhiteBoardEdgeData>[]
    viewport: ViewportTransform

    backgroundVariant: 'dots' | 'lines' | 'none'
    useCustomBackground: boolean

    // 当前在侧边栏中选中的节点ID
    selectedNodeId?: string
    // 当前在侧边栏中选中的块ID
    selectedBlockId?: string
  }
}

interface ConfigList {
  [id: string]: IGlobalData<EnWhiteBoardConfig>
}
export const whiteBoardRef: {
  // 每一个白板的配置。包括数据等
  // 这个对象不应该存储，而是应该存储每一个 EnWhiteBoardConfig
  configList: Ref<ConfigList>
  indexMap: IGlobalData<EnWhiteBoardIndexMap>
} = {
  configList: ref({}),
  indexMap: null,
}
export const whiteBoardConfigList = computed<ConfigList>(() => whiteBoardRef.configList.value)


export function getWhiteBoardListBySearchValue(searchValue: string) {
  if (!whiteBoardRef.indexMap) {
    return []
  }
  const testData = Object.values(whiteBoardRef.indexMap.moduleOptions.value)
  const searchChars = Array.from(searchValue)

  // 将结果分为精确匹配和模糊匹配两组
  const exactMatches: typeof testData = []
  const sequentialMatches: typeof testData = []

  testData.forEach((item) => {
    const exactMatch = item.whiteBoardName.includes(searchValue)
      || item.whiteBoardId.includes(searchValue)
    const sequentialMatch = isSequentialMatch(item.whiteBoardName, searchChars)
      || isSequentialMatch(item.whiteBoardId, searchChars)

    if (exactMatch) {
      exactMatches.push(item)
    } else if (sequentialMatch) {
      sequentialMatches.push(item)
    }
  })

  // 合并两组结果
  return [...exactMatches, ...sequentialMatches]
}



const defaultWhiteBoardConfig: EnWhiteBoardConfig = {
  id: '',
  name: '',

  embedOptions: {},

  boardOptions: {
    keepEmbedOptionsSame: false,
    nodes: [],
    edges: [],
    viewport: {
      x: 0,
      y: 0,
      zoom: 1,
    },
    backgroundVariant: 'none',
    useCustomBackground: false,
  },
}

function getDefaultEmbedOptions(): EnWhiteBoardConfig['embedOptions']['id'] {
  const { moduleOptions } = useWhiteBoardModule()
  return {
    height: moduleOptions.value.embedBlockMinHeight,
    SiderLeftShow: moduleOptions.value.siderLeftShowDefault,
    SiderLeftWidth: moduleOptions.value.siderLeftWidthDefault,
    SiderRightShow: moduleOptions.value.siderRightShowDefault,
    SiderRightWidth: moduleOptions.value.siderRightWidthDefault,
  }
}

async function createWhiteBoardConfig({
  whiteBoardId,
  whiteBoardName,
  embedNodeId,
}: {
  whiteBoardId: string
  whiteBoardName: string
  embedNodeId?: string
}) {
  const newDefaultConfig = cloneDeep(defaultWhiteBoardConfig)
  newDefaultConfig.id = whiteBoardId
  newDefaultConfig.name = whiteBoardName

  if (embedNodeId) {
    newDefaultConfig.embedOptions[embedNodeId] = getDefaultEmbedOptions()
  }

  const newConfig = await loadWhiteBoardConfigById(whiteBoardId, newDefaultConfig)
  return newConfig
}

function deleteWhiteBoardConfigById(whiteBoardId: string) {
  const path = getWhiteBoardConfigPathById(whiteBoardId)
  unuseModuleByNamespace(path)
  delete whiteBoardRef.configList.value[whiteBoardId]
}

export async function loadWhiteBoardConfigById(whiteBoardId: string, defaultData: EnWhiteBoardConfig = defaultWhiteBoardConfig) {
  const path = getWhiteBoardConfigPathById(whiteBoardId)
  const config = useGlobalData<EnWhiteBoardConfig>(path, {
    defaultData,
    autoLoad: false,
  })
  await loadModuleDataByNamespace(path)

  config.moduleOptions.value.loaded = true
  whiteBoardRef.configList.value[whiteBoardId] = config
  return config
}

export function getWhiteBoardConfigRefById(whiteBoardId: string, embedTargetId: string) {
  const embedWhiteBoardConfigRef = computed(() => {
    const config = whiteBoardConfigList.value && whiteBoardConfigList.value[whiteBoardId]
    // globaData 是非响应式的，所以这里得包装一下，防止下面的计算属性不能正确更新。
    return reactive(config)
  })
  const embedWhiteBoardConfigData = computed<EnWhiteBoardConfig>(() => {
    // 如果上面不用 reactive 进行包装，这里的 .value 将是一个非响应式数据，会出现上面的变了，这里没有更新。
    return embedWhiteBoardConfigRef.value?.moduleOptions
  })
  const embedBlockOptions = computed<undefined | EnWhiteBoardConfig['embedOptions']['id']>(() => {
    return embedWhiteBoardConfigData.value?.embedOptions[embedTargetId]
  })
  return {
    embedWhiteBoardConfigRef,
    embedWhiteBoardConfigData,
    embedBlockOptions,
  }
}


export async function createWhiteBoard({
  whiteBoardId,
  whiteBoardName,
  embedNodeId,
}: {
  whiteBoardId: string
  whiteBoardName: string
  embedNodeId?: string
}) {
  whiteBoardRef.indexMap.moduleOptions.value[whiteBoardId] = {
    whiteBoardId,
    whiteBoardName,
  }
  whiteBoardRef.configList.value[whiteBoardId] = await createWhiteBoardConfig({
    whiteBoardId,
    whiteBoardName,
    embedNodeId,
  })
}

export async function embedWhiteBoard({
  whiteBoardId,
  whiteBoardName,
  embedNodeId,
  isNew,
}: {
  whiteBoardId: string
  whiteBoardName: string
  embedNodeId?: string
  isNew: boolean
}) {
  const exist = whiteBoardRef.indexMap.moduleOptions.value[whiteBoardId]

  // 不太可能出现，但还是留着这个
  if (isNew && exist) {
    Notification.warning({
      content: `Find duplicated Whiteboard, Please contact the author.`,
    })
  }

  let config
  if (exist) {
    config = await loadWhiteBoardConfigById(whiteBoardId)
    console.log('config is ', config)
    const newEmbedOptions = getDefaultEmbedOptions()
    config.moduleOptions.value.embedOptions[embedNodeId] = newEmbedOptions
  } else {
    config = await createWhiteBoard({
      whiteBoardId,
      whiteBoardName,
      embedNodeId,
    })
  }
  return config
}


export function loadWhiteBoard() {
  whiteBoardRef.indexMap = useGlobalData<EnWhiteBoardIndexMap>(Module_EnWhiteBoardIndexMap, {
    defaultData: {},
    autoLoad: false,
  })
  loadModuleDataByNamespace(Module_EnWhiteBoardIndexMap)
}

export function unloadWhiteBoard() {
  unuseModuleByNamespace(Module_EnWhiteBoardIndexMap)
  whiteBoardRef.indexMap = null

  Object.keys(whiteBoardRef.configList.value).forEach((whiteBoardId) => {
    deleteWhiteBoardConfigById(whiteBoardId)
  })
}

// 保存白板配置
export const saveWhiteBoardConfig = (whiteBoardId: string, nodeId: string, configData: any) => {
  const configRef = getWhiteBoardConfigRefById(whiteBoardId, nodeId)
  if (configRef?.embedWhiteBoardConfigData) {
    Object.assign(configRef.embedWhiteBoardConfigData.value, configData)
  }
}

// 更新白板节点和边
export const updateWhiteBoardNodesAndEdges = (whiteBoardId: string, nodeId: string, nodes: any[], edges: any[]) => {
  const configRef = getWhiteBoardConfigRefById(whiteBoardId, nodeId)
  if (configRef?.embedWhiteBoardConfigData) {
    Object.assign(configRef.embedWhiteBoardConfigData.value.boardOptions, {
      nodes,
      edges,
    })
  }
}
