<template>
  <template v-if="globalLoaded">
    <slot />
  </template>
</template>

<script lang="ts">
import {
  loadSettings,
} from '@/modules/Settings/EnSettings.vue'
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

  ref,
  watchEffect,
} from 'vue'

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
