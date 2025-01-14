<template>

  <EnDrawer
    v-model:visible="settingsVisible"
    class="enSettingDrawer"
    footer
    :scrollTarget="enSettingsMainContentRef"
    @cancel="closeSettingsPanel"
  >
    <template #title>
      <div class="enSettingsTitle row flexCenter">
        <div
          class="SyEnhancerDialogTitle"
          @click="onTitleClicked"
        >
          {{ plugin.i18n.pluginName }}
        </div>
        <!-- <EnSettingsAuth /> -->
      </div>
    </template>

    <div
      class="enSettingsMain"
    >
      <div :class="`enSettingsModuleSelectorList ${!plugin.isMobile ? 'isNotMobile' : ''}`">
        <div
          v-for="(moduleInfo, index) of settingModulesList"
          :key="moduleInfo.moduleName"
          class="moduleSelectorItem"
          :class="[{
            moduleSelectorItem__Actived: index === currentModuleIndex,
          }]"
          :data-en-setting-module-index="index"
          @click="onSelectModule(index)"
        >
          {{ moduleInfo.moduleDisplayName }}
        </div>
      </div>
      <div
        ref="enSettingsMainContentRef"
        class="flexColumn enSettingsMainContent"
        @scroll="onSettingListScroll"
      >
        <div class="flexColumn en_settings_list">
          <template
            v-for="(refItem, index) of settingRefKeysSorted"
            :key="refItem"
          >
            <div
              :ref="(el) => settingsRefMap[refItem] = el"
              :data-en-setting-ref-module-name="refItem"
            >
            </div>
            <EnDivider v-if="index != settingRefKeysSorted.length - 1" />
          </template>
          <a-button
            size="mini"
            status="danger"
            @click="resetAllModule"
          >
            重置所有配置
          </a-button>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="enSettingsFooter">
        <span>
          <span>作者：</span>
          <a href="https://wetoria.me">Wetoria</a>
        </span>
        <span>
          使用说明：
          <a href="https://simplest-frontend.feishu.cn/docx/B3NndXHi7oLLXJxnxQmcczRsnse">{{ plugin.version ? `v${plugin.version}` : '' }}</a>
        </span>
      </div>
    </template>
  </EnDrawer>
</template>

<script setup lang="ts">
import EnDivider from '@/components/EnDivider.vue'
import EnDrawer from '@/components/EnDrawer.vue'
import { usePlugin } from '@/main'


import {
  closeSettingsPanel,
  enSettingsMainContentRef,
  settingsVisible,
  switchSettingsDisplay,
  useDebugSwitcher,
} from '@/modules/Settings/Settings'

import {
  currentModuleIndex,
  onSelectModule,
  onSettingListScroll,
  resetAllModule,
  settingModulesList,
  settingRefKeysSorted,
  settingsRefMap,
} from '@/modules/Settings/SettingsModuleControl'


import {
  addCommand,
  removeCommand,
} from '@/utils/Commands'
import {
  onBeforeUnmount,
  onMounted,
} from 'vue'

const plugin = usePlugin()


const command = {
  langKey: "En_OpenSettings",
  langText: "打开设置",
  hotkey: "",
  callback: () => {
    switchSettingsDisplay()
  },
}
onMounted(() => {
  addCommand(command)
})
onBeforeUnmount(() => {
  removeCommand(command)
})

const { onTitleClicked } = useDebugSwitcher()
</script>

<style lang="scss" scoped>
.SyEnhancerDialogTitle {
  font-weight: bold;
  font-size: 1.18em;
  color: rgb(var(--primary-6));
}
.en_settings_list {
  padding: 0 16px;
}

.enSettingsFooter {
  display: flex;
  align-items: center;
  gap: var(--en-gap);
}

.enSettingsMain {
  overflow: hidden;
  display: flex;
  flex-direction: column;
  max-height: 85vh;
}

.enSettingsModuleSelectorList {

  padding: 0px 10px;
  overflow-x: auto;
  background-color: var(--color-bg-3);

  display: flex;
  align-items: center;
  height: 34px; // 明确设置与子元素相同的高度
  flex-shrink: 0;

  &::-webkit-scrollbar {
    display: none; // Chrome, Safari, newer versions of Opera
  }

  .moduleSelectorItem {
    display: inline-block;
    box-sizing: border-box;
    padding: 4px 6px;
    font-size: 1.17em;
    cursor: pointer;
    font-weight: bold;
    position: relative;
    width: max-content;
    white-space: nowrap;
    background-color: var(--color-bg-3);
    height: 34px;

    &:first-child {
      scroll-margin-left: 16px;
    }

    &:last-child {
      scroll-margin-right: 16px;
    }

    &.moduleSelectorItem__Actived {
      color: rgb(var(--primary-6));

      &:after {
        content: '';
        display: block;
        position: absolute;
        bottom: 0;
        left: 0;
        width: 100%;
        height: 2px;
        border-radius: 2px;
        background-color: rgb(var(--primary-6));
      }

      &:hover {
        border-bottom-left-radius: unset;
        border-bottom-right-radius: unset;
      }
    }


  }

  &.isNotMobile {

    .moduleSelectorItem {

      &:hover {
        background-color: var(--color-fill-2);
        border-radius: var(--b3-border-radius);
      }
    }
  }
}

.enSettingsMainContent {
  overscroll-behavior: none;
  overflow: hidden;
  overflow-y: auto;
  padding-bottom: 32px;
}
</style>

<style lang="scss">
.enSettingDrawer {
  .arco-drawer-body {
    overscroll-behavior: none;
    padding: 0px 0px;

    display: flex;
    flex-direction: column;
  }
}
</style>
