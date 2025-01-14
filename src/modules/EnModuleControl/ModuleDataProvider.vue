<template>
  <template v-if="allIsReady">
    <slot
      v-bind="{
        isFree,
        isNotFree,
        isPro,
        isVip,
        isPermanent,
      }"
    ></slot>
    <EnAuth />
  </template>
</template>

<script setup lang="ts">
import { usePlugin } from '@/main'
import EnAuth from '@/modules/EnModuleControl/EnAuth.vue'
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
  watchEffect,
} from 'vue'


// #region 需要保存的全局数据，也是 Settings

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

// #endregion 需要保存的全局数据，也是 Settings




// #region 不需要保存的全局数据

const globalData: IGlobalData<GlobalData> = useGlobalData<GlobalData>(EN_CONSTANTS.GLOBAL_DATA, {
  defaultData: {
    isSyncing: false,
    isStandalone: false,
  },
  needSave: false,
})
// 提供不需要保存的全局数据
provide(`${EN_CONSTANTS.GLOBAL_DATA}_module`, globalData)

// TODO 需要测试
watchEffect(() => {
  console.log('globalData isSyncing', globalData.moduleOptions.value.isSyncing)
})

const { moduleOptions: globalDataOptions } = globalData

const plugin = usePlugin()
plugin.eventBus.on('sync-start', () => {
  globalDataOptions.value.isSyncing = true
})
plugin.eventBus.on('sync-end', () => {
  globalDataOptions.value.isSyncing = false
})
plugin.eventBus.on('sync-fail', () => {
  globalDataOptions.value.isSyncing = false
})

// #endregion 不需要保存的全局数据





// #region 权限模块

const authModule = useGlobalData<EnAuth>(EN_MODULE_LIST.AUTH, {
  defaultData: {
    lv: 0,
    expiration: null,
  },
  needSave: false,
})

const { moduleOptions: authModuleData } = authModule
provide(`${EN_MODULE_LIST.AUTH}_module`, authModule)

const isFree = computed(() => {
  return authModuleData.value.lv === 0 && settings.value.v === 0
})
const isNotFree = computed(() => !isFree.value)

const isPro = computed(() => {
  return settings.value.v === 1 || authModuleData.value.lv === 1
})
const isVip = computed(() => {
  return settings.value.v === 2 || authModuleData.value.lv === 99
})
const isPermanent = computed(() => {
  return !!settings.value.v && settings.value.v >= 1
})

const levelLabel = computed(() => {
  const map = {
    0: '普通版',
    98: 'Inner',
    99: 'Super',
  }
  return map[authModuleData.value.lv] || (authModuleData.value.lv ? `Lv. ${authModuleData.value.lv}` : '--')
})

const computedLevel = (level: number | string) => {
  const hasAuth = computed(() => {
    return !level || authModuleData.value.lv >= Number(level) || settings.value.v >= 1
  })
  return hasAuth
}
provide('Auth_Status', {
  isFree,
  isNotFree,
  isPro,
  isVip,
  isPermanent,
  levelLabel,
  computedLevel,
})

watchEffect(() => {
  if (settings.value.isDebugging) {
    console.log(`Auth flag is isFree: ${isFree.value}, isPro: ${isPro.value}, isVip: ${isVip.value}, isNotFree: ${isNotFree.value}, isPermanent: ${isPermanent.value}`)
  }
})

// #endregion 权限模块





// #region 模块数据控制逻辑

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

// #endregion 模块数据控制逻辑
</script>

<style lang="scss" scoped>

</style>
