<template>
  <ModuleDataProvider v-if="moduleEnabled">
    <template
      #default="{
        isVip,
      }"
    >
      <ArcoTheme />
      <EnSettings />
      <!-- 简单模块 -->
      <EnSiyuanEntry />
      <EnBackgroundImg v-if="isVip" />
      <EnOthers />
      <EnFormatBrush />
      <EnFont />


      <TemplateEntry />
      <EnModuleLifeLog />

      <EnParagraphBlock />

      <!-- 复杂模块 -->
      <EnModuleDailyNote />
      <EnModuleQuickNote />
      <EnModuleBottomBacklink />
      <!-- TODO -->
      <!-- <EnEditor /> -->


      <!-- TODO -->
      <EnModuleVideoAndAudio />
      <EnModuleComment />
      <!-- TODO -->
      <!-- <EnModuleWhiteBoard /> -->

      <!-- 仅移动端 -->
      <template v-if="plugin.isMobile">
        <EnPWA />
        <EnMobileNav />

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
import EnModuleBottomBacklink from '@/modules/BottomBacklink/EnModuleBottomBacklink.vue'
import EnModuleComment from '@/modules/Comment/EnModuleComment.vue'
import EnModuleDailyNote from '@/modules/DailyNote/EnModuleDailyNote.vue'
import EnFont from '@/modules/EnFontStyle/EnFont.vue'
import EnFormatBrush from '@/modules/EnFormatBrush/EnFormatBrush.vue'
import EnMobileNav from '@/modules/EnMobileNav.vue'
import ModuleDataProvider from '@/modules/EnModuleControl/ModuleDataProvider.vue'
import EnOthers from '@/modules/EnOthers.vue'
import EnPWA from '@/modules/EnPWA.vue'
import EnSiyuanEntry from '@/modules/EnSiyuanEntry.vue'
import EnModuleLifeLog from '@/modules/LifeLog/EnModuleLifeLog.vue'
import EnParagraphBlock from '@/modules/ParagraphBlock/EnParagraphBlock.vue'
import EnModuleQuickNote from '@/modules/QuickNote/EnModuleQuickNote.vue'
import EnSettings from '@/modules/Settings/EnSettings.vue'
import TemplateEntry from '@/modules/Templates/TemplateEntry.vue'
import EnModuleVideoAndAudio from '@/modules/VideoAndAudio/EnModuleVideoAndAudio.vue'
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

// 控制模块开关
// 关闭时，应当几乎跟没开启插件一个效果
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

// #region 👇 全局 icon
plugin.addIcons(`
  <symbol id="iconEnLeaf" viewBox="0 0 24 24">
    <path d="M9.356 11.563c4.53 -3.254 9.047 -5.217 13.547 -5.723L24 2.978c-6.662 0 -7.57 1.457 -9.873 3.752M0 21.021c14.719 0 18.189 -3.46 20.213 -8.17l1.7 -4.434c-4.958 0.143 -12.441 3.066 -17.673 8.324" stroke-width="1"></path>
  </symbol>
`)
// #endregion 👆 全局 icon

// #region 全局状态控制

// 是否是移动端
watchEffect(() => {
  moduleEnableStatusSwitcher('EnhancerIsMobile', plugin.isMobile)
})

// 插件是否开启
watchEffect(() => {
  moduleEnableStatusSwitcher('En_Plugin_Enabled', moduleEnabled.value)
})

// #endregion 全局状态控制
</script>

<style lang="scss">

</style>
