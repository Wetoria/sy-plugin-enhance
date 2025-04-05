<!-- eslint-disable vue/require-v-for-key -->
<template>
  <EnSettingsTeleportModule
    :module="module"
    :name="moduleOptions.moduleName"
    :display="moduleOptions.moduleDisplayName"
    always
  >
    <EnSettingsItem mode="vertical">
      <div>
        创建模式
      </div>
      <template #desc>
        <div>
          选择批注创建内容的模式：添加至目标块、当前块(文档)、或追加至笔记本的日记中。
        </div>
        <div v-if="moduleOptions.targetId">
          已选择文档：
          <a-link
            @click="openTargetDoc"
          >
            点击跳转至目标文档
          </a-link>
        </div>
      </template>
      <template #opt>
        <div class="EnNotebookSelector">
          <EnBlockAppendModeSelector
            v-model="moduleOptions.notebookId"
            v-model:targetId="moduleOptions.targetId"
            :notebookList="openedNotebookList"
            :mode="commentMode"
          />
        </div>
      </template>
    </EnSettingsItem>
    <EnSettingsItem mode="vertical">
      <div>
        批注包裹模式
      </div>
      <template #opt>
        <div class="EnCommentStyleSelector">
          <a-radio-group
            v-model="moduleOptions.commentWrapMode"
          >
            <a-radio value="NodeList">列表</a-radio>
            <a-radio value="NodeSuperBlock">超级块</a-radio>
          </a-radio-group>
        </div>
      </template>
    </EnSettingsItem>
    <EnSettingsItem
      mode="manual"
    >
      <div
        class="flexColumn"
        style="width: 100%;"
        @mousemove.capture="cancelSettingMouseMoveEvent"
        @mousedown.capture="cancelSettingMouseMoveEvent"
      >
        <div
          class="settingTitle"
        >
          自定义批注结构
        </div>
        <div>
          批注结构说明：
        </div>
        <div>
          ${comment}
        </div>
        <div>
          如果需要立即可以输入，请在第一行插入该变量。
        </div>
        <div>
          ${ref}、${ref|text}、${ref|link}
        </div>
        <div>
          锚文本链接。用英文|分割。
        </div>
        <div>
          ${ref} - 动态锚文本。跟随目标块原文变化。
        </div>
        <div>
          ${ref|text} - 静态锚文本。使用目标块的原文纯文本。
        </div>
        <div>
          ${ref|link} - 静态锚文本。显示为|后面的文本(如：link)。可指定任意文本，比如: ${ref|*} 则是显示为 *。
        </div>
        <div>
          ${quote} - 摘录的原文，Markdown 格式。会用引述块进行包裹。
        </div>
        <div>
          当同时存在 ${ref|text} 和 ${quote}，行内评论或评论单独一个块时（text 等于 quote），将不会生成原文摘录，而是显示为 ${ref|text}。
        </div>
        <div class="EnCommentStructureEditor">
          <a-textarea
            v-model="moduleOptions.customCommentStructure"
          />
        </div>
      </div>
    </EnSettingsItem>

    <EnSettingsItem>
      <div>
        启用批注样式
      </div>
      <template #desc>
        <div>
          是否显示批注的样式
        </div>
      </template>
      <template #opt>
        <a-switch v-model="moduleOptions.enableCommentStyle" />
      </template>
    </EnSettingsItem>

    <EnSettingsItem mode="vertical">
      <div>
        批注效果
      </div>
      <template #opt>
        <div class="EnCommentStyleSelector">
          <a-select
            v-model="moduleOptions.commentStyle"
            placeholder="选择批注样式"
          >
            <a-option
              v-for="mode of commentStyleOptions"
              :key="mode.value"
              :value="mode.value"
              :label="mode.label"
            >
            </a-option>
          </a-select>
        </div>
      </template>
    </EnSettingsItem>
    <EnSettingsItem mode="vertical">
      <div>
        批注样式
      </div>
      <template #desc>
        <div
          :style="
            moduleOptions.commentStyle === 'highlight' ? {
              display: 'inline',
              boxDecorationBreak: 'clone',
              backgroundColor: moduleOptions.commentUnderlineColor,
            } : {
              textDecorationLine: 'underline',
              textDecorationStyle: moduleOptions.commentStyle,
              textDecorationColor: moduleOptions.commentUnderlineColor,
              textDecorationThickness: `${moduleOptions.commentUnderlineWidth}px`,
            }
          "
        >
          批注样式效果预览
        </div>
      </template>
      <template #opt>
        <div class="EnCommentStyleSlider">
          <a-slider
            v-model="moduleOptions.commentUnderlineWidth"
            :min="1"
            :max="8"
          />
          <EnColorPicker
            v-model="moduleOptions.commentUnderlineColor"
            type="color"
          />
        </div>
      </template>
    </EnSettingsItem>
  </EnSettingsTeleportModule>
  <template v-if="enableComment">
    <EnCommentDataProvider>
      <EnCommentStyle v-if="moduleOptions.enableCommentStyle">
        <!-- 为历史样式预留 -->
      </EnCommentStyle>
      <EnCommentDesktop v-if="!plugin.isMobile" />
      <EnCommentMobile v-else />

      <!-- <EnCommentHistory /> -->
    </EnCommentDataProvider>
  </template>
