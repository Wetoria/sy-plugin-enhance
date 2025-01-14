<!-- eslint-disable vue/require-v-for-key -->
<template>
  <EnSettingsTeleportModule
    :module="module"
    :name="moduleOptions.moduleName"
    :display="moduleOptions.moduleDisplayName"
    always
  >
    <!-- 下划线样式 -->
    <!-- 下划线宽度 -->
    <!-- 下划线颜色 -->
    <!-- 行内批注颜色 -->
    <!-- 行内批注背景颜色 -->
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
  <EnCommentDesktop v-if="!plugin.isMobile" />
  <EnCommentMobile v-else />
</template>

<script setup lang="ts">
import { usePlugin } from '@/main'

import EnCommentDesktop from '@/modules/Editor/Comment/EnCommentDesktop.vue'
import EnCommentMobile from '@/modules/Editor/Comment/EnCommentMobile.vue'
import {
  useModule,
} from '@/modules/EnModuleControl/ModuleProvide'
import EnSettingsItem from '@/modules/Settings/EnSettingsItem.vue'
import EnSettingsTeleportModule from '@/modules/Settings/EnSettingsTeleportModule.vue'
import {
  EN_CONSTANTS,
  EN_MODULE_LIST,
} from '@/utils/Constants'



const plugin = usePlugin()

const {
  module,
  moduleOptions,
} = useModule<{
  customStyleBlock: string
  customStyleInline: string
} & EnModule>(EN_MODULE_LIST.COMMENT, {
  defaultData: {
    enabled: true,
    moduleName: EN_MODULE_LIST.COMMENT,
    moduleDisplayName: EN_CONSTANTS.COMMENT_DISPLAY,

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
