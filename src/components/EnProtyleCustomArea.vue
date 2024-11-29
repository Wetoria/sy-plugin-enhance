<template>
  <!-- 在块下方渲染的占位区域 -->
  <Teleport :to="enProtyleCustomAreaRef" v-if="enProtyleCustomAreaRef">
    <div
      class="enProtyleCustomAreaContainer enCancelShowCommentListDom"
      ref="enProtyleCustomAreaContainerRef"
      @mousedown="cancelMouseDown"
    >
      <slot name="customArea"></slot>
    </div>
  </Teleport>

  <!-- 实际显示白板的区域 -->
  <Teleport :to="enProtyleActualAreaRef" v-if="enProtyleActualAreaRef">
    <div
      class="enProtyleActualAreaContainer"
      ref="enProtyleActualAreaContainerRef"
    >
      <slot></slot>
    </div>
  </Teleport>
</template>

<script lang="ts">
export const enProtyleCustomAreaClassName = 'enProtyleCustomArea'
export const enProtyleActualAreaClassName = 'enProtyleActualArea'

const enProtyleCustomAreaContainerOffset = 0
const arcoResizeBoxOffset = 6
</script>

<script setup lang="ts">
import { debounce } from '@/utils';
import { appendTargetDomAsClassOrder, unWatchDomChange, watchDomChange } from '@/utils/DOM';
import { getColorStringWarn } from '@/utils/Log';
import { onBeforeUnmount, onMounted, ref } from 'vue';

interface IProps {
  getTargetBlockDom: () => HTMLElement
}

const props = defineProps<IProps>()

const enProtyleCustomAreaRef = ref<HTMLElement | null>(null)
const enProtyleCustomAreaContainerRef = ref<HTMLElement | null>(null)

const enProtyleActualAreaRef = ref<HTMLElement | null>(null)
const enProtyleActualAreaContainerRef = ref<HTMLElement | null>(null)

const protyleContentRef = ref<HTMLElement | null>(null)

const registerDom = debounce(() => {
  const dom = props.getTargetBlockDom()
  if (!dom) {
    // enLog(`${getColorStringWarn('Render Protyle Custom Area Failed: ')} can not get target dom`)
    return
  }
  const enProtyleCustomAreaDom = appendTargetDomAsClassOrder(
    enProtyleCustomAreaClassName + '-' + dom.dataset.nodeId,
    dom
  )
  const isSameDom = enProtyleCustomAreaDom === enProtyleCustomAreaRef.value
  if (isSameDom) {
    // enLog(`${getColorStringWarn('No need to update Protyle Custom Area: ')} is same dom`)
    return
  }
  enProtyleCustomAreaDom.classList.add(enProtyleCustomAreaClassName)
  enProtyleCustomAreaRef.value = enProtyleCustomAreaDom

  let parent = dom.parentElement
  while (parent && !parent.classList.contains('protyle-content')) {
    parent = parent.parentElement
  }

  // 没找到 protyle-content，则不进行操作
  if (!parent) {
    return
  }

  const enProtyleActualDom = appendTargetDomAsClassOrder(
    enProtyleActualAreaClassName + '-' + dom.dataset.nodeId,
    parent
  )
  enProtyleActualDom.classList.add(enProtyleActualAreaClassName)
  enProtyleActualAreaRef.value = enProtyleActualDom

  protyleContentRef.value = parent
}, 200)

const cancelMouseDown = (event: MouseEvent) => {
  event.stopPropagation()
  event.stopImmediatePropagation()
  event.preventDefault()
}

const matchActualAreaToCustomArea = () => {
  copyCustomAreaStyleToActualArea()
  moveActualAreaToCustomArea()
}

const copyCustomAreaStyleToActualArea = () => {
  if (!enProtyleCustomAreaContainerRef.value || !enProtyleActualAreaContainerRef.value) {
    return
  }
  const customStyle = window.getComputedStyle(enProtyleCustomAreaContainerRef.value)

  const actualAreaWidth = `calc(${customStyle.width} - ${enProtyleCustomAreaContainerOffset}px)`
  const actualAreaHeight = `calc(${customStyle.height} - ${enProtyleCustomAreaContainerOffset}px - ${arcoResizeBoxOffset}px)`
  enProtyleActualAreaContainerRef.value.style.width = actualAreaWidth
  enProtyleActualAreaContainerRef.value.style.height = actualAreaHeight
}

const moveActualAreaToCustomArea = () => {
  if (!enProtyleCustomAreaContainerRef.value || !protyleContentRef.value || !enProtyleActualAreaContainerRef.value) {
    return
  }
  const customRect = enProtyleCustomAreaContainerRef.value.getBoundingClientRect()
  const protyleRect = protyleContentRef.value.getBoundingClientRect()
  const offsetX = customRect.left - protyleRect.left + (enProtyleCustomAreaContainerOffset / 2)
  const offsetY = customRect.top - protyleRect.top + (enProtyleCustomAreaContainerOffset / 2)
  enProtyleActualAreaContainerRef.value.style.transform = `translate(${offsetX}px, ${offsetY}px)`
}

const enable = () => {
  watchDomChange(registerDom)
  watchDomChange(matchActualAreaToCustomArea)
}

const disable = () => {
  // 注销事件
  unWatchDomChange(registerDom)
  unWatchDomChange(matchActualAreaToCustomArea)

  // 注销 ref
  enProtyleCustomAreaRef.value = null
  enProtyleCustomAreaContainerRef.value = null

  enProtyleActualAreaRef.value = null
  enProtyleActualAreaContainerRef.value = null

  protyleContentRef.value = null
}

onMounted(() => {
  enable()
})
onBeforeUnmount(() => {
  disable()
})
</script>

<style lang="scss">
.enProtyleCustomArea {
}
.enProtyleCustomAreaContainer {
  width: 100%;
  display: flex;
  min-height: 50px;
  box-sizing: border-box;
}

.enProtyleActualArea {
  // 面包屑高度，可能需要适配
  --en-protyle-breadcrumb-height: 30px;
  position: absolute;
  top: var(--en-protyle-breadcrumb-height);
  left: 0;
  width: 100%;
  height: calc(100% - var(--en-protyle-breadcrumb-height));

  pointer-events: none;
  overflow: hidden;
}
.enProtyleActualAreaContainer {
  display: flex;
  border: 1px solid var(--b3-board-color);
  box-sizing: border-box;

  pointer-events: auto;
}
</style>
