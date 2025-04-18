<template>
  <a-modal
    v-model:visible="visible"
    class="en-modal-container"
    :modal-class="[
      `en-modal`,
      resizeDirection ? `en-modal-resize-${resizeDirection}` : '',
    ]"
    :footer="false"
    :mask="false"
    :modal-style="{
      width: `${modalInfo.width}px`,
      height: `${modalInfo.height}px`,
      top: `${modalInfo.top}px`,
      left: `${modalInfo.left}px`,
    }"
    v-bind="$attrs"
    :draggable="false"
  >
    <template #title>
      <div
        class="en-modal-title"
        @[startEventName]="(event) => onMouseDown(event, 'move')"
      >
        <slot name="title" />
      </div>
    </template>
    <div class="en-modal-content">
      <slot />

    </div>
    <!-- 手机端 -->
    <template v-if="plugin.isMobile">
      <div
        class="en-resizer corner top left"
        :class="[
          plugin.isMobile ? 'mobile' : '',
        ]"
        @touchstart="(event) => onMouseDown(event, 'topLeft')"
      ></div>
      <div
        class="en-resizer corner top right"
        :class="[
          plugin.isMobile ? 'mobile' : '',
        ]"
        @touchstart="(event) => onMouseDown(event, 'topRight')"
      ></div>
      <div
        class="en-resizer corner bottom left"
        :class="[
          plugin.isMobile ? 'mobile' : '',
        ]"
        @touchstart="(event) => onMouseDown(event, 'bottomLeft')"
      ></div>
      <div
        class="en-resizer corner bottom right"
        :class="[
          plugin.isMobile ? 'mobile' : '',
        ]"
        @touchstart="(event) => onMouseDown(event, 'bottomRight')"
      ></div>
    </template>

    <!-- 桌面端 -->
    <template v-else>
      <!-- <template> -->
      <div
        class="en-resizer line left"
        @mousedown="(event) => onMouseDown(event, 'left')"
      ></div>
      <div
        class="en-resizer line right"
        @mousedown="(event) => onMouseDown(event, 'right')"
      ></div>
      <div
        class="en-resizer line top"
        @mousedown="(event) => onMouseDown(event, 'top')"
      ></div>
      <div
        class="en-resizer line bottom"
        @mousedown="(event) => onMouseDown(event, 'bottom')"
      ></div>

      <div
        class="en-resizer corner top left"
        @mousedown="(event) => onMouseDown(event, 'topLeft')"
      ></div>
      <div
        class="en-resizer corner top right"
        @mousedown="(event) => onMouseDown(event, 'topRight')"
      ></div>
      <div
        class="en-resizer corner bottom left"
        @mousedown="(event) => onMouseDown(event, 'bottomLeft')"
      ></div>
      <div
        class="en-resizer corner bottom right"
        @mousedown="(event) => onMouseDown(event, 'bottomRight')"
      ></div>
    </template>
  </a-modal>
</template>

<script setup lang="ts">
import { usePlugin } from '@/main'
import { useViewport } from '@/modules/EnPWA.vue'
import {
  computed,
  ref,
  watchEffect,
} from 'vue'

const plugin = usePlugin()

type ResizeDirection =
  | 'move'
  | 'left'
  | 'right'
  | 'top'
  | 'bottom'
  | 'topLeft'
  | 'topRight'
  | 'bottomLeft'
  | 'bottomRight'

const modalInfo = ref({
  width: 500,
  height: 300,
  left: -1,
  top: -1,
})
const resizeDirection = ref<ResizeDirection>()
watchEffect(() => {
  if (resizeDirection.value) {
    document.documentElement.dataset.en_modal_resize_direction = resizeDirection.value
  } else {
    delete document.documentElement.dataset.en_modal_resize_direction
  }
})
const startInfo = ref({
  width: 0,
  height: 0,
  left: 0,
  top: 0,
})
const posInfo = ref({
  x: -1,
  y: -1,
})

const startEventName = computed(() => {
  return plugin.isMobile ? 'touchstart' : 'mousedown'
})

const viewport = useViewport()
const getWindowInfo = () => {
  const windowWidth = plugin.isMobile ? viewport.value.width : window.innerWidth
  const windowHeight = plugin.isMobile ? viewport.value.height : window.innerHeight
  return {
    windowWidth,
    windowHeight,
  }
}

