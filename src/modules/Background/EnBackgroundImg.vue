<template>
  <Teleport to="html">
    <div class="enBackground"></div>
  </Teleport>
  <!-- <EnSettingsTeleport
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
  </EnSettingsTeleport> -->
</template>

<script setup lang="ts">
import { useModule } from '@/logic/Settings';
import EnSettingsTeleport from '../Settings/EnSettingsTeleport.vue';
import { computed, watch } from 'vue';

// interface ModuleOptions {
//   enableBackgroundImg: boolean
// }

// const moduleName = 'EnBackgroundImg'
// const moduleDisplayName = '背景图'
// const defaultOptions = {
//   enableBackgroundImg: false,
// }
// const module = useModule(moduleName, defaultOptions)

// watch(() => module, () => {
//   console.log('module is ', module.value)
// })
// const moduleOptions = computed(() => {
//   console.log('module is ', module.value)
//   return module.value.options as ModuleOptions
// })

// watch(() => moduleOptions.value.enableBackgroundImg, () => {
//   document.documentElement.dataset.enBackground = `${moduleOptions.value.enableBackgroundImg}`
// })
</script>

<style lang="scss">
html[data-en-background="true"] {
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
    opacity: 0.9;
  }
}
</style>
