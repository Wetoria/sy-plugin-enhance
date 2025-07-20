<template>
  <EnIcons />
  <ArcoTheme />
  <ModuleDataProvider v-if="moduleEnabled">
    <template
      #default="{
        isVip,
      }"
    >
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


      <EnPWA />

      <EnModulePublish v-if="plugin.isElectron && !plugin.isInWindow" />

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
import EnIcons from '@/modules/EnModuleControl/EnIcons.vue'
import ModuleDataProvider from '@/modules/EnModuleControl/ModuleDataProvider.vue'
import EnOthers from '@/modules/EnOthers.vue'
import EnPWA from '@/modules/EnPWA.vue'
import EnSiyuanEntry from '@/modules/EnSiyuanEntry.vue'
import EnModuleWhiteBoard from '@/modules/EnWhiteBoard/EnModuleWhiteBoard.vue'
import EnModuleLifeLog from '@/modules/LifeLog/EnModuleLifeLog.vue'
import EnParagraphBlock from '@/modules/ParagraphBlock/EnParagraphBlock.vue'
import EnModulePublish from '@/modules/Publish/EnModulePublish.vue'
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
  Notification,
} from '@arco-design/web-vue'
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
  langKey: EN_COMMAND_KEYS.EN_PLUGIN_SWITCH as string,
  langText: EN_CONSTANTS.EN_PLUGIN_SWITCH_DISPLAY as string,
  hotkey: "",
  callback: () => {
    moduleEnabled.value = !moduleEnabled.value
    Notification.info({
      title: `叶归`,
      content: `已${moduleEnabled.value ? '开启' : '关闭'}所有功能`,
      duration: 1000,
    })
  },
}
onMounted(() => {
  addCommand(enableCommand)
})
onBeforeUnmount(() => {
  removeCommand(enableCommand)
})


const refreshSiyuanCommand = {
  langKey: EN_COMMAND_KEYS.EN_PLUGIN_REFRESH_SIYUAN as string,
  langText: EN_CONSTANTS.EN_PLUGIN_REFRESH_SIYUAN_DISPLAY as string,
  hotkey: "⇧⌘R",
  callback: () => {
    window.location.reload()
  },
}

onMounted(() => {
  addCommand(refreshSiyuanCommand)
})
onBeforeUnmount(() => {
  removeCommand(refreshSiyuanCommand)
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