const getBoundryLimit = () => {
  const {
    windowWidth,
    windowHeight,
  } = getWindowInfo()

  const minOffset = 10
  // const minLeft = (window.innerWidth * 0.05) / 2
  const minLeft = minOffset
  const maxLeft = windowWidth - modalInfo.value.width - minLeft

  // const minTop = (window.innerHeight * 0.05) / 2
  const minTop = plugin.isMobile ? minOffset : 32
  const maxTop = windowHeight - modalInfo.value.height - minOffset


  const minWidth = 100
  const maxWidth = windowWidth - modalInfo.value.left - minLeft

  const minHeight = 100
  const maxHeight = windowHeight - modalInfo.value.top - minOffset

  return {
    minLeft,
    minTop,
    maxLeft,
    maxTop,
    minWidth,
    minHeight,
    maxWidth,
    maxHeight,
  }
}

const fixModalSize = () => {
  const {
    minWidth,
    minHeight,
    maxWidth,
    maxHeight,
  } = getBoundryLimit()

  if (modalInfo.value.width < minWidth) {
    modalInfo.value.width = minWidth
  }
  if (modalInfo.value.width > maxWidth) {
    modalInfo.value.width = maxWidth
  }

  if (modalInfo.value.height < minHeight) {
    modalInfo.value.height = minHeight
  }
  if (modalInfo.value.height > maxHeight) {
    modalInfo.value.height = maxHeight
  }
}

const fixModalPosition = () => {
  const {
    minLeft,
    minTop,
    maxLeft,
    maxTop,
  } = getBoundryLimit()

  if (modalInfo.value.left > maxLeft) {
    modalInfo.value.left = maxLeft
  }
  if (modalInfo.value.left < minLeft) {
    modalInfo.value.left = minLeft
  }

  if (Number.isNaN(modalInfo.value.left)) {
    modalInfo.value.left = window.innerWidth / 2 - modalInfo.value.width / 2
  }


  if (modalInfo.value.top > maxTop) {
    modalInfo.value.top = maxTop
  }
  if (modalInfo.value.top < minTop) {
    modalInfo.value.top = minTop
  }

  if (Number.isNaN(modalInfo.value.top)) {
    modalInfo.value.top = window.innerHeight / 2 - modalInfo.value.height / 2
  }
}

const visible = defineModel<boolean>('visible')
watchEffect(() => {
  if (visible.value && modalInfo.value.left < 0) {
    fixModalSize()
    modalInfo.value.left = window.innerWidth / 2 - modalInfo.value.width / 2
    modalInfo.value.top = window.innerHeight / 2 - modalInfo.value.height / 2
    fixModalPosition()
  }
})

const getPosInfoByEvent = (event: MouseEvent | TouchEvent) => {
  const isTouchEvent = event instanceof TouchEvent
  return {
    x: isTouchEvent ? (event as TouchEvent).touches[0].clientX : (event as MouseEvent).clientX,
    y: isTouchEvent ? (event as TouchEvent).touches[0].clientY : (event as MouseEvent).clientY,
  }
}

const onMove = (event) => {
  const newPosInfo = getPosInfoByEvent(event)

  let deltaX = newPosInfo.x - posInfo.value.x
  let deltaY = newPosInfo.y - posInfo.value.y

  if (resizeDirection.value === 'move') {
    let newLeft = startInfo.value.left + deltaX
    let newTop = startInfo.value.top + deltaY


    const {
      minLeft,
      maxLeft,
      maxTop,
      minTop,
    } = getBoundryLimit()

    if (newLeft > maxLeft) {
      newLeft = maxLeft
    }
    modalInfo.value.left = Math.max(minLeft, newLeft)

    if (newTop > maxTop) {
      newTop = maxTop
    }
    modalInfo.value.top = Math.max(minTop, newTop)

    return
  }

  const isLeft = ['left', 'topLeft', 'bottomLeft'].includes(resizeDirection.value)
  const isRight = ['right', 'topRight', 'bottomRight'].includes(resizeDirection.value)
  const isTop = ['top', 'topLeft', 'topRight'].includes(resizeDirection.value)
  const isBottom = ['bottom', 'bottomLeft', 'bottomRight'].includes(resizeDirection.value)
  const isHorizontal = isLeft || isRight
  const isVertical = isTop || isBottom
  const isCorner = isHorizontal && isVertical

  if (isLeft) {
    deltaX *= -1
  }
  if (isTop) {
    deltaY *= -1
  }

  if (isHorizontal || isCorner) {
    let newWidth = startInfo.value.width + deltaX

    const {
      minWidth,
      maxWidth,
    } = getBoundryLimit()

    if (newWidth > maxWidth) {
      newWidth = maxWidth
    }
    modalInfo.value.width = Math.max(minWidth, newWidth)


    if (isLeft) {
      let newLeft = startInfo.value.left - deltaX
      const {
        minLeft,
        maxLeft,
      } = getBoundryLimit()
      if (newLeft > maxLeft) {
        newLeft = maxLeft
      }
      modalInfo.value.left = Math.max(minLeft, newLeft)
    }
  }

  const {
    minTop,
  } = getBoundryLimit()


  if (newPosInfo.y > minTop && (isVertical || isCorner)) {
    let newHeight = startInfo.value.height + deltaY

    const {
      minHeight,
      maxHeight,
    } = getBoundryLimit()

    if (newHeight > maxHeight) {
      newHeight = maxHeight
    }
    modalInfo.value.height = Math.max(minHeight, newHeight)

    if (isTop) {
      let newTop = startInfo.value.top - deltaY
      const {
        minTop,
        maxTop,
      } = getBoundryLimit()
      if (newTop > maxTop) {
        newTop = maxTop
      }
      modalInfo.value.top = Math.max(minTop, newTop)
    }
  }
}

