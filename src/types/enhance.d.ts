type Noop = () => void

type Namespace = string

interface Window {
  enLog: typeof import('@/utils/Log').enLog
  enWarn: typeof import('@/utils/Log').enWarn
  enError: typeof import('@/utils/Log').enError
  enSuccess: typeof import('@/utils/Log').enSuccess
  enEnableLogContext: () => void
  enDisableLogContext: () => void
  enWarnLogText: (text: string) => string
  enErrorLogText: (text: string) => string
  enSuccessLogText: (text: string) => string
}
const enLog: typeof import('@/utils/Log').enLog
const enWarn: typeof import('@/utils/Log').enWarn
const enError: typeof import('@/utils/Log').enError
const enSuccess: typeof import('@/utils/Log').enSuccess

const enEnableLogContext = () => {}
const enDisableLogContext = () => {}
const enWarnLogText = (text: string) => text
const enErrorLogText = (text: string) => text
const enSuccessLogText = (text: string) => text

interface EnAuth {
  lv: number
  expiration: string | number | null
}

interface EnAuthStatus {
  isFree: ComputedRef<boolean>
  isNotFree: ComputedRef<boolean>
  isPro: ComputedRef<boolean>
  isVip: ComputedRef<boolean>
  isPermanent: ComputedRef<boolean>
  levelLabel: ComputedRef<string>
  computedLevel: (level: number | string, provideParent?: boolean) => ComputedRef<boolean>
}

type EnBlockAppendMode = 'All' | 'targetDoc' | 'targetBlock' | 'currentDoc' | 'currentBlock' | 'subDoc'

interface EnSettings {
  isDebugging: boolean
  v: 0 | 1 | 2
  l: 0 | 1 | 2
}

interface GlobalModule extends EnSettings {}


/**
 * 用于记录 protyle 的观察者
 * 
 * @field enLoopKey 插件内部标识，用于 v-for 的 key
 * 
 * @field protyleBlockId 块id
 * @field protyleEl 块元素
 * @field protyleContentEl 块内容元素
 * 
 * @field isFlashCardProtyle 是否是闪卡
 * @field isEditorProtyle 是否是编辑器
 * @field isInDialog 是否在对话框中
 * @field dialogEl 对话框元素
 * 
 * @field isDailyNote 是否是日记
 * @field dailyNoteValues 日记值
 */
interface IProtyleObserverItem {
  // 插件内部标识，用于 v-for 的 key
  enLoopKey: string

  protyleBlockId: string
  protyleEl: HTMLElement
  protyleContentEl: HTMLElement

  isFlashCardProtyle: boolean
  isEditorProtyle: boolean
  isInDialog: boolean
  dialogEl: HTMLElement | null

  isDailyNote: boolean
  dailyNoteValues: {
    [key: string]: string
  }
}


interface GlobalData {
  notebookList: Notebook[]
  openedNotebookList: Notebook[]

  quickNoteMode: Array<EnBlockAppendMode>
  whiteBoardMode: Array<EnBlockAppendMode>

}

interface GlobalWindowData {
  isSyncing: boolean
  isStandalone: boolean

  isInSiyuanMain: boolean
  isInSiyuanWindowHtml: boolean
  isInEnWindow: boolean

  loadingLifeLogData: boolean
}


/**
 * 同步模块的数据结构
 * @field data 当前数据
 * @field defaultValue 默认数据
 */
interface EnSyncModuleData<T> {
  data: T
  defaultValue: T
}


/**
 * 模块接口
 *
 * @field enabled - 模块是否启用
 * @field moduleName - 模块名称，用于标识模块，不可修改
 * @field moduleDisplayName - 模块在设置界面显示的名称，不可修改
 */
interface EnModule {
  enabled: boolean
  readonly moduleName: EN_MODULE_LIST
  readonly moduleDisplayName: EN_CONSTANTS
  sort?: number
}

interface EnModuleOptions<T extends EnModule> {
  defaultData: T
}

interface EnSettingModule<T extends EnModule>
  extends EnSyncModuleData<T>
{

}
interface EnSettingModuleRef<T extends EnModule>
  extends EnSyncModuleDataRef<T>
{

}

