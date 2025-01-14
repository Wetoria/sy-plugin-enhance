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
import lodash from 'lodash'
import {
  computed,
  ComputedRef,
  inject,
  onMounted,
} from 'vue'


export function useGlobalData<T>(
  namespace: Namespace,
  options?: Required<Pick<EnSyncModuleProps<T>, 'defaultData'>> &
    Partial<Omit<EnSyncModuleProps<T>, 'defaultData' | 'namespace'>>,
): IGlobalData<T> {
  const innerOptions = (options || {}) as EnSyncModuleProps<T>

  const optionsCopy = lodash.cloneDeep(innerOptions)
  optionsCopy.namespace = namespace
  const module = useSyncModuleData<T>(optionsCopy)
  const moduleOptions = computed(() => module.value.data)
  return {
    module,
    moduleOptions,
  }
}

export function useModule<T extends EnModule>(
  moduleName: EN_MODULE_LIST | string,
  options?: Required<Pick<EnSyncModuleProps<T>, 'defaultData'>> &
    Partial<Omit<EnSyncModuleProps<T>, 'defaultData' | 'namespace'>>,
): IGlobalData<T> {
  const globalData = useGlobalData<T>(moduleName, options)
  onMounted(() => {
    loadModuleDataByNamespace(moduleName)
  })
  return globalData
}

// 👇 全局 inject 方法（方便后续不需要编写 TS 类型）

// 需要保存的全局模块，也就是 EnSettings 设置模块
export function injectGlobalModule(): IGlobalData<EnSettings> {
  const globalModule = inject(EN_CONSTANTS.GLOBAL_MODULE) as IGlobalData<EnSettings>
  return globalModule
}

export function injectSettings(): ComputedRef<EnSettings> {
  const globalModule = injectGlobalModule()
  return globalModule.moduleOptions
}

// 不需要保存的全局模块，也就是 GlobalData 模块
export function injectGlobalDataModule(): IGlobalData<GlobalData> {
  const globalData = inject(`${EN_CONSTANTS.GLOBAL_DATA}_module`) as IGlobalData<GlobalData>
  return globalData
}

export function injectGlobalData(): ComputedRef<GlobalData> {
  const globalData = injectGlobalDataModule()
  return globalData.moduleOptions
}

// 授权的模块数据
export function injectAuthModule(): IGlobalData<EnAuth> {
  const authModule = inject(`${EN_MODULE_LIST.AUTH}_module`) as IGlobalData<EnAuth>
  return authModule
}

export function injectAuth(): ComputedRef<EnAuth> {
  const authModule = injectAuthModule()
  return authModule.moduleOptions
}

export function injectAuthStatus(): {
  isFree: ComputedRef<boolean>
  isNotFree: ComputedRef<boolean>
  isPro: ComputedRef<boolean>
  isVip: ComputedRef<boolean>
  isPermanent: ComputedRef<boolean>
  computedLevel: (level: number | string) => ComputedRef<boolean>
} {
  const authStatus = inject('Auth_Status') as {
    isFree: ComputedRef<boolean>
    isNotFree: ComputedRef<boolean>
    isPro: ComputedRef<boolean>
    isVip: ComputedRef<boolean>
    isPermanent: ComputedRef<boolean>
    computedLevel: (level: number | string) => ComputedRef<boolean>
  }
  return authStatus
}

