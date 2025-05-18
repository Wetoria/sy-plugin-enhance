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

      <!-- 模块导航 -->
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
          <span>
            {{ moduleInfo.moduleDisplayName }}
          </span>
        </div>
      </div>


      <!-- 模块设置列表 -->
      <div
        ref="enSettingsMainContentRef"
        class="flexColumn enSettingsMainContent"
        @scroll="onSettingListScroll"
      >
        <div class="flexColumn en_settings_list">
          <template
            v-for="(refItem) of settingRefKeysSorted"
            :key="refItem"
          >
            <!-- <a-card
              hoverable
              style="
                border-radius: var(--b3-border-radius);
                "
            >
          </a-card> -->
            <div
              :ref="(el) => settingsRefMap[refItem] = el"
              :data-en-setting-ref-module-name="refItem"
              class="enSettingsModuleArea"
            >
            </div>
          <!-- <EnDivider v-if="index != settingRefKeysSorted.length - 1" /> -->
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
          使用说明：
        </span>
        <!-- IMP 版本号这里，最好能直接跳转到对应的版本更新记录 -->
        <EnUsageLink part="leaves">
          {{ plugin.version ? `v${plugin.version}` : '' }}
        </EnUsageLink>
        <EnButtonIcon
          @click="checkNewUpdate"
        >
          <icon-cloud-download />
          <template #prompt>
            检查新版本
          </template>
        </EnButtonIcon>
        <span>
          问题反馈：
        </span>
        <a href="https://qm.qq.com/q/uqtSkQUS8U">Q 群</a>、
        <EnUsageLink part="feedback">
          其他
        </EnUsageLink>
      </div>
    </template>
  </EnDrawer>
  <a-modal
    v-model:visible="updateModalVisible"
    title="叶归｜更新成功"
    title-align="start"
    cancelText="取消"
    :mask="false"
    okText="刷新"
    @ok="onUpdateModalOk"
  >
    <div>
      是否刷新思源重启叶归插件？
    </div>
  </a-modal>
  <a-modal
    v-model:visible="downloadPromptModalVisible"
    title="叶归｜发现新版本"
    title-align="start"
    :mask="false"
    okText="下载"
    @ok="updatePlugin"
  >
    <div>
      点击下载新版本
      <a-link @click="openUpdateHistory">
        {{ downloadPromptModalData.tag_name }}
      </a-link>（点击版本号可查看更新记录）
    </div>
  </a-modal>
</template>

<script setup lang="ts">
import EnButtonIcon from '@/components/EnButtonIcon.vue'
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
  getNewPackageAndUnzip,
  hasNewVersion,
} from '@/modules/Settings/Version'


import {
  addCommand,
  removeCommand,
} from '@/utils/Commands'
import {
  EN_CONTENT_ANCHOR_MAP,
  EN_EVENT_BUS_KEYS,
} from '@/utils/Constants'
import { onCountClick } from '@/utils/DOM'
import { enEventBus } from '@/utils/EnEventBus'
import { Notification } from '@arco-design/web-vue'
import {
  onBeforeUnmount,
  onMounted,
  ref,
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

const hasNew = ref(false)
const loading = ref(false)


const updateModalVisible = ref(false)
const onUpdateModalOk = () => {
  window.location.reload()
}
const updatePlugin = async () => {
  Notification.info({
    id: 'EnDownloading',
    title: '叶归',
    content: '正在下载新版本...',
    duration: 0,
  })
  loading.value = true
  try {
    await getNewPackageAndUnzip()
    Notification.success({
      id: 'EnDownloading',
      title: '叶归',
      content: '新版本下载成功',
      duration: 2000,
    })
    updateModalVisible.value = true
  } catch (error) {
    Notification.error({
      id: 'EnDownloading',
      title: '叶归',
      content: '新版本下载失败',
      duration: 2000,
    })
  } finally {
    loading.value = false
  }
}
const downloadPromptModalVisible = ref(false)
const downloadPromptModalData = ref({
  tag_name: '',
})
const checkNewUpdate = async () => {
  loading.value = true
  const { close } = Notification.info({
    id: 'EnCheckingUpdate',
    title: '叶归',
    content: '正在检查新版本...',
    duration: 2000,
  })
  const data = await hasNewVersion()
  close()
  loading.value = false
  hasNew.value = data.hasNew
  if (hasNew.value) {
    downloadPromptModalVisible.value = true
    downloadPromptModalData.value = data.info
  } else {
    Notification.success('叶归｜当前已是最新版本')
  }
}
const openUpdateHistory = () => {
  window.open(EN_CONTENT_ANCHOR_MAP.update_history, '_blank')
}
</script>

<style lang="scss" scoped>
.SyEnhancerDialogTitle {
  font-weight: bold;
  font-size: 1.18em;
  color: rgb(var(--primary-6));
}
.en_settings_list {
  padding: 0px 8px;
  padding-bottom: 30px;
  gap: 20px;
}

.enSettingsFooter {
  display: flex;
  align-items: center;
  gap: var(--en-gap);
}

.enSettingsMain {
  overflow: hidden;
  display: flex;
  flex-direction: row;
  max-height: 85vh;
}

.enSettingsModuleSelectorList {
  overflow-x: hidden;
  overflow-y: auto;

  width: 90px;
  flex-shrink: 0;

  background-color: var(--b3-theme-surface-light);

  padding-bottom: 30px;

  &::-webkit-scrollbar {
    display: none; // Chrome, Safari, newer versions of Opera
  }

  .moduleSelectorItem {
    display: inline-block;
    box-sizing: border-box;
    padding: 4px 8px;
    font-size: 1em;
    cursor: pointer;
    position: relative;

    width: 100%;
    height: 30px;

    color: var(--b3-theme-on-surface);
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;

    &.moduleSelectorItem__Actived {
      color: var(--b3-theme-primary);
      background-color: var(--b3-theme-surface-lighter);
    }


  }

  &.isNotMobile {

    .moduleSelectorItem {

      &:hover {
        background-color: var(--b3-theme-surface-lighter);
      }
    }
  }
}

.enSettingsMainContent {
  overscroll-behavior: none;
  overflow: hidden;
  overflow-y: auto;
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

    background-color: var(--b3-theme-surface);
  }
  .arco-drawer-body {
    overscroll-behavior: none;
    padding: 0px 0px;

    display: flex;
    flex-direction: column;
  }

  .arco-drawer-footer {
    padding: 8px 12px;
  }
}
</style>
