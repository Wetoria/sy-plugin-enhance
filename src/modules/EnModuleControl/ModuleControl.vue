<template>
  <ModuleDataProvide v-if="globalLoaded">
    <!-- 全平台 -->
    <!-- 这里的顺序，决定了设置中的模块显示顺序 -->
    <EnSiyuanEntry />
    <EnSettings />
    <DailyNote />
    <EnEditor />
    <EnBackgroundImg v-if="isVip" />
    <EnOthers />

    <LifeLog />
    <EnVideoAndAudio v-if="isNotFree" />
    <EnFormatBrush v-if="isNotFree" />
    <EnFont />
    <TemplateEntry />

    <!-- 仅移动端 -->
    <template v-if="plugin.isMobile">
      <EnPWA />
      <EnMobileNav />

    </template>

    <!-- 仅桌面端 -->
    <template v-else>
      <EnComment v-if="isNotFree && !isInEnWindow" />
    </template>
  </ModuleDataProvide>
</template>

<script lang="ts">
import { usePlugin } from '@/main'

import EnBackgroundImg from '@/modules/Background/EnBackgroundImg.vue'
import DailyNote from '@/modules/DailyNote/DailyNote.vue'
import EnComment from '@/modules/Editor/Comment/EnComment.vue'
import EnEditor from '@/modules/Editor/EnEditor.vue'
import EnFont from '@/modules/Editor/EnFont.vue'
import EnFormatBrush from '@/modules/EnFormatBrush/EnFormatBrush.vue'
import EnMobileNav from '@/modules/EnMobileNav.vue'
import ModuleDataProvide from '@/modules/EnModuleControl/ModuleDataProvide.vue'
import EnOthers from '@/modules/EnOthers.vue'
import EnPWA from '@/modules/EnPWA.vue'
import EnSiyuanEntry from '@/modules/EnSiyuanEntry.vue'
import { isInWindow } from '@/modules/EnWindow.vue'
import LifeLog from '@/modules/LifeLog/EnModuleLifeLog.vue'
import EnSettings, {
  EnModule,
  isNotFree,
  isVip,
  loadSettings,
} from '@/modules/Settings/EnSettings.vue'
import TemplateEntry from '@/modules/Templates/TemplateEntry.vue'
import EnVideoAndAudio from '@/modules/VideoAndAudio/EnVideoAndAudio.vue'
import {
  EN_CONSTANTS,
  EN_MODULE_LIST,
} from '@/utils/Constants'

import {
  EnSyncModuleDataRef,
  getModuleRefByNamespace,
  initWebsocket,
} from '@/utils/SyncData'
import { useSettingModuleInSetup } from '@/utils/SyncDataHooks'
import {
  computed,
  ComputedRef,
  inject,
  onMounted,
  provide,
  ref,
} from 'vue'

export function useModule<T extends EnModule>(moduleName: EN_MODULE_LIST, moduleOptions?: T): {
  module: EnSyncModuleDataRef<T>
  moduleOptions: ComputedRef<T>
} {
  const isLoadModule = !moduleOptions
  // 如果没有默认值，视为加载模块
  if (isLoadModule) {
    const moduleRef: EnSyncModuleDataRef<T> = inject(moduleName)
      || inject(EN_CONSTANTS.MODULE_PROVIDER_KEY)
      || getModuleRefByNamespace<T>(moduleName)

    // 这个时候，如果模块不存在，需要抛出错误
    if (!moduleRef) {
      throw new ReferenceError(`Module ${moduleName} was not found.`)
    }

    return {
      module: moduleRef,
      // 适配用 provide 提供的 module
      // 可能会出现 moduleRef.value 为 undefined 的情况
      moduleOptions: computed(() => moduleRef.value?.data),
    }
  }

  const moduleRes = useSettingModuleInSetup<T>(moduleOptions)

  provide(moduleName, moduleRes)
  provide(EN_CONSTANTS.MODULE_PROVIDER_KEY, moduleRes)

  return moduleRes
}

</script>


<script setup lang="ts">

const wsInited = ref(false)
const settingsLoaded = ref(false)
const globalLoaded = computed(() => {
  return wsInited.value && settingsLoaded.value
})

onMounted(() => {
  initWebsocket().then(() => {
    wsInited.value = true
  })
  loadSettings().then(() => {
    settingsLoaded.value = true
  })
})

const plugin = usePlugin()

const isInEnWindow = ref(isInWindow('QuickNote') || isInWindow('EnVideoAndAudio'))
</script>

<style lang="scss" scoped>

</style>
