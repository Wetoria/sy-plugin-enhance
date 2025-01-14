<template>
  <template v-if="globalLoaded">
    <slot />
  </template>
</template>

<script lang="ts">
import {
  EN_CONSTANTS,
  EN_MODULE_LIST,
} from '@/utils/Constants'
import {
  closeWebsocket,
  initWebsocket,
  loadModuleDataByNamespace,

  syncDataRefMap,
  useSyncModuleData,
} from '@/utils/SyncData'
import {
  computed,
  onBeforeUnmount,
  onMounted,

  provide,

  ref,
  watchEffect,
} from 'vue'

</script>

<script setup lang="ts">

const syncSettings = useSyncModuleData<EnSettings>({
  namespace: EN_CONSTANTS.SETTINGS,
  defaultData: {
    isDebugging: false,
    v: 0,
    l: 0,

    boxId: '',

    modules: {},
  },
})
const settings = computed(() => syncSettings.value.data)
provide(EN_CONSTANTS.SETTINGS, settings)

async function loadSettings() {
  await loadModuleDataByNamespace(EN_CONSTANTS.SETTINGS)
}

const authModule = useSyncModuleData<EnAuth>({
  namespace: EN_MODULE_LIST.AUTH,
  defaultData: {
    lv: 0,
    expiration: null,
  },
  needSave: false,
})
const authModuleData = computed(() => {
  return authModule.value.data
})

provide(EN_MODULE_LIST.AUTH, authModuleData)

const useAuthLevel = (level: number | string) => {
  const hasAuth = computed(() => {
    return !level || authModuleData.value.lv >= Number(level) || settings.value.v >= 1
  })
  return hasAuth
}
provide('useAuthLevel', useAuthLevel)

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

const unmarkAll = () => {
  wsInited.value = false
  settingsLoaded.value = false
  moduleDataLoaded.value = false
}

const autoLoadModuledata = async () => {
  const namespaces = Object.keys(syncDataRefMap)
  const needLoadNamespaces = namespaces.filter((namespace) => {
    const module = syncDataRefMap[namespace]
    return module.autoLoad && !module.loaded && module.needSave
  })
  enLog('needLoadNamespaces', needLoadNamespaces)
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
  loadSettings().then(() => {
    settingsLoaded.value = true
  })
  autoLoadModuledata()
})
onBeforeUnmount(() => {
  closeWebsocket()
  unmarkAll()
})

</script>

<style lang="scss" scoped>

</style>