const unregister = () => {
  resizeDirection.value = null
  document.body.removeEventListener('mousemove', onMove)
  document.body.removeEventListener('touchmove', onMove)
  document.body.removeEventListener('mouseup', unregister)
  document.body.removeEventListener('touchend', unregister)
}

const onMouseDown = (event: MouseEvent | TouchEvent, direction: ResizeDirection) => {
  event.stopImmediatePropagation()
  event.stopPropagation()
  event.preventDefault()

  posInfo.value = getPosInfoByEvent(event)
  startInfo.value = {
    width: modalInfo.value.width,
    height: modalInfo.value.height,
    left: modalInfo.value.left,
    top: modalInfo.value.top,
  }
  resizeDirection.value = direction

  document.body.addEventListener('mousemove', onMove)
  document.body.addEventListener('touchmove', onMove)
  document.body.addEventListener('mouseup', unregister)
  document.body.addEventListener('touchend', unregister)
}

</script>

<style lang="scss">
.en-modal-container {
  &,
  .arco-modal-mask {
    pointer-events: none;
  }

  .arco-modal-wrapper {
    overflow: hidden;
  }

  .en-modal {
    pointer-events: auto;
    max-width: calc(100vw - 20px);
    max-height: calc(100vh - 20px);
    position: absolute;
    top: 0;
    left: 0;
    border-radius: var(--b3-border-radius-b);
    background-color: var(--b3-theme-surface);
    box-shadow: var(--b3-dialog-shadow);
    border: 1px solid var(--b3-theme-surface-lighter);
    display: flex;
    flex-direction: column;
    overflow: visible;

    .arco-modal-header {
      height: 30px;
      padding: 0 10px;
      border-bottom: unset;
      border-top-right-radius: var(--b3-border-radius-b);
      border-top-left-radius: var(--b3-border-radius-b);

      .arco-modal-close-btn {
        z-index: 1;
      }
    }

    .arco-modal-body {
      padding: 0;
      position: unset;
      flex: 1;
      border-bottom-right-radius: var(--b3-border-radius-b);
      border-bottom-left-radius: var(--b3-border-radius-b);
      overflow: visible;
    }
  }
}

html {
  // 手机端
  &[data-en_enabled_module~="isMobile"] {
    .arco-modal-close-btn {
      font-size: 20px;
    }
  }

  &[data-en_modal_resize_direction] {
    user-select: none;
  }

  // 桌面端（包含平板）
  &:not([data-en_enabled_module~="isMobile"]) {
    &[data-en_modal_resize_direction="left"],
    &[data-en_modal_resize_direction="right"] {
      cursor: ew-resize;

      & * {
        cursor: ew-resize;
      }
    }

    &[data-en_modal_resize_direction="top"],
    &[data-en_modal_resize_direction="bottom"] {
      cursor: ns-resize;

      & * {
        cursor: ns-resize;
      }
    }

    &[data-en_modal_resize_direction="topLeft"],
    &[data-en_modal_resize_direction="bottomRight"] {
      cursor: nwse-resize;

      & * {
        cursor: nwse-resize;
      }
    }

    &[data-en_modal_resize_direction="topRight"],
    &[data-en_modal_resize_direction="bottomLeft"] {
      cursor: nesw-resize;

      & * {
        cursor: nesw-resize;
      }
    }

    &[data-en_modal_resize_direction="move"] {
      cursor: move;

      & * {
        cursor: move;
      }
    }
  }
}
</style>

