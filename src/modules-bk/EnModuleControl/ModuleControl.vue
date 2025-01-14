<template>
  <!-- 只用来控制模块的导入 -->
  <!-- 数据加载在 ModuleDataProvider 中 -->
  <ModuleDataProvider v-if="moduleEnabled">
    <!-- 全平台 -->
    <!-- 这里的顺序，决定了设置中的模块显示顺序 -->
    <!-- <EnSettings /> -->
    <!-- <EnSiyuanEntry /> -->
    <!-- <DailyNote />
    <EnEditor />
    <EnBackgroundImg v-if="isVip" />
    <EnOthers />

    <LifeLog />
    <EnVideoAndAudio v-if="isNotFree" />
    <EnFormatBrush v-if="isNotFree" />
    <EnFont />
    <TemplateEntry />
    <EnComment v-if="isNotFree && !isInEnWindow" /> -->
    <!-- <EnModuleWhiteBoard /> -->

    <!-- 仅移动端 -->
    <template v-if="plugin.isMobile">
      <!-- <EnPWA /> -->
      <!-- <EnMobileNav /> -->

    </template>

    <!-- 仅桌面端 -->
    <template v-else>
    </template>
  </ModuleDataProvider>
</template>

<script setup lang="ts">
import { usePlugin } from '@/main'

import ModuleDataProvider from '@/modules/EnModuleControl/ModuleDataProvider.vue'
import { isInWindow } from '@/modules/EnWindow.vue'
import { addCommand } from '@/utils/Commands'
import {
  EN_COMMAND_KEYS,
  EN_CONSTANTS,
} from '@/utils/Constants'

import {
  onMounted,
  ref,
} from 'vue'

const plugin = usePlugin()

const isInEnWindow = ref(isInWindow('QuickNote') || isInWindow('EnVideoAndAudio'))

const moduleEnabled = ref(true)
onMounted(() => {
  addCommand({
    langKey: EN_COMMAND_KEYS.EN_PLUGIN_SWITCH,
    langText: EN_CONSTANTS.EN_PLUGIN_SWITCH_DISPLAY,
    hotkey: "",
    callback: () => {
      moduleEnabled.value = !moduleEnabled.value
    },
  })
})
</script>

<style lang="scss" scoped>

</style>
