<template>
  <EnSettingsTeleportModule
    :name="moduleOptions.moduleName"
    :display="moduleOptions.moduleDisplayName"
    :module="module"
    authLevel="2"
  >
    <EnSettingsItem mode="vertical">
      <div>
        创建模式
      </div>
      <template #desc>
        <div>
          选择白板节点对应的思源块的创建位置：添加至目标块或追加至笔记本的日记中。
        </div>
        <div>
          如果目标为容器块（比如文档、列表项、超级块），则会插入容器块的末尾。
        </div>
        <div>
          如果目标非容器块（比如段落），则会插入目标块的后方。
        </div>
        <div v-if="moduleOptions.targetId">
          已选择块：
          <a-link
            @click="openTargetDoc"
          >
            点击跳转至目标块
          </a-link>
        </div>
      </template>
      <template #opt>
        <div class="EnNotebookSelector">
          <EnBlockAppendModeSelector
            v-model="moduleOptions.notebookId"
            v-model:targetId="moduleOptions.targetId"
            :notebookList="openedNotebookList"
            :mode="whiteBoardMode"
            :disabled="cannotEdit"
          />
        </div>
      </template>
    </EnSettingsItem>
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
          :disabled="cannotEdit"
        />
      </template>
    </EnSettingsItem>
    <EnSettingsItem>
      <div>
        白板左侧边默认展开
      </div>
      <template #opt>
        <a-switch
          v-model="moduleOptions.siderLeftShowDefault"
          :disabled="cannotEdit"
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
          :disabled="cannotEdit"
        />
      </template>
    </EnSettingsItem>
    <EnSettingsItem>
      <div>
        白板右侧边默认展开
      </div>
      <template #opt>
        <a-switch
          v-model="moduleOptions.siderRightShowDefault"
          :disabled="cannotEdit"
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
          :disabled="cannotEdit"
        />
      </template>
    </EnSettingsItem>
    <EnSettingsItem mode="vertical">
      <div>
        白板卡片默认宽度
      </div>
      <template #opt>
        <a-input-number
          v-model="moduleOptions.cardWidthDefault"
          placeholder="Please Enter"
          mode="button"
          :readOnly="plugin.isMobile"
          :disabled="cannotEdit"
        />
      </template>
    </EnSettingsItem>
    <EnSettingsItem mode="vertical">
      <div>
        白板卡片默认高度
      </div>
      <template #opt>
        <a-input-number
          v-model="moduleOptions.cardHeightDefault"
          placeholder="Please Enter"
          mode="button"
          :readOnly="plugin.isMobile"
          :disabled="cannotEdit"
        />
      </template>
    </EnSettingsItem>
    <EnSettingsItem>
      <div>
        白板卡片自动合并为超级块
      </div>
      <template #desc>
        <div>
          是否自动将卡片顶层多个块合并为超级块
        </div>
      </template>
      <template #opt>
        <a-switch
          v-model="moduleOptions.autoMergeToSuperBlock"
          :disabled="cannotEdit"
        />
      </template>
    </EnSettingsItem>
    <EnSettingsItem mode="vertical">
      <div>
        白板卡片自动合并为超级块延迟时间
      </div>
      <template #desc>
        <div>
          白板卡片自动合并为超级块的延迟时间，单位为秒
        </div>
      </template>
      <template #opt>
        <a-input-number
          v-model="moduleOptions.autoMergeToSuperBlockDelay"
          placeholder="Please Enter"
          mode="button"
          :readOnly="plugin.isMobile"
          :disabled="cannotEdit"
        />
      </template>
    </EnSettingsItem>
    <EnSettingsItem mode="vertical">
      <div>
        白板背景样式
      </div>
      <template #desc>
        <div>
          选择白板的背景样式
        </div>
      </template>
      <template #opt>
        <a-select
          v-model="moduleOptions.backgroundVariant"
          placeholder="请选择背景样式"
          :disabled="cannotEdit"
        >
          <a-option value="dots">
            点状
          </a-option>
          <a-option value="lines">
            网格
          </a-option>
          <a-option value="none">
            无
          </a-option>
        </a-select>
      </template>
    </EnSettingsItem>
  </EnSettingsTeleportModule>

  <template v-if="hasAuth && moduleOptions.enabled">
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
  injectAuthStatus,
  injectGlobalData,
  useModule,
} from '@/modules/EnModuleControl/ModuleProvide'
import {
  EnWhiteBoardBlockDomTarget,
  EnWhiteBoardSetting,
  loadWhiteBoard,
  loadWhiteBoardConfigById,
  unloadWhiteBoard,
  whiteBoardConfigList,
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
  computed,
  ref,
  watch,
  watchEffect,
} from 'vue'
import EnSettingsItem from '../../modules/Settings/EnSettingsItem.vue'
import EnSettingsTeleportModule from '../../modules/Settings/EnSettingsTeleportModule.vue'
import EnWhiteBoardEntrySlash from './EnWhiteBoardEntrySlash.vue'
import EnBlockAppendModeSelector from '@/components/EnBlockAppendModeSelector.vue'

const plugin = usePlugin()

const {
  computedLevel,
} = injectAuthStatus()
const hasAuth = computedLevel(2)

const cannotEdit = computed(() => {
  return !hasAuth.value || plugin.isMobile
})

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

    autoMergeToSuperBlock: true,
    autoMergeToSuperBlockDelay: 3,

    cardWidthDefault: 345,
    cardHeightDefault: 185,

    backgroundVariant: 'dots',
    
    // 新增块创建模式配置
    notebookId: '',
    targetId: '',
    autoSaveConfigByWindow: false,
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

// 监听全局背景设置变化
watch(() => moduleOptions.value.backgroundVariant, (newVariant, oldVariant) => {
  // 更新所有白板的背景设置
  Object.values(whiteBoardConfigList.value).forEach((config) => {
    // 如果白板的背景设置与之前的全局设置相同，说明它没有被手动修改过，应该跟随全局设置更新
    if (config.moduleOptions.value.boardOptions.backgroundVariant === oldVariant) {
      config.moduleOptions.value.boardOptions.backgroundVariant = newVariant
    }
  })
})

// 获取已打开的笔记本列表
const globalData = injectGlobalData()
const openedNotebookList = computed(() => globalData.value.openedNotebookList || [])
const whiteBoardMode = computed<EnBlockAppendMode[]>(() => 
  globalData.value.whiteBoardMode || (['All', 'targetBlock', 'targetDoc'] as EnBlockAppendMode[])
)

// 跳转到目标文档
const openTargetDoc = () => {
  if (moduleOptions.value.targetId) {
    const app = window.siyuan?.ws?.app
    if (app) {
      app.openTab({
        app,
        doc: {
          id: moduleOptions.value.targetId,
        },
      })
    }
  }
}
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
  --en-whiteboard-resizer-width: 5px;
}
</style>