</template>

<script setup lang="ts">
import EnBlockAppendModeSelector from '@/components/EnBlockAppendModeSelector.vue'
import EnColorPicker from '@/components/EnColorPicker.vue'
import { usePlugin } from '@/main'
import {
  provideCommentOptions,
} from '@/modules/Comment/Comment'

import EnCommentDataProvider from '@/modules/Comment/EnCommentDataProvider.vue'
import EnCommentDesktop from '@/modules/Comment/EnCommentDesktop.vue'
// import EnCommentHistory from '@/modules/Comment/EnCommentHistory.vue'
import EnCommentMobile from '@/modules/Comment/EnCommentMobile.vue'
import EnCommentStyle from '@/modules/Comment/EnCommentStyle.vue'
import {
  injectAuthStatus,
  injectGlobalData,
  injectGlobalWindowData,
  useModule,
} from '@/modules/EnModuleControl/ModuleProvide'
import EnSettingsItem from '@/modules/Settings/EnSettingsItem.vue'
import EnSettingsTeleportModule from '@/modules/Settings/EnSettingsTeleportModule.vue'
import {
  EN_CONSTANTS,
  EN_MODULE_LIST,
} from '@/utils/Constants'
import { openDocById } from '@/utils/Note'
import {
  computed,
} from 'vue'



const plugin = usePlugin()

const globalWindowData = injectGlobalWindowData()
const globalData = injectGlobalData()
const openedNotebookList = computed(() => globalData.value.openedNotebookList)
const {
  isNotFree,
} = injectAuthStatus()

const { computedLevel } = injectAuthStatus()
const hasAuth = computedLevel(1, false)
const commentMode = computed(() => {
  if (hasAuth.value) {
    return globalData.value.commentMode
  }
  return []
})

const enableComment = computed(() => {
  return isNotFree.value && globalWindowData.value.isInSiyuanMain
})

const {
  module,
  moduleOptions,
} = useModule<EnModuleComment>(EN_MODULE_LIST.COMMENT, {
  defaultData: {
    enabled: true,
    moduleName: EN_MODULE_LIST.COMMENT,
    moduleDisplayName: EN_CONSTANTS.COMMENT_DISPLAY,

    notebookId: '',
    targetId: '',

    enableCommentStyle: true,
    commentStyle: 'solid',
    commentUnderlineWidth: 2,
    commentUnderlineColor: '#65b84d',


    commentWrapMode: 'NodeList',
    customCommentStructure: '',
  },
})

provideCommentOptions(moduleOptions)


const commentStyleOptions = [
  {
    value: 'solid',
    label: '实线',
  },
  {
    value: 'double',
    label: '双实线',
  },
  {
    value: 'dotted',
    label: '点线',
  },
  {
    value: 'dashed',
    label: '虚线',
  },
  {
    value: 'wavy',
    label: '波浪线',
  },
  {
    value: 'highlight',
    label: '高亮',
  },
]

const cancelSettingMouseMoveEvent = (e: MouseEvent) => {
  e.stopImmediatePropagation()
  e.stopPropagation()
}

const openTargetDoc = () => {
  if (!moduleOptions.value.targetId) {
    return
  }
  openDocById(moduleOptions.value.targetId)
}
</script>

<style lang="scss" scoped>

.settingTitle {
  font-weight: bold;
  display: flex;
  align-items: center;
  height: 28px;
}

.EnCommentStyleSlider,
.EnCommentStyleSelector {
  min-width: 134px;
}

.EnCommentStyleSlider {
  display: flex;
  align-items: center;
  gap: 8px;
}

.EnCommentStructureEditor {
  :deep(.arco-textarea) {
    min-height: 90px;
  }
}
</style>

<style lang="scss">
</style>
