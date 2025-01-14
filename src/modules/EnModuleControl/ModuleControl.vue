<template>
  <ModuleDataProvider v-if="moduleEnabled">
    <template
      #default="{
        isVip,
        isNotFree,
      }"
    >
      <ArcoTheme />
      <EnSettings />
      <EnSiyuanEntry />
      <EnBackgroundImg v-if="isVip" />
      <!-- <DailyNote /> -->
      <!-- <EnEditor /> -->
      <EnOthers />

      <EnModuleLifeLog />
      <!-- <EnVideoAndAudio v-if="isNotFree" /> -->
      <EnFormatBrush v-if="isNotFree" />
      <EnFont />
      <!-- <TemplateEntry /> -->
      <!-- <EnComment v-if="isNotFree && !isInEnWindow" /> -->
      <!-- <EnModuleWhiteBoard /> -->

      <!-- 仅移动端 -->
      <template v-if="plugin.isMobile">
        <!-- <EnPWA /> -->
        <!-- <EnMobileNav /> -->

      </template>

      <!-- 仅桌面端 -->
      <template v-else>
      </template>
    </template>
  </ModuleDataProvider>
</template>

<script setup lang="ts">
import { usePlugin } from '@/main'
import ArcoTheme from '@/modules/ArcoTheme.vue'
import EnBackgroundImg from '@/modules/Background/EnBackgroundImg.vue'
import EnFont from '@/modules/Editor/EnFontStyle/EnFont.vue'
import EnFormatBrush from '@/modules/EnFormatBrush/EnFormatBrush.vue'
import ModuleDataProvider from '@/modules/EnModuleControl/ModuleDataProvider.vue'
import EnOthers from '@/modules/EnOthers.vue'
import EnSiyuanEntry from '@/modules/EnSiyuanEntry.vue'
import EnModuleLifeLog from '@/modules/LifeLog/EnModuleLifeLog.vue'
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
