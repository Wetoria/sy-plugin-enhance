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
  computedLevel: (level: number | string) => ComputedRef<boolean>
}

interface EnSettings {
  isDebugging: boolean
  v: 0 | 1 | 2
  l: 0 | 1 | 2
}

interface GlobalModule extends EnSettings {}

interface GlobalData {
  isSyncing: boolean
  isStandalone: boolean

  isInSiyuanMain: boolean
  isInSiyuanWindowHtml: boolean
  isInEnWindow: boolean

  notebookList: Notebook[]
  openedNotebookList: Notebook[]

  quickNoteMode: Array<'targetDoc' | 'targetBlock' | 'currentDoc' | 'currentBlock'>
}

interface IGlobalData<T> {
  module: EnSyncModuleDataRef<T>
  moduleOptions: WritableComputedRef<T>
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
 * 同步模块的数据引用 Ref<EnSyncModuleData<T>>
 */
type EnSyncModuleDataRef<T> = Ref<EnSyncModuleData<T>>


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

  lifelogTypes: {
    fixed: ILifeLogTypeItem
    waste: ILifeLogTypeItem
    growth: ILifeLogTypeItem
    work: ILifeLogTypeItem
    other: ILifeLogTypeItem
  }
}





interface EnModuleParagraphBlock extends EnModule {
  enableBlockTime: boolean
  blockTimeFontSize: number
  defaultBlockType: 'created' | 'updated'

  enableBlockLock: boolean
  autoLockTimeDiff: number
  autoCheckTime: number
}