<style lang="scss" scoped>
.en-resizer {
  --en-resizer-corner-size: 20px;
  --en-resizer-line-size: 4px;
  --en-resizer-line-offset: 2px;
  position: absolute;
  z-index: 0;

  &.corner {
    width: var(--en-resizer-corner-size);
    height: var(--en-resizer-corner-size);
    --en-resizer-corner-offset: calc(var(--en-resizer-corner-size) / -2);

    &.left {
      left: var(--en-resizer-corner-offset);
    }

    &.right {
      right: var(--en-resizer-corner-offset);
    }

    &.top {
      top: var(--en-resizer-corner-offset);
    }

    &.bottom {
      bottom: var(--en-resizer-corner-offset);
    }

    &.top.left,
    &.bottom.right {
      cursor: nwse-resize;
    }

    &.top.right,
    &.bottom.left {
      cursor: nesw-resize;
    }

    &.mobile {
      --en-resizer-corner-size: 30px;
      --en-resizer-line-size: 8px;
      // background-color: var(--b3-theme-primary);

      &.left {
        left: -10px;
      }
      &.top {
        top: -10px;
      }
      &.right {
        right: -10px;
      }
      &.bottom {
        bottom: -10px;
      }

      // &::before {
      //   content: '';
      //   position: absolute;
      //   width: calc(100%);
      //   height: var(--en-resizer-line-size);
      //   background-color: var(--b3-theme-primary);
      //   border-radius: var(--en-resizer-line-size);
      //   top: 0;
      //   left: 0;
      // }
      // &::after {
      //   content: '';
      //   position: absolute;
      //   width: var(--en-resizer-line-size);
      //   height: calc(100%);
      //   background-color: var(--b3-theme-primary);
      //   border-radius: var(--en-resizer-line-size);
      //   top: 0;
      //   left: 0;
      // }

      // &.top.left {
      //   &::before {
      //     top: calc(50% - var(--en-resizer-line-size) / 2);
      //     left: calc(50% - var(--en-resizer-line-size) / 2);
      //   }
      //   &::after {
      //     top: calc(50% - var(--en-resizer-line-size) / 2);
      //     left: calc(50% - var(--en-resizer-line-size) / 2);
      //   }
      // }
      // &.top.right {
      //   &::before {
      //     top: calc(50% - var(--en-resizer-line-size) / 2);
      //     left: calc((50% - var(--en-resizer-line-size) / 2) * -1);
      //   }
      //   &::after {
      //     top: calc(50% - var(--en-resizer-line-size) / 2);
      //     left: calc(50% - var(--en-resizer-line-size) / 2);
      //   }
      // }
      // &.bottom.left {
      //   &::before {
      //     top: calc(50% - var(--en-resizer-line-size) / 2);
      //     left: calc(50% - var(--en-resizer-line-size) / 2);
      //   }
      //   &::after {
      //     top: calc((50% - var(--en-resizer-line-size) / 2) * -1);
      //     left: calc(50% - var(--en-resizer-line-size) / 2);
      //   }
      // }
      // &.bottom.right {
      //   &::before {
      //     top: calc(50% - var(--en-resizer-line-size) / 2);
      //     left: calc((50% - var(--en-resizer-line-size) / 2) * -1);
      //   }
      //   &::after {
      //     top: calc((50% - var(--en-resizer-line-size) / 2) * -1);
      //     left: calc((50% - var(--en-resizer-line-size) / 2) * 1);
      //   }
      // }
    }
  }

  &.line {

    &.top {
      top: calc(var(--en-resizer-line-size) / -2);
    }

    &.bottom {
      bottom: calc(var(--en-resizer-line-size) / -2);
    }

    &.left {
      left: calc(var(--en-resizer-line-size) / -2);
    }

    &.right {
      right: calc(var(--en-resizer-line-size) / -2);
    }

    &.top,
    &.bottom {
      width: calc(100% - var(--en-resizer-corner-size) - (var(--en-resizer-line-offset) * 2));
      height: var(--en-resizer-line-size);
      left: calc(var(--en-resizer-corner-size) / 2 + var(--en-resizer-line-offset));
      cursor: ns-resize;
    }

    &.left,
    &.right {
      width: var(--en-resizer-line-size);
      height: calc(100% - var(--en-resizer-corner-size) - (var(--en-resizer-line-offset) * 2));
      top: calc(var(--en-resizer-corner-size) / 2 + var(--en-resizer-line-offset));
      cursor: ew-resize;
    }
  }

}

.en-modal-title {
  cursor: move;
  flex: 1;
}

.en-modal-content {
  width: 100%;
  min-height: 100%;
  overflow-x: hidden;
  overflow-y: auto;

  display: flex;
  flex-direction: column;
}
</style>
