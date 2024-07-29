<template>
  <Teleport
    to="html"
    v-if="moduleOptions.enableBackgroundImg"
  >
    <div class="enBackground"></div>
  </Teleport>
  <EnSettingsTeleportModule
    :name="moduleName"
    :display="moduleDisplayName"
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
          class="input-demo"
          placeholder="Please Enter"
          mode="button"
          :readOnly="plugin.isMobile"
          :precision="2"
          :step="0.01"
          :max="1"
          :min="0.1"
          v-model="moduleOptions.opacity"
        />
      </template>
    </EnSettingsItem>
  </EnSettingsTeleportModule>
</template>

<script setup lang="ts">
import EnSettingsTeleportModule from '../Settings/EnSettingsTeleportModule.vue';
import { computed, watch, watchEffect } from 'vue';
import EnSettingsItem from '../Settings/EnSettingsItem.vue';
import { usePlugin } from '@/main';
import { useModule } from '../Settings/EnSettings.vue';
import { moduleEnableStatusSwitcher } from '@/utils';

const plugin = usePlugin()

interface ModuleOptions {
  enableBackgroundImg: boolean
  opacity: number
}

const moduleName = 'EnBackgroundImg'
const moduleDisplayName = '背景图'
const defaultOptions = {
  enableBackgroundImg: false,
  opacity: 0.9
}
const module = useModule(moduleName, defaultOptions)
const moduleOptions = computed(() => {
  return module.value.options as ModuleOptions
})

watchEffect(() => {
  moduleEnableStatusSwitcher('EnBackgroundImg', moduleOptions.value.enableBackgroundImg)
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
    height: 100vh;
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
}
</style>
