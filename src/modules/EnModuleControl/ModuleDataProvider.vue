<template>
  <a-config-provider
    size="mini"
  >
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
  </a-config-provider>
</template>

<script setup lang="ts">
import { lsNotebooks } from '@/api'
import EnProtyleObserver from '@/global/ProtyleObserver/EnProtyleObserver.vue'
import {
  initAuthData,
  injectAuthStatus,
} from '@/logic/Auth'
import { usePlugin } from '@/main'
import EnAuth from '@/modules/EnModuleControl/EnAuth.vue'
import {
  provideGlobalDataModule,
  provideGlobalModule,
  provideGlobalWindowDataModule,
  useGlobalData,
  watchConfigChanged,
} from '@/modules/EnModuleControl/ModuleProvide'
import { isInEnWindow } from '@/modules/EnWindow.vue'
import { moduleEnableStatusSwitcher } from '@/utils'
import {
  EN_CONSTANTS,
} from '@/utils/Constants'
import { syncDataSocket } from '@/utils/DataManager/useSyncDataChannel'
import {
  useSiyuanNotebookMount,
  useSiyuanNotebookUnmount,
} from '@/utils/EventBusHooks'
import {
  loadModuleDataByNamespace,
  syncDataRefMap,
} from '@/utils/SyncData'
import {
  computed,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
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




initAuthData(settings)
const {
  isFree,
  isNotFree,
  isPro,
  isVip,
  isPermanent,
} = injectAuthStatus()






// #region 模块数据控制逻辑

const moduleDataLoaded = ref(false)


const unmarkAll = () => {
  moduleDataLoaded.value = false
}

const syncSocketIsReady = computed(() => {
  return syncDataSocket.isOpen.value
})
const allIsReady = computed(() => {
  return syncSocketIsReady.value && moduleDataLoaded.value
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
  syncDataSocket.open()
  autoLoadModuleData()
})
onBeforeUnmount(() => {
  syncDataSocket.close()
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
