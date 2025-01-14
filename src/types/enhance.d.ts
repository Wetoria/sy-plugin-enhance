interface EnAuth {
  lv: number
  expiration: string | number | null
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
}

interface IGlobalData<T> {
  module: EnSyncModuleDataRef<T>
  moduleOptions: ComputedRef<T>
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
  readonly moduleName: EN_MODULE_LIST | string
  readonly moduleDisplayName: string
  sort?: number
}
