<template>
  <template v-if="globalLoaded">
    <slot />
  </template>
</template>

<script lang="ts">
import {
  EnModule,
  loadSettings,
} from '@/modules/Settings/EnSettings.vue'
import { EN_MODULE_LIST } from '@/utils/Constants'
import {
  EnSyncModuleDataRef,
  EnSyncModuleProps,
  initWebsocket,
  loadModuleDataByNamespace,
  Namespace,

  syncDataRefMap,
  useSyncModuleData,
} from '@/utils/SyncData'
import lodash from 'lodash'
import {
  computed,
  ComputedRef,
  onMounted,

  ref,
  watchEffect,
} from 'vue'

interface GlobalData<T> {
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
  moduleName: EN_MODULE_LIST,
  options?: Required<Pick<EnSyncModuleProps<T>, 'defaultData'>> &
    Partial<Omit<EnSyncModuleProps<T>, 'defaultData' | 'namespace'>>,
): GlobalData<T> {
  const globalData = useGlobalData<T>(moduleName, options)
  onMounted(() => {
    console.log('test onmouted ', moduleName)
    loadModuleDataByNamespace(moduleName)
  })
  return globalData
}

</script>

<script setup lang="ts">

const wsInited = ref(false)
const settingsLoaded = ref(false)
const moduleDataLoaded = ref(false)
const globalLoaded = computed(() => {
  return wsInited.value && settingsLoaded.value && moduleDataLoaded.value
})

watchEffect(() => {
  if (globalLoaded.value) {
    enSuccess('Global Data Loaded, Start to load Module Components')
  }
})

const autoLoadModuledata = async () => {
  const namespaces = Object.keys(syncDataRefMap)
  const needLoadNamespaces = namespaces.filter((namespace) => {
    const module = syncDataRefMap[namespace]
    return !module.loaded && module.needSave
  })
  enLog('needLoadNamespaces', needLoadNamespaces)
  for (const namespace of needLoadNamespaces) {
    await loadModuleDataByNamespace(namespace)
  }
  moduleDataLoaded.value = true
}

onMounted(() => {
  initWebsocket().then(() => {
    wsInited.value = true
  })
  loadSettings().then(() => {
    settingsLoaded.value = true
  })
  autoLoadModuledata()
})


</script>

<style lang="scss" scoped>

</style>
