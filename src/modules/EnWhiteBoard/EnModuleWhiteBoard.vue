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
    <EnSettingsItem mode="vertical">
      <div>
        连接线类型
      </div>
      <template #desc>
        <div>
          选择白板中连接线的默认类型
        </div>
      </template>
      <template #opt>
        <a-select
          v-model="moduleOptions.edgeTypeDefault"
          placeholder="请选择连接线类型"
          :disabled="cannotEdit"
        >
          <a-option value="smoothstep">
            平滑阶梯
          </a-option>
          <a-option value="step">
            阶梯
          </a-option>
          <a-option value="straight">
            直线
          </a-option>
          <a-option value="bezier">
            贝塞尔曲线
          </a-option>
        </a-select>
      </template>
    </EnSettingsItem>
    <EnSettingsItem mode="vertical">
      <div>
        连接线粗细
      </div>
      <template #desc>
        <div>
          选择白板中连接线的默认粗细
        </div>
      </template>
      <template #opt>
        <a-select
          v-model="moduleOptions.edgeWidthDefault"
          placeholder="请选择连接线粗细"
          :disabled="cannotEdit"
        >
          <a-option value="1">
            细
          </a-option>
          <a-option value="2">
            中
          </a-option>
          <a-option value="3">
            粗
          </a-option>
        </a-select>
      </template>
    </EnSettingsItem>
    <EnSettingsItem mode="vertical">
      <div>
        连接线样式
      </div>
      <template #desc>
        <div>
          选择白板中连接线的默认样式
        </div>
      </template>
      <template #opt>
        <a-select
          v-model="moduleOptions.edgeStyleDefault"
          placeholder="请选择连接线样式"
          :disabled="cannotEdit"
        >
          <a-option value="solid">
            实线
          </a-option>
          <a-option value="dashed">
            虚线
          </a-option>
          <a-option value="dotted">
            点线
          </a-option>
        </a-select>
      </template>
    </EnSettingsItem>
    <EnSettingsItem mode="vertical">
      <div>
        连接线起点箭头
      </div>
      <template #desc>
        <div>
          选择白板中连接线的默认起点箭头
        </div>
      </template>
      <template #opt>
        <a-select
          v-model="moduleOptions.edgeMarkerStartDefault"
          placeholder="请选择起点箭头"
          :disabled="cannotEdit"
        >
          <a-option value="">
            无
          </a-option>
          <a-option value="circle-solid">
            实心圆点
          </a-option>
          <a-option value="line">
            横线
          </a-option>
          <a-option value="circle-hollow">
            空心圆点
          </a-option>
          <a-option value="arrow-start">
            箭头
          </a-option>
        </a-select>
      </template>
    </EnSettingsItem>
    <EnSettingsItem mode="vertical">
      <div>
        连接线终点箭头
      </div>
      <template #desc>
        <div>
          选择白板中连接线的默认终点箭头
        </div>
      </template>
      <template #opt>
        <a-select
          v-model="moduleOptions.edgeMarkerEndDefault"
          placeholder="请选择终点箭头"
          :disabled="cannotEdit"
        >
          <a-option value="">
            无
          </a-option>
          <a-option value="circle-solid">
            实心圆点
          </a-option>
          <a-option value="line">
            横线
          </a-option>
          <a-option value="circle-hollow">
            空心圆点
          </a-option>
          <a-option value="arrow">
            箭头
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
import EnBlockAppendModeSelector from '@/components/EnBlockAppendModeSelector.vue'
import { injectAuthStatus } from '@/logic/Auth'
import { usePlugin } from '@/main'
import {
  injectGlobalData,
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
  computed,
  ref,
  watch,
  watchEffect,
} from 'vue'
import EnSettingsItem from '../../modules/Settings/EnSettingsItem.vue'
import EnSettingsTeleportModule from '../../modules/Settings/EnSettingsTeleportModule.vue'
import EnWhiteBoardEntrySlash from './EnWhiteBoardEntrySlash.vue'

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

    cardWidthDefault: 260,
    cardHeightDefault: 64,

    backgroundVariant: 'dots',

    // 节点块创建模式相关配置
    notebookId: '',
    targetId: '',
    autoSaveConfigByWindow: false,

    // 边默认配置
    edgeTypeDefault: 'smoothstep',
    edgeWidthDefault: '2',
    edgeStyleDefault: 'solid',
    edgeMarkerStartDefault: '',
    edgeMarkerEndDefault: 'arrow',
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

// 获取已打开的笔记本列表
const globalData = injectGlobalData()
const openedNotebookList = computed(() => globalData.value.openedNotebookList || [])

const whiteBoardMode = computed<EnBlockAppendMode[]>(() => {
  if (hasAuth.value) {
    return [
      'currentDoc',
    ]
  }
  return []
})

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
</style>
