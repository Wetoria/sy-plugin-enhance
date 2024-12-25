<template>
  <!-- 只用来控制模块的导入 -->
  <!-- 数据加载在 ModuleDataProvider 中 -->
  <ModuleDataProvider>
    <!-- 全平台 -->
    <!-- 这里的顺序，决定了设置中的模块显示顺序 -->
    <EnSettings />
    <EnSiyuanEntry />
    <DailyNote />
    <EnEditor />
    <EnBackgroundImg v-if="isVip" />
    <EnOthers />

    <LifeLog />
    <EnVideoAndAudio v-if="isNotFree" />
    <EnFormatBrush v-if="isNotFree" />
    <EnFont />
    <TemplateEntry />
    <EnComment v-if="isNotFree && !isInEnWindow" />
    <EnModuleWhiteBoard />

    <!-- 仅移动端 -->
    <template v-if="plugin.isMobile">
      <EnPWA />
      <EnMobileNav />

    </template>

    <!-- 仅桌面端 -->
    <template v-else>
    </template>
  </ModuleDataProvider>
</template>

<script setup lang="ts">
import { usePlugin } from '@/main'

import EnBackgroundImg from '@/modules/Background/EnBackgroundImg.vue'
import DailyNote from '@/modules/DailyNote/DailyNote.vue'
import EnComment from '@/modules/Editor/Comment/EnCommentModule.vue'
import EnEditor from '@/modules/Editor/EnEditor.vue'
import EnFont from '@/modules/Editor/EnFont.vue'
import EnFormatBrush from '@/modules/EnFormatBrush/EnFormatBrush.vue'
import EnMobileNav from '@/modules/EnMobileNav.vue'
import ModuleDataProvider from '@/modules/EnModuleControl/ModuleDataProvider.vue'
import EnOthers from '@/modules/EnOthers.vue'
import EnPWA from '@/modules/EnPWA.vue'
import EnSiyuanEntry from '@/modules/EnSiyuanEntry.vue'
import EnModuleWhiteBoard from '@/modules/EnWhiteBoard/EnModuleWhiteBoard.vue'
import { isInWindow } from '@/modules/EnWindow.vue'
import LifeLog from '@/modules/LifeLog/EnModuleLifeLog.vue'
import EnSettings, {
  isNotFree,
  isVip,
} from '@/modules/Settings/EnSettings.vue'
import TemplateEntry from '@/modules/Templates/TemplateEntry.vue'
import EnVideoAndAudio from '@/modules/VideoAndAudio/EnVideoAndAudio.vue'

import {
  ref,
} from 'vue'

const plugin = usePlugin()

const isInEnWindow = ref(isInWindow('QuickNote') || isInWindow('EnVideoAndAudio'))
</script>

<style lang="scss" scoped>

</style>
