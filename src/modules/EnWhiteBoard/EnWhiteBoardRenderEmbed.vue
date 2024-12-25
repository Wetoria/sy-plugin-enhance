<template>
  <EnProtyleCustomArea
    ref="customRef"
    :getTargetBlockDom="data.getDom"
    :fullScreen="fullScreen"
  >
    <div
      class="EnWhiteBoardEmbedRenderContainer"
      :class="{
        FullScreen: fullScreen,
        ClickedInside: clickedInside,
      }"
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
          @wheel="handleWheel"
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
  onBeforeUnmount,
  onMounted,
  ref,
} from 'vue'

const props = defineProps<{
  data: EnWhiteBoardBlockDomTarget
}>()

const customRef = ref(null)

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

let scrollAnimation: number | null = null
let velocity = 0
const friction = 0.95 // 摩擦系数，可以调整
const speedMultiplier = 0.2 // 速度倍数，可以调整


const animateScroll = () => {
  const targetElement = customRef.value?.protyleContentRef
  if (!targetElement || Math.abs(velocity) < 0.1) {
    scrollAnimation = null
    velocity = 0
    return
  }

  targetElement.scrollTop += velocity
  velocity *= friction

  scrollAnimation = requestAnimationFrame(animateScroll)
}

const handleWheel = (e: WheelEvent) => {
  if (fullScreen.value) {
    return
  }

  e.preventDefault()

  // 根据deltaMode调整滚动量
  let delta = e.deltaY
  if (e.deltaMode === 1) { // 如果是行模式
    delta *= 16 // 转换为像素
  }

  // 添加更自然的加速度
  velocity += delta * speedMultiplier

  // 限制最大速度
  const maxVelocity = 100
  velocity = Math.max(Math.min(velocity, maxVelocity), -maxVelocity)

  if (scrollAnimation === null) {
    animateScroll()
  }
}

// 在组件卸载时清理
onBeforeUnmount(() => {
  if (scrollAnimation) {
    cancelAnimationFrame(scrollAnimation)
  }
})

const clickedInside = ref(false)
const recordClickedInsider = (event) => {
  const target = event.target as HTMLElement
  if (target.closest('.EnWhiteBoardEmbedRenderContainer')) {
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

  &.FullScreen .arco-resizebox {
    height: 100% !important;
    padding-bottom: unset !important;
  }

  &:not(.FullScreen).ClickedInside {
    border-color: var(--b3-theme-primary);
  }
}
</style>
