<template>
  <Teleport to="html" v-if="module.enabled">
    <div class="enPWAContainer" id="enPWAContainer">
      <div
        class="enPWAPadding1"
      ></div>
      <div
        class="enPWAMain"
      ></div>
      <div
        class="enPWAPadding2"
      ></div>
    </div>
  </Teleport>
  <EnSettingsTeleport
    :name="moduleName"
    :display="moduleDisplayName"
    :module="module"
    :disableAutoSwitchEnable="true"
  >
    <EnSettingsItem mode="vertical">
      <div>
        顶部状态栏高度
      </div>
      <template #opt>
        <a-input-number
          class="input-demo"
          placeholder="Please Enter"
          mode="button"
          read-only
          v-model="moduleOptions.statusBarHeight"
        />
      </template>
    </EnSettingsItem>
    <EnSettingsItem mode="vertical">
      <div>
        底部工具栏高度
      </div>
      <template #opt>
        <a-input-number
          class="input-demo"
          placeholder="Please Enter"
          mode="button"
          read-only
          v-model="moduleOptions.toolBarHeight"
        />
      </template>
    </EnSettingsItem>
  </EnSettingsTeleport>
</template>

<script setup lang="ts">
import { useModule } from '@/logic/Settings';
import { useEnhancer } from '@/modules/GlobalStatus';
import { computed, onMounted, watchEffect } from 'vue';
import EnSettingsTeleport from './Settings/EnSettingsTeleport.vue';
import EnSettingsItem from './Settings/EnSettingsItem.vue';

const EnhancerState = useEnhancer()

interface ModuleOptions {
  statusBarHeight: number;
  toolBarHeight: number;
}

const moduleName = 'EnPWA'
const moduleDisplayName = '移动端 PWA 适配'
const defaultOptions: ModuleOptions = {
  statusBarHeight: 56,
  toolBarHeight: 30,
}
const module = useModule(moduleName, defaultOptions)
const moduleOptions = computed(() => module.value.options as ModuleOptions)

watchEffect(() => {
  const root = document.documentElement;
  root.style.setProperty('--en-status-height', moduleOptions.value.statusBarHeight + 'px')
  root.style.setProperty('--en-toolbar-height', moduleOptions.value.toolBarHeight + 'px')
})

watchEffect(() => {
  document.documentElement.dataset.enPwa = `${module.value.enabled}`
})

onMounted(() => {
  const metaDom = document.createElement('meta')
  metaDom.name = "apple-mobile-web-app-status-bar-style"
  metaDom.content = "black-translucent"
  metaDom.dataset.enPwa = 'true'
  metaDom.id = 'enPwaMeta'

  const headDom = document.documentElement.querySelector('head')
  if (headDom) {
    headDom.appendChild(metaDom)
  }

  // @ts-ignore
  const isStandalone = window.navigator.standalone
  EnhancerState.value.isStandalone = isStandalone
  if (isStandalone) {
    document.documentElement.dataset.enIsStandalone = isStandalone
  }
  document.documentElement.dataset.enOrientation = window.screen.orientation.type
  window.screen.orientation.addEventListener('change', (event) => {
    document.documentElement.dataset.enOrientation = (event.target as ScreenOrientation).type
  })
})
</script>

<style lang="scss">
:root {
  --en-status-height: 56px;
  --en-toolbar-height: 30px;
}

html[data-en-is-standalone="true"][data-en-pwa="true"] {
  height: 100vh;
  // box-sizing: border-box;
  // overflow: hidden;
  // touch-action: pan-y;
  overscroll-behavior: none;

  .enPWAContainer {
    width: 100%;
    height: 100vh;
    position: absolute;
    z-index: -10000;
    top: 0;
    left: 0;
    pointer-events: none;
    display: flex;
  }

  // 正常竖屏
  &[data-en-orientation="portrait-primary"] {

    body {
      #menu,
      .b3-dialog__container {
        padding-top: var(--en-status-height);
      }
    }
    .enPWAPadding1 {
      width: 100%;
      height: var(--en-status-height);
      background-color: var(--b3-theme-background);
      opacity: var(--en-opacity);
    }
  }

  // 左横屏
  &[data-en-orientation="landscape-primary"] {
    body {
      padding-left: var(--en-status-height);
      padding-right: var(--en-toolbar-height);
    }

    .enSettingDrawer {
      .arco-drawer {
        box-sizing: border-box;
        padding-left: var(--en-status-height);
        padding-right: var(--en-toolbar-height);
      }
    }

    .enPWAPadding1 {
      width: var(--en-status-height);
      height: 100%;
      background-color: var(--b3-theme-background);
      opacity: var(--en-opacity);
    }
    .enPWAMain {
      flex: 1;
    }
    .enPWAPadding2 {
      width: var(--en-toolbar-height);
      height: 100%;
      background-color: var(--b3-theme-background);
      opacity: var(--en-opacity);
    }

    #menu,
    .b3-menu,
    .b3-dialog__container {
      box-sizing: border-box;
      padding: 0px 30px 8px 56px;
    }
  }

  // 右横屏
  &[data-en-orientation="landscape-secondary"] {
    body {
      padding-right: var(--en-status-height);
      padding-left: var(--en-toolbar-height);
    }

    .enSettingDrawer {
      .arco-drawer {
        box-sizing: border-box;
        padding-right: var(--en-status-height);
        padding-left: var(--en-toolbar-height);
      }
    }

    .enPWAPadding2 {
      width: var(--en-status-height);
      height: 100%;
      background-color: var(--b3-theme-background);
      opacity: var(--en-opacity);
    }
    .enPWAMain {
      flex: 1;
    }
    .enPWAPadding1 {
      width: var(--en-toolbar-height);
      height: 100%;
      background-color: var(--b3-theme-background);
      opacity: var(--en-opacity);
    }

    #menu,
    .b3-menu,
    .b3-dialog__container {
      box-sizing: border-box;
      padding: 0px 56px 8px 30px;
    }
  }
}

@media screen and (orientation: portrait) {
  html[data-en-is-standalone="true"] {
    padding-top: var(--en-status-height);
  }
}

@media screen and (orientation: landscape) {
  .side-panel {
    width: calc(100vw - 86px);
  }
}
</style>
