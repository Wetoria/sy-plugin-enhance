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
        <a-button
          v-if="!settings.v && !authModuleData.lv"
          type="primary"
          @click="openAuthModal"
        >
          订阅
        </a-button>
        <template v-else>
          <a-tag
            v-if="isPermanent"
            color="gold"
          >
            <a-space>
              <EnIconDragon />
            </a-space>
          </a-tag>
          <a-tag
            v-else
            color="arcoblue"
            style="cursor: pointer;"
            @click="openAuthModal"
          >
            {{ levelLabel }}
          </a-tag>
        </template>
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
import EnIconDragon from '@/components/EnIconDragon.vue'
import { usePlugin } from '@/main'
import {
  injectAuth,
  injectAuthStatus,
  injectSettings,
} from '@/modules/EnModuleControl/ModuleProvide'


import {
  closeSettingsPanel,
  enSettingsMainContentRef,
  openSettings,
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
import { EN_EVENT_BUS_KEYS } from '@/utils/Constants'
import { onCountClick } from '@/utils/DOM'
import { enEventBus } from '@/utils/EnEventBus'
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

// #region 离线模式下的权限控制

const settings = injectSettings()
const switchID = (time) => {
  let v = settings.value.v
  if (time >= 11 && time < 20) {
    v = v > 0 ? 0 : 1
  } else if (time >= 20) {
    v = 2
  }
  settings.value.l = settings.value.v
  settings.value.v = v
}
const entryOpenSettings = onCountClick((time) => {
  if (time >= 11) {
    switchID(time)
  } else {
    openSettings()
  }
})
onMounted(() => {
  enEventBus.on(EN_EVENT_BUS_KEYS.SETTINGS_OPEN_ON_ENTRY, entryOpenSettings)
})
onBeforeUnmount(() => {
  enEventBus.off(EN_EVENT_BUS_KEYS.SETTINGS_OPEN_ON_ENTRY, entryOpenSettings)
})


// #endregion 离线模式下的权限控制

const { onTitleClicked } = useDebugSwitcher()


const authModuleData = injectAuth()
const {
  isPermanent,
  levelLabel,
} = injectAuthStatus()
const openAuthModal = () => {
  enEventBus.emit(EN_EVENT_BUS_KEYS.AUTH_OPEN_MODAL)
}
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
  padding: 2px;
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

  .arco-drawer-mask {
    background-color: rgba(0, 0, 0, 0.2);
  }
  .arco-drawer {
    max-width: 560px;
    left: unset;
    right: 0;
  }
  .arco-drawer-body {
    overscroll-behavior: none;
    padding: 0px 0px;

    display: flex;
    flex-direction: column;
  }
}
</style>
