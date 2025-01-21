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
 *
 * 如果父级使用过 computedLevel, 则会自动注入父级权限
 *
 * 在 `TeleportModule` 中，则可以自动获取父级的权限
 */
export function provideParentAuth(parentAuth: ComputedRef<boolean>) {
  provide('parentAuth', parentAuth)
}
/**
 * 用于在 TeleportModule 中，自动获取父级的权限
 */
export function injectParentAuth(): ComputedRef<boolean> {
  const parentAuth = inject('parentAuth') as ComputedRef<boolean>
  return parentAuth
}
// #endregion 权限模块

// #endregion 👆 全局 inject 方法（方便后续不需要编写 TS 类型）





type DisableFunction = Noop

/**
 * 监听模块配置的变化（开关型：只有 true 和 false 两种状态），并执行开启和关闭时的逻辑
 *
 * @param enableStatusGetter - 返回模块配置开关状态的函数。必须使用函数形式，以确保值变化时能正确触发
 * @param onEnabled - 开启时执行的函数，需要返回一个用于关闭时执行的清理函数
 *
 * @example
 * ```typescript
 * // 示例1：监听模块启用状态
 * watchConfigEnableStatus(
 *   () => moduleOptions.value.enabled,
 *   () => {
 *     // 开启时的逻辑
 *     return () => {
 *       // 关闭时的逻辑
 *     }
 *   }
 * )
 *
 * // 示例2：监听生命日志显示状态
 * watchConfigEnableStatus(
 *   () => moduleOptions.value.showLifeLogFlag,
 *   () => {
 *     // 开启时的逻辑
 *     return () => {
 *       // 关闭时的逻辑
 *     }
 *   }
 * )
 * ```
 */
export function watchConfigEnableStatus(
  enableStatusGetter: () => boolean,
  onEnabled: () => (DisableFunction),
) {
  let disableFunction: DisableFunction = null
  watch(enableStatusGetter, (value) => {
    if (value) {
      disableFunction = onEnabled()
    } else {
      disableFunction?.()
    }
  }, {
    immediate: true,
    deep: true,
  })
  onBeforeUnmount(() => {
    disableFunction?.()
  })
}


/**
 * 监听模块配置的变化执行相应的操作
 *
 * @param statusGetter - 返回模块配置的函数。必须使用函数形式，以确保值变化时能正确触发
 * @param callback - 回调函数，需要返回一个用于关闭时执行的清理函数
 *
 * @example
 * ```typescript
 * // 示例1：监听模块启用状态
 * watchConfigEnableStatus(
 *   () => moduleOptions.value.defaultImageWidth,
 *   () => {
 *     document.documentElement.style.setProperty('--en-img-default-width', `${moduleOptions.value.defaultImageWidth}%`)
 *     return () => {
 *       document.documentElement.style.removeProperty('--en-img-default-width')
 *     }
 *   },
 * )
 * ```
 */
export function watchConfigChanged<T>(
  statusGetter: () => T,
  callback: (newValue: T, oldValue: T) => (DisableFunction),
) {
  let disableFunction: DisableFunction = null
  watch(statusGetter, (newValue, oldValue) => {
    disableFunction = callback(newValue, oldValue)
  }, {
    immediate: true,
    deep: true,
  })
  onBeforeUnmount(() => {
    disableFunction?.()
  })
}
