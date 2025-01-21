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
  onBeforeUnmount,
  onMounted,
  provide,
  Ref,
  watch,
  WritableComputedRef,
} from 'vue'


export interface IGlobalData<T> {
  module: Ref<EnSyncModuleData<T>>
  moduleOptions: WritableComputedRef<T>
}

type IGlobalDataOptions<T> = IGlobalData<T>['moduleOptions']

export function useGlobalData<T>(
  namespace: Namespace,
  options?: Required<Pick<EnSyncModuleProps<T>, 'defaultData'>> &
    Partial<Omit<EnSyncModuleProps<T>, 'defaultData' | 'namespace'>>,
): IGlobalData<T> {
  const innerOptions = (options || {}) as EnSyncModuleProps<T>

  const optionsCopy = cloneDeep(innerOptions)
  optionsCopy.namespace = namespace
  const module = useSyncModuleData<T>(optionsCopy)
  const moduleOptions = computed<T>({
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
export function injectSettings(): IGlobalDataOptions<EnSettings> {
  const globalModule = injectGlobalModule()
  return globalModule.moduleOptions
}

/**
 * 使用 settings 数据。
 * ❗️仅在 export 的方法中使用，用于 inject 失败的场景
 */
export function useSettingsExternal(): IGlobalDataOptions<EnSettings> {
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
export function injectGlobalData(): IGlobalDataOptions<GlobalData> {
  const globalData = injectGlobalDataModule()
  return globalData.moduleOptions
}


/**
 * 使用 globalData 数据。
 * ❗️仅在 export 的方法中使用，用于 inject 失败的场景
 */
export function useGlobalDataExternal(): IGlobalDataOptions<GlobalData> {
  const {
    moduleOptions: globalData,
  } = useGlobalData<GlobalData>(EN_CONSTANTS.GLOBAL_DATA)
  return globalData
}
// #endregion 全局数据 GlobalData，不需要保存


// #region 窗口的全局数据 GlobalWindowData，不需要保存，不需要同步
export function provideGlobalWindowDataModule(globalData: IGlobalData<GlobalWindowData>) {
  provide(`${EN_CONSTANTS.GLOBAL_WINDOW_DATA}_module`, globalData)
}
export function injectGlobalWindowDataModule(): IGlobalData<GlobalWindowData> {
  const globalData = inject(`${EN_CONSTANTS.GLOBAL_WINDOW_DATA}_module`) as IGlobalData<GlobalWindowData>
  return globalData
}


export function injectGlobalWindowData(): IGlobalDataOptions<GlobalWindowData> {
  const globalData = injectGlobalWindowDataModule()
  return globalData.moduleOptions
}


export function useGlobalWindowDataExternal(): IGlobalDataOptions<GlobalWindowData> {
  const {
    moduleOptions: globalData,
  } = useGlobalData<GlobalWindowData>(EN_CONSTANTS.GLOBAL_WINDOW_DATA)
  return globalData
}
// #endregion 窗口的全局数据 GlobalWindowData，不需要保存，不需要同步



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
export function injectAuth(): IGlobalDataOptions<EnAuth> {
  const authModule = injectAuthModule()
  return authModule.moduleOptions
}

export function useAuthExternal(): IGlobalDataOptions<EnAuth> {
  const {
    moduleOptions: auth,
  } = useGlobalData<EnAuth>(EN_CONSTANTS.AUTH)
  return auth
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

// 监听模块配置的开关，并执行开启和关闭时的逻辑
export function watchConfigEnableStatus(enableStatus: () => boolean, options: {
  onEnabled?: () => void
  onDisabled?: () => void
}) {
  const {
    onEnabled,
    onDisabled,
  } = options
  watch(enableStatus, (value) => {
    if (value) {
      onEnabled?.()
    }
    else {
      onDisabled?.()
    }
  }, {
    immediate: true,
  })
  onBeforeUnmount(() => {
    onDisabled?.()
  })
}
