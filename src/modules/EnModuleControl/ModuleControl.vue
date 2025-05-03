<template>
  <EnIcons />
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


      <!-- 复杂模块 -->
      <EnModuleDailyNote />

      <EnModuleQuickNote />
      <!-- TODO -->
      <EnModuleBottomBacklink />
      <EnModuleLifeLog />
      <EnParagraphBlock />


      <!-- IMP 内部逻辑需要重写一下，现在这样比较乱 -->
      <EnModuleVideoAndAudio />
      <!-- TODO 需要重写相关逻辑 -->
      <EnModuleComment />
      <!-- TODO -->
      <EnModuleWhiteBoard />

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
import EnIcons from '@/modules/EnModuleControl/EnIcons.vue'
import ModuleDataProvider from '@/modules/EnModuleControl/ModuleDataProvider.vue'
import EnOthers from '@/modules/EnOthers.vue'
import EnPWA from '@/modules/EnPWA.vue'
import EnSiyuanEntry from '@/modules/EnSiyuanEntry.vue'
import EnModuleWhiteBoard from '@/modules/EnWhiteBoard/EnModuleWhiteBoard.vue'
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
