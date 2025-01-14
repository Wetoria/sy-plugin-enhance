<template>
  <ModuleDataProvider v-if="moduleEnabled">
    <template #default="{ isVip }">
    <ArcoTheme />
    <EnSettings />
    <EnSiyuanEntry />
  </ModuleDataProvider>
</template>

<script setup lang="ts">
import { usePlugin } from '@/main'
import ArcoTheme from '@/modules/ArcoTheme.vue'
import ModuleDataProvider from '@/modules/EnModuleControl/ModuleDataProvider.vue'
import EnSiyuanEntry from '@/modules/EnSiyuanEntry.vue'
import EnSettings from '@/modules/Settings/EnSettings.vue'
import { moduleEnableStatusSwitcher } from '@/utils'
import {
  addCommand,
  removeCommand,
} from '@/utils/Commands'
import {
  EN_COMMAND_KEYS,
  EN_CONSTANTS,
} from '@/utils/Constants'
import {
  onBeforeUnmount,
  onMounted,
  ref,
  watchEffect,
} from 'vue'

const moduleEnabled = ref(true)
const enableCommand = {
    langKey: EN_COMMAND_KEYS.EN_PLUGIN_SWITCH,
    langText: EN_CONSTANTS.EN_PLUGIN_SWITCH_DISPLAY,
    hotkey: "",
    callback: () => {
      moduleEnabled.value = !moduleEnabled.value
    },
}
onMounted(() => {
  addCommand(enableCommand)
  })
onBeforeUnmount(() => {
  removeCommand(enableCommand)
})

const plugin = usePlugin()
plugin.addIcons(`
  <symbol id="iconEnLeaf" viewBox="0 0 24 24">
    <path d="M9.356 11.563c4.53 -3.254 9.047 -5.217 13.547 -5.723L24 2.978c-6.662 0 -7.57 1.457 -9.873 3.752M0 21.021c14.719 0 18.189 -3.46 20.213 -8.17l1.7 -4.434c-4.958 0.143 -12.441 3.066 -17.673 8.324" stroke-width="1"></path>
  </symbol>
`)

watchEffect(() => {
  moduleEnableStatusSwitcher('En_Plugin_Enabled', moduleEnabled.value)
})
</script>

<style lang="scss">

</style>
