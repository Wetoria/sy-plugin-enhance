<template>
  <div v-if="allIsReady">
    <EnAuth />
    <EnProtyleObserver />
    <slot
      v-bind="{
        isFree,
        isNotFree,
        isPro,
        isVip,
        isPermanent,
      }"
    ></slot>
  </div>
</template>

<script setup lang="ts">
import { lsNotebooks } from '@/api'
import { usePlugin } from '@/main'
import EnAuth from '@/modules/EnModuleControl/EnAuth.vue'
import EnProtyleObserver from '@/modules/EnModuleControl/EnProtyleObserver.vue'
import {
  provideAuthModule,
  provideAuthStatus,
  provideGlobalDataModule,
  provideGlobalModule,
  provideGlobalWindowDataModule,
  provideParentAuth,
  useGlobalData,
  watchConfigChanged,
} from '@/modules/EnModuleControl/ModuleProvide'
import { isInEnWindow } from '@/modules/EnWindow.vue'
import { moduleEnableStatusSwitcher } from '@/utils'
import {
  EN_CONSTANTS,
  EN_MODULE_LIST,
} from '@/utils/Constants'
import {
  useSiyuanNotebookMount,
  useSiyuanNotebookUnmount,
} from '@/utils/EventBusHooks'
import {
  loadModuleDataByNamespace,
  syncDataRefMap
} from '@/utils/SyncData'
import {
  computed,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
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
// 提供需要保存的全局数据
provideGlobalModule(settingsGlobalData)

// #endregion 需要保存的全局数据，也是 Settings




// #region 不需要保存的全局数据

const isInWindowHtml = location.href.includes('window.html')

const globalDataModule = useGlobalData<GlobalData>(EN_CONSTANTS.GLOBAL_DATA, {
  defaultData: {
    notebookList: [],
    openedNotebookList: [],

    quickNoteMode: ['targetBlock', 'targetDoc'],
    whiteBoardMode: ['All', 'targetBlock', 'targetDoc'],
    // commentMode: ['currentDoc', 'targetDoc', 'targetBlock'],
    commentMode: [],
  },
  needSave: false,
})
const { moduleOptions: globalData } = globalDataModule

// 提供不需要保存的全局数据
provideGlobalDataModule(globalDataModule)


const globalWindowDataModule = useGlobalData<GlobalWindowData>(EN_CONSTANTS.GLOBAL_WINDOW_DATA, {
  defaultData: {
    isSyncing: false,
    isStandalone: false,

    isInSiyuanMain: !isInWindowHtml,
    isInSiyuanWindowHtml: isInWindowHtml,
    isInEnWindow: isInEnWindow(),

    loadingLifeLogData: false,

    protyleList: [],
  },
  needSave: false,
  needSync: false,
})
const { moduleOptions: globalWindowData } = globalWindowDataModule
provideGlobalWindowDataModule(globalWindowDataModule)

// 测试模式绑定数据到 window 对象上
watch(() => settings.value.isDebugging, (value) => {
  if (value) {
    window.SEP_GLOBAL.globalData = globalData
    window.SEP_GLOBAL.globalWindowData = globalWindowData
  }
})

// #region 笔记本相关数据控制逻辑

async function updateOpenedNotebookList() {
  const res = await lsNotebooks()
  globalData.value.notebookList = res?.notebooks || []
  globalData.value.openedNotebookList = globalData.value.notebookList.filter((i) => !i.closed)
}


onMounted(() => {
  updateOpenedNotebookList()

  // 在思源本体中，监听思源的笔记本变化
  // 其实这样写，每一个终端都会监听，有一点点蠢
  if (globalWindowData.value.isInSiyuanMain) {
    useSiyuanNotebookMount(() => {
      updateOpenedNotebookList()
    })
    useSiyuanNotebookUnmount(() => {
      updateOpenedNotebookList()
    })
  }
})

// #endregion 笔记本相关数据控制逻辑


const plugin = usePlugin()
plugin.eventBus.on('sync-start', () => {
  globalWindowData.value.isSyncing = true
})
plugin.eventBus.on('sync-end', () => {
  globalWindowData.value.isSyncing = false
})
plugin.eventBus.on('sync-fail', () => {
  globalWindowData.value.isSyncing = false
})

// #endregion 不需要保存的全局数据





// #region 权限模块

const authStorageKey = `en_a`
const defaultAuthData = {
  lv: 0,
  expiration: null,
}
const storagedAuthData = localStorage.getItem(authStorageKey)
if (storagedAuthData) {
  const lv = storagedAuthData.slice(0, 3)
  const expiration = storagedAuthData.slice(3)
  defaultAuthData.lv = Number(lv)
  defaultAuthData.expiration = Number(expiration)
}

const authModule = useGlobalData<EnAuth>(EN_MODULE_LIST.AUTH, {
  defaultData: defaultAuthData,
  needSave: false,
})

const { moduleOptions: authModuleData } = authModule
provideAuthModule(authModule)

watch(authModuleData, () => {
  const {
    lv,
    expiration,
  } = authModuleData.value
  const prefix = `${lv}`.padStart(3, '0')
  const suffix = `${expiration}`
  localStorage.setItem(authStorageKey, `${prefix}${suffix}`)
})

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

const computedLevel = (level: number | string, provideParent = true) => {
  const hasAuth = computed(() => {
    return !level || authModuleData.value.lv >= Number(level) || settings.value.v >= 1
  })
  if (provideParent) {
    provideParentAuth(hasAuth)
  }
  return hasAuth
}

provideAuthStatus({
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

const moduleDataLoaded = ref(false)


const unmarkAll = () => {
  moduleDataLoaded.value = false
}

const allIsReady = computed(() => {
  return moduleDataLoaded.value
})

const autoLoadModuleData = async () => {
  const namespaces = Object.keys(syncDataRefMap)
  const needLoadNamespaces = namespaces.filter((namespace) => {
    const module = syncDataRefMap[namespace]
    // 需要保存，并且是自动保存的，但是没有加载的模块
    return module.needSave && module.autoLoad && !module.loaded
  })
  if (!needLoadNamespaces.length) {
    moduleDataLoaded.value = true
    return
  }
  await Promise.all(needLoadNamespaces.map((namespace) => loadModuleDataByNamespace(namespace)))
  moduleDataLoaded.value = true
}

onMounted(() => {
  autoLoadModuleData()
})
onBeforeUnmount(() => {
  unmarkAll()
})

// #endregion 模块数据控制逻辑


watchConfigChanged(
  () => plugin.isMobile,
  () => {
    moduleEnableStatusSwitcher('isMobile', plugin.isMobile)
    return () => {
      moduleEnableStatusSwitcher('isMobile')
    }
  },
)
</script>

<style lang="scss" scoped>

</style>