interface EnSettingModuleDataRef<T extends EnModule> extends ComputedRef<T> {
}




interface EnModuleDailyNote extends EnModule {
  dailyNoteNotebookId: string
}


interface EnModuleQuickNote extends EnModule {
  notebookId: string
  targetId: string
  autoSaveConfigByWindow: boolean
  newBlockDelay: number
}






interface ILifeLog {
  [lifelogAttrTime]: string
  [lifelogAttrDate]: string
  [lifelogAttrType]: string
  [lifelogAttrContent]: string
  [lifelogAttrCreated]: string
  [lifelogAttrUpdated]: string
}

interface ILifeLogRecord {
  block_id: string
  record: ILifeLog
  date: string
  type: string
  content: string
  startTime?: dayjs.Dayjs
  startTimeFormatted?: string
  // 结束时间（带日期）
  endTime: dayjs.Dayjs
  endTimeFormatted?: string
  // 当天内的持续时间
  diff?: number
  diffFormatted?: string
  // 记录的完整持续时间，截止上一条记录。可能跨天。
  totalDiff?: number
  totalDiffFormatted?: string
}

interface ILifeLogTypeItem {
  baseColor: string
  items: Array<{
    type: string
    color: string
  }>
}

interface LifeLogModule extends EnModule {
  enableMarker: boolean
  showLifeLogFlag: boolean
  showLifeLogTimelineAtProtyleLeft: boolean
  enablePrivacyMode: boolean

  lifelogTypes: {
    fixed: ILifeLogTypeItem
    waste: ILifeLogTypeItem
    growth: ILifeLogTypeItem
    work: ILifeLogTypeItem
    other: ILifeLogTypeItem
  }
}


interface ILifeLogCheckData {
  paragraphList: Array<{
    id: string
    root_id: string
    content: string
    markdown: string
    date?: string
  }>
  docDateMap: {
    [key: string]: string[]
  }
}






interface EnModuleParagraphBlock extends EnModule {
  enableBlockTime: boolean
  blockTimeFontSize: number
  defaultBlockType: 'created' | 'updated'

  alwaysShowYMD: boolean
  enableLinkCard: boolean

  // enableBlockLock: boolean
  // autoLockTimeDiff: number
  // autoCheckTime: number
}




interface EnModuleComment extends EnModule {
  notebookId: string
  targetId: string

  enableCommentStyle: boolean
  commentStyle: undefined | 'dotted' | 'dashed' | 'solid' | 'double' | 'wavy' | 'highlight'
  autoMakeCard: boolean
  commentUnderlineWidth: number
  commentUnderlineColor: string
  enableHighlight: false
  commentBackgroundColor: string
  styleList: Array<{
    underlineStyle: string
    underlineWidth: number
    underlineColor: string

    enableHighlight: boolean
    backgroundColor: string
  }>

  customCommentStructure: string
  commentWrapMode: 'NodeList' | 'NodeSuperBlock'
}

/**
 * 批注信息
 * @field commentId 批注id
 * @field commentForDocId 批注目标文档id
 * @field commentForNodeId 批注目标块id
 * @field commentBlockId 写下批注的块id
 */
interface EnCommentInfo {
  // 批注id
  commentId: string
  // 批注目标文档id
  commentForDocId: string
  // 批注目标块id
  commentForNodeId: string
  // 写下批注的块id
  commentBlockId: string
}



interface EnModuleVideoAndAudio extends EnModule {
  jumpMode: 'toDoc' | 'openModal' | 'openWindow'
  autoPlay: boolean
}





interface BottomBacklinkModuleOptions extends EnModule {
  enableBottomBacklink: boolean
  bottomBacklinkTopDistance: number
  autoRenderBacklinkMap: {
    [id: string]: boolean
  }

  enableBacklinkFilter: boolean
  defaultShowBacklinkFilter: boolean
  sqlLimit: number
  docFilterProperties: {
    [id: string]: FilterProperties
  }
  docFilterPropertiesSaved: {
    [id: string]: {
      [name: string]: FilterProperties
    }
  }
}

interface IBacklink {
  id: string
  box: string
  name: string
  hPath: string
  type: string
  nodeType: string
  subType: string
  depth: number
  count: number
  updated: string
  created: string
}
