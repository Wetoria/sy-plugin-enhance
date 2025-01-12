import { EnModule } from '@/modules/Settings/EnSettings.vue'
import { ModuleName_TestLogic } from '@/modules/Test/TestLogic.vue'
import { EN_MODULE_LIST } from '@/utils/Constants'
import {
  EnSyncModuleDataRef,
  EnSyncModuleProps,
  loadModuleDataByNamespace,
  Namespace,
  useSyncModuleData,
} from '@/utils/SyncData'
import lodash from 'lodash'
import {
  computed,
  ComputedRef,
  onMounted,
} from 'vue'

window.en_plugin_global = {}

export interface GlobalData<T> {
  module: EnSyncModuleDataRef<T>
  moduleOptions: ComputedRef<T>
}
export function useGlobalData<T>(
  namespace: Namespace,
  options?: Required<Pick<EnSyncModuleProps<T>, 'defaultData'>> &
    Partial<Omit<EnSyncModuleProps<T>, 'defaultData' | 'namespace'>>,
): GlobalData<T> {
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
): GlobalData<T> {
  const globalData = useGlobalData<T>(moduleName, options)
  onMounted(() => {
    loadModuleDataByNamespace(moduleName)
  })
  return globalData
}

export const moduleOrder = [
  ModuleName_TestLogic,
  EN_MODULE_LIST.DAILY_NOTE,
  'EnComment',
  EN_MODULE_LIST.EN_WHITE_BOARD,
  'EnBottomBacklink',
  'EnLifeLog',
]
