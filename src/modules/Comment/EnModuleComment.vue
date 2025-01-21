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
          选择批注创建内容的模式：添加至目标块、当前块、或追加至笔记本的日记中。
        </div>
        <div>
          <a-typography-text type="warning">
            注：修改本设置会更新批注窗口中的配置。
          </a-typography-text>
        </div>
        <div>
          窗口中的配置独立于该设置。你随时可以在窗口中更改成你想要的模式。
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
            :mode="globalData.commentMode"
          />
        </div>
      </template>
    </EnSettingsItem>
    <EnSettingsItem>
      <div>
        同步窗口中的配置
      </div>
      <template #desc>
        <div>
          如果未开启该选项，修改窗口中的配置仅用作临时更改，重启思源/插件后，会恢复为上方的配置。
        </div>
      </template>
      <template #opt>
        <a-switch v-model="moduleOptions.autoSaveConfigByWindow" />
      </template>
    </EnSettingsItem>
    <EnSettingsItem>
      <div>
        默认配置
      </div>
      <template #desc>
        <div>
          :root {<br>
          &nbsp;&nbsp;--en-comment-background-color: var(--b3-font-color11, #65b84d);<br>
          &nbsp;&nbsp;--en-comment-underline-color: var(--b3-card-success-color, rgb(183, 223, 185));<br>
          &nbsp;&nbsp;--en-comment-line-underline-color: var(--en-comment-underline-color);<br>
          &nbsp;&nbsp;--en-comment-style: underline;<br>
          &nbsp;&nbsp;--en-comment-underline-width: 2px;<br>

          &nbsp;&nbsp;--en-comment-text-shadow: 0px -5px 24px var(--en-comment-background-color);<br>
          }
        </div>
        <div>
          下方配置中，在最外侧使用 <code>& {}</code>，即代表评论的目标块（可参考默认配置）
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
          自定义样式（块）
        </div>
        <div>
          <a-textarea
            v-model="moduleOptions.customStyleBlock"
          />
        </div>
      </div>
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
          自定义样式（行内）
        </div>
        <div>
          <a-textarea
            v-model="moduleOptions.customStyleInline"
          />
        </div>
      </div>
    </EnSettingsItem>
  </EnSettingsTeleportModule>
  <template v-if="enableComment">
    <EnCommentDesktop v-if="!plugin.isMobile" />
    <EnCommentMobile v-else />
  </template>
</template>

<script setup lang="ts">
import EnBlockAppendModeSelector from '@/components/EnBlockAppendModeSelector.vue'
import { usePlugin } from '@/main'

import EnCommentDesktop from '@/modules/Comment/EnCommentDesktop.vue'
import EnCommentMobile from '@/modules/Comment/EnCommentMobile.vue'
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
    autoSaveConfigByWindow: false,

    customStyleBlock: `& {
  &[data-type="NodeParagraph"],
  &[data-type="NodeHeading"],
  [data-type="NodeParagraph"],
  [data-type="NodeHeading"] {
    & > div:first-child {
      text-decoration: var(--en-comment-style);
      text-decoration-color: var(--en-comment-underline-color);
      text-decoration-thickness: var(--en-comment-underline-width);
      text-shadow: var(--en-comment-text-shadow);

      & * {
        text-decoration: var(--en-comment-style);
        text-decoration-color: var(--en-comment-underline-color);
        text-decoration-thickness: var(--en-comment-underline-width);
        text-shadow: var(--en-comment-text-shadow);
      }

      img {
        border: var(--en-comment-underline-width) solid var(--en-comment-underline-color);
      }
    }
  }

  [data-type="NodeWidget"],
  [data-type="NodeBlockQueryEmbed"],
  [data-type="NodeHTMLBlock"],
  [data-type="NodeCodeBlock"],
  [data-type="NodeVideo"] video,
  [data-type="NodeAudio"] audio,
  [data-type="NodeIFrame"] {
    border: var(--en-comment-underline-width) solid var(--en-comment-underline-color);
  }
}`,
    customStyleInline: `& {
  text-decoration: var(--en-comment-style);
  text-decoration-color: var(--en-comment-line-underline-color);
  text-decoration-thickness: var(--en-comment-underline-width);
  text-shadow: var(--en-comment-text-shadow);

  & * {
    text-decoration: var(--en-comment-style);
    text-decoration-color: var(--en-comment-line-underline-color);
    text-decoration-thickness: var(--en-comment-underline-width);
    text-shadow: var(--en-comment-text-shadow);
  }
}`,
  },
})

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
</style>

<style lang="scss">
:root {
  --en-comment-background-color: var(--b3-font-color11, #65b84d);
  --en-comment-underline-color: var(--b3-card-success-color, rgb(183, 223, 185));
  // --en-comment-line-underline-color: var(--b3-theme-success, #65b84d);
  --en-comment-line-underline-color: var(--en-comment-underline-color);
  --en-comment-style: underline;
  --en-comment-underline-width: 2px;

  --en-comment-text-shadow: 0px -5px 24px var(--en-comment-background-color);
}
</style>
