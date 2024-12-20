<template>
  <EnSettingsTeleportModule
    :name="moduleOptions.moduleName"
    :display="moduleOptions.moduleDisplayName"
    :module="module"
  >
    <EnSettingsItem mode="vertical">
      <div>
        白板后的最小高度
      </div>
      <template #opt>
        <a-input-number
          v-model="moduleOptions.embedBlockMinHeight"
          placeholder="Please Enter"
          mode="button"
          :readOnly="plugin.isMobile"
        />
      </template>
    </EnSettingsItem>
    <EnSettingsItem mode="vertical">
      <div>
        白板左侧边默认展开
      </div>
      <template #opt>
        <a-switch
          v-model="moduleOptions.siderLeftShowDefault"
        />
      </template>
    </EnSettingsItem>
    <EnSettingsItem mode="vertical">
      <div>
        白板左侧边默认宽度
      </div>
      <template #opt>
        <a-input-number
          v-model="moduleOptions.siderLeftWidthDefault"
          placeholder="Please Enter"
          mode="button"
          :readOnly="plugin.isMobile"
        />
      </template>
    </EnSettingsItem>
    <EnSettingsItem mode="vertical">
      <div>
        白板右侧边默认展开
      </div>
      <template #opt>
        <a-switch
          v-model="moduleOptions.siderRightShowDefault"
        />
      </template>
    </EnSettingsItem>
    <EnSettingsItem mode="vertical">
      <div>
        白板右侧边默认宽度
      </div>
      <template #opt>
        <a-input-number
          v-model="moduleOptions.siderRightWidthDefault"
          placeholder="Please Enter"
          mode="button"
          :readOnly="plugin.isMobile"
        />
      </template>
    </EnSettingsItem>
  </EnSettingsTeleportModule>

  <template v-if="moduleOptions.enabled">
    <EnWhiteBoardEntrySlash />
    <template
      v-for="item in wbEmbedBlockDomTargetList"
      :key="item.getDom()"
    >
      <EnWhiteBoardRenderEmbed
        :data="item"
      />
    </template>
  </template>
</template>

<script setup lang="ts">
import { usePlugin } from '@/main'
import {
  useModule,
} from '@/modules/EnModuleControl/ModuleProvide'
import {
  EnWhiteBoardBlockDomTarget,
  EnWhiteBoardSetting,
  loadWhiteBoard,
  loadWhiteBoardConfigById,
  unloadWhiteBoard,
} from '@/modules/EnWhiteBoard/EnWhiteBoard'
import EnWhiteBoardRenderEmbed from '@/modules/EnWhiteBoard/EnWhiteBoardRenderEmbed.vue'
import {
  debounce,
} from '@/utils'
import {
  EN_CONSTANTS,
  EN_MODULE_LIST,
} from '@/utils/Constants'


import {
  queryAllByDom,
  unWatchDomChange,
  watchDomChange,
} from '@/utils/DOM'
import {
  ref,
  watch,
  watchEffect,
} from 'vue'
import EnSettingsItem from '../Settings/EnSettingsItem.vue'
import EnSettingsTeleportModule from '../Settings/EnSettingsTeleportModule.vue'
import EnWhiteBoardEntrySlash from './EnWhiteBoardEntrySlash.vue'

const plugin = usePlugin()

// #region 基本的模块配置

const {
  module,
  moduleOptions,
} = useModule<EnWhiteBoardSetting>(EN_MODULE_LIST.EN_WHITE_BOARD, {
  defaultData: {
    enabled: false,
    moduleName: EN_MODULE_LIST.EN_WHITE_BOARD,
    moduleDisplayName: EN_CONSTANTS.EN_WHITE_BOARD_DISPLAY,

    embedBlockMinHeight: 200,
    siderLeftWidthDefault: 50,
    siderLeftShowDefault: true,
    siderRightWidthDefault: 50,
    siderRightShowDefault: true,
  },
})

// #endregion 基本的模块配置

// 需要渲染白板的 html 块列表
const wbEmbedBlockDomTargetList = ref<Array<EnWhiteBoardBlockDomTarget>>([])

const getWhiteBoardConfigs = async () => {
  const needLoadWhiteBoardIdList = wbEmbedBlockDomTargetList.value.map((item) => item.whiteBoardId)
  await Promise.all(needLoadWhiteBoardIdList.map((whiteBoardId) => {
    return loadWhiteBoardConfigById(whiteBoardId)
  }))
}
watchEffect(getWhiteBoardConfigs)

// 记录需要渲染的 html 自定义块
const recordBlockDomNeedRenderWhiteBoard = debounce(() => {
  const targetList = queryAllByDom(document.body, '[custom-en-ref-whiteboard-id]')

  const isSameLength = targetList.length === wbEmbedBlockDomTargetList.value.length
  const isSameDom = targetList.every((target) => {
    const targetDom = target as HTMLElement
    return wbEmbedBlockDomTargetList.value.some((item) => item.getDom() === targetDom)
  })

  if (isSameLength && isSameDom) {
    // enLog(`${getColorStringWarn('Record Block Dom Need Render White Board: ')} White Board Target don't change`)
    return
  }

  // 清空不存在的
  wbEmbedBlockDomTargetList.value = wbEmbedBlockDomTargetList.value.filter((item) => {
    const target = item.getDom()
    return targetList.includes(target)
  })

  targetList.forEach((target: HTMLElement) => {
    const whiteBoardId = target.getAttribute('custom-en-ref-whiteboard-id')
    const nodeId = target.dataset.nodeId
    const whiteBoardItem = wbEmbedBlockDomTargetList.value.find((item) => item.domRef === target)
    if (!whiteBoardItem) {
      const idList = [nodeId]
      let parent = target.parentElement
      while (parent) {
        const parentNodeId = parent.dataset.nodeId || parent.dataset.id
        if (parentNodeId) {
          idList.push(parentNodeId)
        }
        parent = parent.parentElement
      }
      wbEmbedBlockDomTargetList.value.push({
        whiteBoardId,
        nodeId,
        idList,
        domRef: target as HTMLElement,
        getDom: () => target as HTMLElement,
      })
    }
  })

}, 100)

const enable = () => {
  watchDomChange(recordBlockDomNeedRenderWhiteBoard)

  loadWhiteBoard()
  getWhiteBoardConfigs()
}

const disable = () => {
  unWatchDomChange(recordBlockDomNeedRenderWhiteBoard)
  unloadWhiteBoard()
}

watch(() => moduleOptions.value.enabled, () => {
  if (moduleOptions.value.enabled) {
    enable()
  } else {
    disable()
  }
})
</script>

<style lang="scss">
/* import the necessary styles for Vue Flow to work */
@import '@vue-flow/core/dist/style.css';

/* import the default theme, this is optional but generally recommended */
@import '@vue-flow/core/dist/theme-default.css';

@import '@vue-flow/node-resizer/dist/style.css';

body {
  --en-whiteboard-card-radius: 4px;

  --en-whiteboard-resizer-color: rgb(var(--primary-6));
  --en-whiteboard-resizer-width: 4px;

  --en-whiteboard-handle-color: rgb(var(--primary-6));
  --en-whiteboard-handle-size: 8px;
}
</style>
