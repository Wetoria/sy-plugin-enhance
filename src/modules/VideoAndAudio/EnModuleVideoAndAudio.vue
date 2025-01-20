<template>

  <EnSettingsTeleportModule
    :name="moduleOptions.moduleName"
    :display="moduleOptions.moduleDisplayName"
    :module="module"
    :authLevel="1"
  >
    <div>
      本地音视频功能{{ hasAuth ? '已开启' : '未开启' }}
    </div>
  </EnSettingsTeleportModule>
  <EnVideoAndAudio v-if="moduleOptions.enabled" />
</template>

<script setup lang="ts">
import {
  injectAuthStatus,
  useModule,
} from '@/modules/EnModuleControl/ModuleProvide'
import EnSettingsTeleportModule from '@/modules/Settings/EnSettingsTeleportModule.vue'
import EnVideoAndAudio from '@/modules/VideoAndAudio/EnVideoAndAudio.vue'
import {
  EN_CONSTANTS,
  EN_MODULE_LIST,
} from '@/utils/Constants'
import { watch } from 'vue'

const {
  module,
  moduleOptions,
} = useModule<{} & EnModule>(EN_MODULE_LIST.EN_VIDEO_AND_AUDIO, {
  defaultData: {
    enabled: false,
    moduleName: EN_MODULE_LIST.EN_VIDEO_AND_AUDIO,
    moduleDisplayName: EN_CONSTANTS.EN_VIDEO_AND_AUDIO_DISPLAY,
  },
  needSave: false,
})

const { computedLevel } = injectAuthStatus()
const hasAuth = computedLevel(1)
// 有权限时，自动开启格式刷功能
watch(hasAuth, () => {
  if (hasAuth.value) {
    moduleOptions.value.enabled = true
  }
})
</script>

<style lang="scss" scoped>

</style>
