<template>

  <EnSettingsTeleportModule
    :name="moduleOptions.moduleName"
    :display="moduleOptions.moduleDisplayName"
    :module="module"
    noAuthMask
  >
    <div>
      本地音视频功能{{ moduleOptions.enabled ? '已开启' : '未开启' }}。{{ !hasAuth ? '(Lv1 可启用)' : '' }}
    </div>
    <EnSettingsItem mode="vertical">
      <div>
        跳转模式
      </div>
      <template #desc>
        <div>
          选择时间戳跳转模式。
        </div>
        <div>
          · 跳转至文档：用思源自带的方式，打开文档中的视频所在位置。
        </div>
        <div>
          · 弹窗打开：在思源窗口内，以弹窗的方式打开。
        </div>
        <!-- <div>
          · 用新窗口打开：用新窗口打开。（仅桌面版生效，网页和手机端将会弹窗打开）
        </div> -->
      </template>
      <template #opt>
        <div class="EnVideoAndAudioJumpModeSelector">
          <a-select
            v-model="moduleOptions.jumpMode"
            placeholder="选择跳转模式"
          >
            <a-option
              v-for="mode of jumpModeOptions"
              :key="mode.value"
              :value="mode.value"
              :label="mode.label"
              :disabled="mode.value !== 'toDoc' && !hasAuth"
              title="test"
            >
            </a-option>
          </a-select>
        </div>
      </template>
    </EnSettingsItem>
  </EnSettingsTeleportModule>
  <EnVideoAndAudio v-if="moduleOptions.enabled" />
  <EnVideoAndAudioJumper />
</template>

<script setup lang="ts">
import {
  injectAuthStatus,
  useModule,
} from '@/modules/EnModuleControl/ModuleProvide'
import EnSettingsItem from '@/modules/Settings/EnSettingsItem.vue'
import EnSettingsTeleportModule from '@/modules/Settings/EnSettingsTeleportModule.vue'
import EnVideoAndAudio from '@/modules/VideoAndAudio/EnVideoAndAudio.vue'
import EnVideoAndAudioJumper from '@/modules/VideoAndAudio/EnVideoAndAudioJumper.vue'
import {
  EN_CONSTANTS,
  EN_MODULE_LIST,
} from '@/utils/Constants'
import {
  computed,
  watch,
} from 'vue'

const {
  module,
  moduleOptions,
} = useModule<EnModuleVideoAndAudio>(EN_MODULE_LIST.EN_VIDEO_AND_AUDIO, {
  defaultData: {
    enabled: false,
    moduleName: EN_MODULE_LIST.EN_VIDEO_AND_AUDIO,
    moduleDisplayName: EN_CONSTANTS.EN_VIDEO_AND_AUDIO_DISPLAY,

    jumpMode: 'toDoc',
  },
})

const { computedLevel } = injectAuthStatus()
const hasAuth = computedLevel(1)
watch(hasAuth, () => {
  if (hasAuth.value) {
    moduleOptions.value.enabled = true
  } else {
    moduleOptions.value.enabled = false
  }
})


const jumpModeOptions = computed(() => (
  [
    {
      value: 'toDoc',
      label: '跳转至文档',
    },
    {
      value: 'openModal',
      // label: `${!hasAuth.value ? 'Lv1 可选：' : ''}软件内弹窗打开`,
      label: `${!hasAuth.value ? 'Lv1 可选：' : ''}弹窗打开`,
    },
    // {
    //   value: 'openWindow',
    //   label: `${!hasAuth.value ? 'Lv1 可选：' : ''}用新窗口打开`,
    // },
  ]
))
</script>

<style lang="scss" scoped>
.EnVideoAndAudioJumpModeSelector {
  min-width: 134px;
}
</style>
