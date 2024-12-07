<template>
  <Teleport
    v-if="moduleOptions.enableBackgroundImg"
    to="html"
  >
    <div class="enBackground"></div>
  </Teleport>
  <EnSettingsTeleportModule
    :name="moduleOptions.moduleName"
    :display="moduleOptions.moduleDisplayName"
    :module="module"
  >
    <EnSettingsItem>
      <div>
        启用背景图
      </div>
      <template #opt>
        <a-switch v-model="moduleOptions.enableBackgroundImg" />
      </template>
    </EnSettingsItem>
    <EnSettingsItem mode="vertical">
      <div>
        背景透明度
      </div>
      <template #opt>
        <a-input-number
          v-model="moduleOptions.opacity"
          class="input-demo"
          placeholder="Please Enter"
          mode="button"
          :readOnly="plugin.isMobile"
          :precision="2"
          :step="0.01"
          :max="1"
          :min="0.1"
        />
      </template>
    </EnSettingsItem>
  </EnSettingsTeleportModule>
</template>

<script setup lang="ts">
import { usePlugin } from '@/main'
import { useModule } from '@/modules/EnModuleControl/ModuleDataProvide.vue'
import {
  EnModule,
} from '@/modules/Settings/EnSettings.vue'
import { moduleEnableStatusSwitcher } from '@/utils'
import { EN_MODULE_LIST } from '@/utils/Constants'
import { watchEffect } from 'vue'
import EnSettingsItem from '../Settings/EnSettingsItem.vue'
import EnSettingsTeleportModule from '../Settings/EnSettingsTeleportModule.vue'

const plugin = usePlugin()

const {
  module,
  moduleOptions,
} = useModule<{
  enableBackgroundImg: boolean
  opacity: number
} & EnModule>(EN_MODULE_LIST.BACKGROUND_IMG, {
  defaultData: {
    enabled: true,
    moduleName: EN_MODULE_LIST.BACKGROUND_IMG,
    moduleDisplayName: EN_MODULE_LIST.BACKGROUND_IMG,

    enableBackgroundImg: false,
    opacity: 0.9,
  },
})

watchEffect(() => {
  moduleEnableStatusSwitcher(
    EN_MODULE_LIST.BACKGROUND_IMG,
    moduleOptions.value.enableBackgroundImg,
  )
  document.documentElement.style.setProperty('--en-opacity', `${moduleOptions.value.opacity}`)
})
</script>

<style lang="scss">
html[data-en_enabled_module~="EnBackgroundImg"] {
  .enBackground {
    background-repeat: no-repeat;
    background-attachment: fixed;
    background-size: cover;
    background-position: center center;
    width: 100%;
    height: 100dvh;
    position: absolute;
    z-index: -10000;
    top: 0;
    left: 0;
    pointer-events: none;
    background-image: url('./bg.png');
    display: flex;
  }
  body {
    opacity: var(--en-opacity);
  }

  &[data-en-is-standalone="true"] {
    .enBackground {
      height: 100vh;
    }
  }
}
</style>
