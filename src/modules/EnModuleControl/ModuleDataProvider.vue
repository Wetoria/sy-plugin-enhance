<template>
  <template v-if="allIsReady">
    <slot></slot>
  </template>
</template>

<script setup lang="ts">
import {
  useGlobalData,
} from '@/modules/EnModuleControl/ModuleProvide'
import {
  EN_CONSTANTS,
  EN_MODULE_LIST,
} from '@/utils/Constants'
import {
  closeWebsocket,
  initWebsocket,
  loadModuleDataByNamespace,
  syncDataRefMap,
} from '@/utils/SyncData'
import {
  computed,
  onBeforeUnmount,
  onMounted,
  provide,
  ref,
} from 'vue'


const settingsGlobalData = useGlobalData<EnSettings>(EN_CONSTANTS.SETTINGS, {
  defaultData: {
    isDebugging: false,
    v: 0,
    l: 0,
  },
})
const {
  moduleOptions: settings,
} = settingsGlobalData
provide(EN_CONSTANTS.SETTINGS, settings)
// 提供需要保存的全局数据
provide(EN_CONSTANTS.GLOBAL_MODULE, settingsGlobalData)


const globalData = useGlobalData<GlobalData>(EN_CONSTANTS.GLOBAL_DATA, {
  defaultData: {
    isSyncing: false,
    isStandalone: false,
  },
  needSave: false,
})
// 提供不需要保存的全局数据
provide(`${EN_CONSTANTS.GLOBAL_DATA}_module`, globalData)


const authModule = useGlobalData<EnAuth>(EN_MODULE_LIST.AUTH, {
  defaultData: {
    lv: 0,
    expiration: null,
  },
  needSave: false,
})
provide(`${EN_MODULE_LIST.AUTH}_module`, authModule)

const wsInited = ref(false)
const moduleDataLoaded = ref(false)


const unmarkAll = () => {
  wsInited.value = false
  moduleDataLoaded.value = false
}

const allIsReady = computed(() => {
  return wsInited.value && moduleDataLoaded.value
})

const autoLoadModuleData = async () => {
  const namespaces = Object.keys(syncDataRefMap)
  const needLoadNamespaces = namespaces.filter((namespace) => {
    const module = syncDataRefMap[namespace]
    // 需要保存，并且是自动保存的，但是没有加载的模块
    return module.needSave && module.autoLoad && !module.loaded
  })
  console.log(' needLoadNamespaces is ', needLoadNamespaces)
  if (!needLoadNamespaces.length) {
    moduleDataLoaded.value = true
    return
  }
  await Promise.all(needLoadNamespaces.map((namespace) => loadModuleDataByNamespace(namespace)))
  moduleDataLoaded.value = true
}

onMounted(() => {
  initWebsocket().then(() => {
    wsInited.value = true
  })
  autoLoadModuleData()
})
onBeforeUnmount(() => {
  closeWebsocket()
  unmarkAll()
})
</script>

<style lang="scss" scoped>

</style>
