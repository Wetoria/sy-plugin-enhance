<template>
  <Teleport
    v-if="plugin.isMobile && globalWindowData.isStandalone && moduleOptions.enabled"
    to="html"
    disabled
  >
    <div
      id="enPWAContainer"
      class="enPWAContainer"
    >
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
  <EnSettingsTeleportModule
    :name="EN_MODULE_LIST.PWA"
    :display="EN_CONSTANTS.PWA_DISPLAY"
    :module="module"
    manual
  >
    <EnSettingsItem mode="vertical">
      <div>
        顶部状态栏高度
      </div>
      <template #opt>
        <a-input-number
          v-model="moduleOptions.statusBarHeight"
          class="input-demo"
          placeholder="Please Enter"
          mode="button"
          :readOnly="plugin.isMobile"
        />
      </template>
    </EnSettingsItem>
    <EnSettingsItem mode="vertical">
      <div>
        底部工具栏高度
      </div>
      <template #opt>
        <a-input-number
          v-model="moduleOptions.toolBarHeight"
          class="input-demo"
          placeholder="Please Enter"
          mode="button"
          :readOnly="plugin.isMobile"
        />
      </template>
    </EnSettingsItem>
    <EnSettingsItem>
      <div>
        启用思源工具栏适配
      </div>
      <template #desc>
        <div>
          启用后，可解决一些情况下思源移动端底部工具栏不出现的问题。
        </div>
        <div>
          但也会在一些情况下，造成工具栏 + 菜单不能正常使用。
        </div>
      </template>
      <template #opt>
        <a-switch v-model="moduleOptions.enableSyToolbarFit" />
      </template>
    </EnSettingsItem>
  </EnSettingsTeleportModule>
</template>

<script setup lang="ts">
import { onViewportChange } from '@/logic/Viewport'
import { usePlugin } from '@/main'
import {
  injectGlobalWindowData,
  useModule,
  watchConfigEnableStatus,
} from '@/modules/EnModuleControl/ModuleProvide'
import EnSettingsItem from '@/modules/Settings/EnSettingsItem.vue'
import EnSettingsTeleportModule from '@/modules/Settings/EnSettingsTeleportModule.vue'
import {
  EN_CONSTANTS,
  EN_MODULE_LIST,
} from '@/utils/Constants'
import {
  onMounted,
  watchEffect,
} from 'vue'

const plugin = usePlugin()

const globalWindowData = injectGlobalWindowData()

// #region 基本的模块配置

interface ISettingModuleOptions extends EnModule {
  statusBarHeight: number
  toolBarHeight: number

  enableSyToolbarFit: boolean
}

const {
  module,
  moduleOptions,
} = useModule<ISettingModuleOptions>(EN_MODULE_LIST.PWA, {
  defaultData: {
    enabled: false,
    moduleName: EN_MODULE_LIST.PWA,
    moduleDisplayName: EN_CONSTANTS.PWA_DISPLAY,

    statusBarHeight: 56,
    toolBarHeight: 30,

    enableSyToolbarFit: false,
  },
})
// #endregion 基本的模块配置

watchEffect(() => {
  const root = document.documentElement
  root.style.setProperty(
    '--en-status-height',
    `${moduleOptions.value.statusBarHeight}px`,
  )
  root.style.setProperty(
    '--en-toolbar-height',
    `${moduleOptions.value.toolBarHeight}px`,
  )
})

watchEffect(() => {
  document.documentElement.dataset.enPwa = `${module.value.data.enabled}`
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

  // @ts-expect-error standalone
  const isStandalone = window.navigator.standalone
  globalWindowData.value.isStandalone = isStandalone
  if (isStandalone) {
    document.documentElement.dataset.enIsStandalone = isStandalone
  }
  document.documentElement.dataset.enOrientation = window.screen.orientation.type
  window.screen.orientation.addEventListener('change', (event) => {
    document.documentElement.dataset.enOrientation = (event.target as ScreenOrientation).type
  })
})

const viewportChangeCallback = (newViewport) => {
  if (!plugin.isMobile) {
    return
  }
  if (newViewport.height != window.innerHeight) {
    // @ts-expect-error keyboardToolbar
    window.keyboardToolbar.style.top = `${newViewport.offsetTop + newViewport.height - 42}px`
  } else {
    // @ts-expect-error keyboardToolbar
    window.keyboardToolbar.style.top = 'unset'
  }
}

let unwatchViewportChange = null
watchConfigEnableStatus(
  () => moduleOptions.value.enableSyToolbarFit,
  () => {
    if (!plugin.isMobile) {
      return
    }
    unwatchViewportChange = onViewportChange(viewportChangeCallback)
    return () => {
      unwatchViewportChange?.()
    }
  },
)
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
    z-index: -9999;
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
