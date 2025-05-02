<template>
  <EnProtyleCustomArea
    ref="customRef"
    :getTargetBlockDom="data.getDom"
    :fullScreen="fullScreen"
  >
    <template #customArea v-if="embedInWhiteBoard">
      <div
        class="flexAlignCenter"
        style="
          height: 50px;
          padding: 0 10px;
          opacity: 0.5;
        "
      >
        <a-typography-text type="warning">
          检测到当前在白板中嵌套渲染，渲染取消
        </a-typography-text>
      </div>
    </template>
    <div
      v-if="!embedInWhiteBoard"
      ref="embedRenderRef"
      class="EnWhiteBoardEmbedRenderContainer"
      :class="{
        FullScreen: fullScreen,
        ClickedInside: clickedInside,
      }"
      @mouseleave="handleMouseLeave"
      @mouseenter="handleMouseEnter"
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
          @wheel.passive="handleWheel"
        >
          <EnWhiteBoardRender
            :data="data"
            :needSider="!!fullScreen"
          >

            <template #SiderLeftTopButtonGroupAfter>
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
  onBeforeUnmount,
  onMounted,
  ref,
  watchEffect,
} from 'vue'

const props = defineProps<{
  data: EnWhiteBoardBlockDomTarget
}>()

// Custom 组件的 ref
const customRef = ref(null)

// 实际显示白板的容器的 ref
const embedRenderRef = ref(null)

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



// #region 👇 拦截白板上的滚轮事件，触发嵌入文档的滚动

const handleWheel = (e: WheelEvent) => {
  if (fullScreen.value) {
    return
  }

  const targetElement = customRef.value?.protyleContentRef

  if (!targetElement) {
    return
  }

  const delta = e.deltaY

  // 应用滚动到元素A（方向可能需要调整）
  targetElement.scrollTop += delta
}

// #endregion 👆 拦截白板上的滚轮事件，触发嵌入文档的滚动



// #region 👇 标记是否为点击白板内部，用于在非铺满的情况下，点击白板内部，显示高亮的边框

const clickedInside = ref(false)
const recordClickedInsider = (event) => {
  const target = event.target as HTMLElement
  const targetContainer = target.closest('.EnWhiteBoardEmbedRenderContainer')
  if (targetContainer && targetContainer === embedRenderRef.value) {
    clickedInside.value = true
  } else {
    clickedInside.value = false
  }
}
onMounted(() => {
  document.addEventListener('click', recordClickedInsider)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', recordClickedInsider)
})

// #endregion 👆 标记是否为点击白板内部，用于在非铺满的情况下，点击白板内部，显示高亮的边框



// #region 👇 鼠标进入白板时，隐藏外部文档的 gutters

const handleMouseLeave = () => {
  const closetProtyle = embedRenderRef.value?.closest('.protyle')
  if (!closetProtyle) {
    return
  }
  closetProtyle.classList.remove('EnMouseInWhiteBoard')
}

const handleMouseEnter = () => {
  const closetProtyle = embedRenderRef.value?.closest('.protyle')
  if (!closetProtyle) {
    return
  }
  closetProtyle.classList.add('EnMouseInWhiteBoard')
}

// #endregion 👆 鼠标进入白板时，隐藏外部文档的 gutters


const embedInWhiteBoard = ref(true)
watchEffect(() => {
  if (customRef.value && customRef.value?.protyleContentRef) {
    const hasWhiteBoardContainer = customRef.value?.protyleContentRef?.closest('.EnWhiteBoardEmbedRenderContainer')
    embedInWhiteBoard.value = !!hasWhiteBoardContainer
  }
})

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

  overflow: hidden;

  .arco-resizebox {
    box-sizing: border-box;
  }

  // 铺满的情况下，强制容器区域的高度为 100%
  &.FullScreen .arco-resizebox {
    height: 100% !important;
    padding-bottom: unset !important;
  }

  // 嵌入文档的情况下，点击内部，显示高亮的边框
  &:not(.FullScreen).ClickedInside {
    border-color: var(--b3-theme-primary);
  }
}
</style>
<style lang="scss">
.EnMouseInWhiteBoard {
  .protyle-gutters {
    display: none !important;
  }
}
</style>
