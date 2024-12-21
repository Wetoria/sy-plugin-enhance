<template>
  <EnProtyleCustomArea
    :getTargetBlockDom="data.getDom"
    :fullScreen="fullScreen"
  >
    <div
      class="EnWhiteBoardEmbedRenderContainer"
      :class="[fullScreen ? 'FullScreen' : '']"
    >
      <template v-if="!embedWhiteBoardConfigData || !embedBlockOptions">
        <div>白板数据获取失败</div>
      </template>
      <template v-else>
        <a-resize-box
          v-model:height="embedBlockOptions.height"
          :directions="!fullScreen ? ['bottom'] : []"
          :style="{
            minHeight: `${moduleOptions.embedBlockMinHeight}px`,
            height: fullScreen ? '100%' : undefined,
          }"
        >
          <EnWhiteBoardRender
            :data="data"
            :needSider="!!fullScreen"
          >
            <template #SiderRightTopButtonGroupAfter>
              <a-tooltip content="思源内铺满">
                <a-button @click="changeFullScreen('siyuan')">
                  <SyIcon name="iconSiYuan" />
                </a-button>
              </a-tooltip>
              <a-tooltip content="文档内铺满">
                <a-button @click="changeFullScreen('doc')">
                  <SyIcon name="iconFile" />
                </a-button>
              </a-tooltip>
              <a-tooltip
                v-if="fullScreen"
                content="退出全屏"
              >
                <a-button @click="changeFullScreen()">
                  <SyIcon name="iconContract" />
                </a-button>
              </a-tooltip>
            </template>
          </EnWhiteBoardRender>
        </a-resize-box>
      </template>
    </div>
  </EnProtyleCustomArea>
</template>

<script setup lang="ts">
import EnProtyleCustomArea from '@/components/EnProtyleCustomArea.vue'
import SyIcon from '@/components/SiyuanTheme/SyIcon.vue'
import {
  EnWhiteBoardBlockDomTarget,
  getWhiteBoardConfigRefById,
  useWhiteBoardModule,
} from '@/modules/EnWhiteBoard/EnWhiteBoard'
import EnWhiteBoardRender from '@/modules/EnWhiteBoard/EnWhiteBoardRender.vue'
import {
  ref,
} from 'vue'

const props = defineProps<{
  data: EnWhiteBoardBlockDomTarget
}>()

const {
  moduleOptions,
} = useWhiteBoardModule()

const {
  embedWhiteBoardConfigData,
  embedBlockOptions,
} = getWhiteBoardConfigRefById(props.data.whiteBoardId, props.data.nodeId)

const fullScreen = ref<'doc' | 'siyuan' | undefined>(undefined)
const changeFullScreen = (value?: 'doc' | 'siyuan') => {
  fullScreen.value = value
}
</script>

<style lang="scss" scoped>
.EnWhiteBoardEmbedRenderContainer {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--b3-theme-background);
  box-sizing: border-box;
  border: 1px solid var(--b3-border-color);
  border-radius: var(--b3-border-radius);

  .arco-resizebox {
    box-sizing: border-box;
  }

  &.FullScreen .arco-resizebox {
    height: 100% !important;
    padding-bottom: unset !important;
  }
}
</style>
