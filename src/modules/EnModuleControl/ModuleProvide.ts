import {
  EN_CONSTANTS,
  EN_MODULE_LIST,
} from '@/utils/Constants'
import {
  EnSyncModuleProps,
  loadModuleDataByNamespace,
  Namespace,
  useSyncModuleData,
} from '@/utils/SyncData'
import { cloneDeep } from 'lodash-es'
import {
  computed,
  ComputedRef,
  inject,
  onMounted,
  provide,
  WritableComputedRef,
} from 'vue'


export function useGlobalData<T>(
  namespace: Namespace,
  options?: Required<Pick<EnSyncModuleProps<T>, 'defaultData'>> &
    Partial<Omit<EnSyncModuleProps<T>, 'defaultData' | 'namespace'>>,
): IGlobalData<T> {
  const innerOptions = (options || {}) as EnSyncModuleProps<T>

  const optionsCopy = cloneDeep(innerOptions)
  optionsCopy.namespace = namespace
  const module = useSyncModuleData<T>(optionsCopy)
  const moduleOptions = computed({
    get: () => module.value.data,
    set: (value) => {
      module.value.data = value
    },
  })
  return {
    module,
    moduleOptions,
  }
}

export function useModule<T extends EnModule>(
  moduleName: EN_MODULE_LIST,
  options?: Required<Pick<EnSyncModuleProps<T>, 'defaultData'>> &
    Partial<Omit<EnSyncModuleProps<T>, 'defaultData' | 'namespace'>>,
): IGlobalData<T> {
  const globalData = useGlobalData<T>(moduleName, options)
  onMounted(() => {
    loadModuleDataByNamespace(moduleName)
  })
  return globalData
}




// #region 👇 全局 inject 方法（方便后续不需要编写 TS 类型）


// #region 全局模块，需要保存，也是 settings

/**
 * 注入全局模块，需要保存，也是 settings
 */
export function provideGlobalModule(globalModule: IGlobalData<EnSettings>) {
  provide(EN_CONSTANTS.GLOBAL_MODULE, globalModule)
}
export function injectGlobalModule(): IGlobalData<EnSettings> {
  const globalModule = inject(EN_CONSTANTS.GLOBAL_MODULE) as IGlobalData<EnSettings>
  return globalModule
}


/**
 * 注入 settings 数据
 */
export function injectSettings(): ComputedRef<EnSettings> {
  const globalModule = injectGlobalModule()
  return globalModule.moduleOptions
}

/**
 * 使用 settings 数据。
 * ❗️仅在 export 的方法中使用，用于 inject 失败的场景
 */
export function useSettingsExternal(): ComputedRef<EnSettings> {
  const {
    moduleOptions: settings,
  } = useGlobalData<EnSettings>(EN_CONSTANTS.SETTINGS)
  return settings
}
// #endregion 全局模块，需要保存，也是 settings





// #region 全局数据 GlobalData，不需要保存

/**
 * 注入全局数据模块 GlobalDataModule，不需要保存
 */
export function provideGlobalDataModule(globalData: IGlobalData<GlobalData>) {
  provide(`${EN_CONSTANTS.GLOBAL_DATA}_module`, globalData)
}
export function injectGlobalDataModule(): IGlobalData<GlobalData> {
  const globalData = inject(`${EN_CONSTANTS.GLOBAL_DATA}_module`) as IGlobalData<GlobalData>
  return globalData
}


/**
 * 注入全局数据 globalData，不需要保存
 */
export function injectGlobalData(): ComputedRef<GlobalData> {
  const globalData = injectGlobalDataModule()
  return globalData.moduleOptions
}


/**
 * 使用 globalData 数据。
 * ❗️仅在 export 的方法中使用，用于 inject 失败的场景
 */
export function useGlobalDataExternal(): ComputedRef<GlobalData> {
  const {
    moduleOptions: globalData,
  } = useGlobalData<GlobalData>(EN_CONSTANTS.GLOBAL_DATA)
  return globalData
}
// #endregion 全局数据 GlobalData，不需要保存



// #region 权限模块

/**
 * 注入权限模块
 */
export function provideAuthModule(authModule: IGlobalData<EnAuth>) {
  provide(`${EN_MODULE_LIST.AUTH}_module`, authModule)
}
export function injectAuthModule(): IGlobalData<EnAuth> {
  const authModule = inject(`${EN_MODULE_LIST.AUTH}_module`) as IGlobalData<EnAuth>
  return authModule
}

/**
 * 注入权限模块数据
 */
export function injectAuth(): WritableComputedRef<EnAuth> {
  const authModule = injectAuthModule()
  return authModule.moduleOptions
}



/**
 * 注入权限状态相关的变量
 */
export function provideAuthStatus(authStatus: EnAuthStatus) {
  provide('Auth_Status', authStatus)
}
export function injectAuthStatus(): EnAuthStatus {
  const authStatus = inject('Auth_Status') as EnAuthStatus
  return authStatus
}

/**
 * 提供父级权限
 * 如果父级使用过 computedLevel, 则会自动注入父级权限
 * 在 TeleportModule 中，则可以自动获取父级的权限
 */
export function provideParentAuth(parentAuth: ComputedRef<boolean>) {
  provide('parentAuth', parentAuth)
}
export function injectParentAuth(): ComputedRef<boolean> {
  const parentAuth = inject('parentAuth') as ComputedRef<boolean>
  return parentAuth
}
// #endregion 权限模块

// #endregion 👆 全局 inject 方法（方便后续不需要编写 TS 类型）

