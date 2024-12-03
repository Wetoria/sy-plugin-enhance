<template>
  <!-- 在块下方渲染的占位区域 -->
  <Teleport :to="enProtyleCustomAreaRef" v-if="enProtyleCustomAreaRef" :disabled="!enProtyleCustomAreaRef">
    <div
      class="enProtyleCustomAreaContainer enCancelShowCommentListDom"
      ref="enProtyleCustomAreaContainerRef"
      @mousedown="cancelMouseDown"
    >
      <slot name="customArea"></slot>
    </div>
  </Teleport>

  <template v-if="enProtyleActualAreaRef">
    <!-- 实际显示白板的区域 -->
    <Teleport :to="enProtyleActualAreaRef" :disabled="!enProtyleActualAreaRef">
      <div
        class="enProtyleActualAreaContainer"
        ref="enProtyleActualAreaContainerRef"
      >
          <slot></slot>
      </div>
    </Teleport>
  </template>
</template>

<script lang="ts">
export const enProtyleCustomAreaClassName = 'enProtyleCustomArea'
export const enProtyleActualAreaClassName = 'enProtyleActualArea'

const enProtyleCustomAreaContainerOffset = 0
const arcoResizeBoxOffset = 6

let count = 0
</script>

<script setup lang="ts">
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

const registerDom = () => {
  const dom = props.getTargetBlockDom()
  if (!dom) {
    // enLog(`${getColorStringWarn('Render Protyle Custom Area Failed: ')} can not get target dom`)
    return
  }
  count++
  const enProtyleCustomAreaDom = appendTargetDomAsClassOrder(
    `${enProtyleCustomAreaClassName}-${count}`,
    dom
  )
  const isSameDom = enProtyleCustomAreaDom === enProtyleCustomAreaRef.value
  if (isSameDom) {
    enLog(`${getColorStringWarn('No need to update Protyle Custom Area: ')} is same dom`)
    return
  }
  enProtyleCustomAreaDom.classList.add(enProtyleCustomAreaClassName)
  enProtyleCustomAreaDom.dataset.enTargetNodeId = dom.dataset.nodeId
  enProtyleCustomAreaDom.dataset.enId = `${count}`
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
    `${enProtyleActualAreaClassName}-${count}`,
    parent
  )
  enProtyleActualDom.classList.add(enProtyleActualAreaClassName)
  enProtyleActualDom.dataset.enTargetNodeId = dom.dataset.nodeId
  enProtyleActualDom.dataset.enId = `${count}`
  enProtyleActualAreaRef.value = enProtyleActualDom

  protyleContentRef.value = parent
}

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

  // 拷贝 custom 区域的宽度到 actual 区域
  const customStyle = window.getComputedStyle(enProtyleCustomAreaContainerRef.value)
  const actualAreaWidth = `calc(${customStyle.width} - ${enProtyleCustomAreaContainerOffset}px)`
  enProtyleActualAreaContainerRef.value.style.width = actualAreaWidth

  // const actualAreaHeight = `calc(${customStyle.height} - ${enProtyleCustomAreaContainerOffset}px - ${arcoResizeBoxOffset}px)`
  // enProtyleActualAreaContainerRef.value.style.height = actualAreaHeight


  // 拷贝 actual 区域的高度到 custom 区域
  const actualStyle = window.getComputedStyle(enProtyleActualAreaContainerRef.value)

  // const customAreaWidth = `calc(${actualStyle.width} + ${enProtyleCustomAreaContainerOffset}px)`
  // enProtyleCustomAreaContainerRef.value.style.width = customAreaWidth

  const customAreaHeight = `calc(${actualStyle.height} + ${enProtyleCustomAreaContainerOffset}px`
  enProtyleCustomAreaContainerRef.value.style.height = customAreaHeight
}

const moveActualAreaToCustomArea = () => {
  if (!enProtyleCustomAreaContainerRef.value || !protyleContentRef.value || !enProtyleActualAreaContainerRef.value) {
    return
  }
  const customRect = enProtyleCustomAreaContainerRef.value.getBoundingClientRect()
  const protyleRect = protyleContentRef.value.getBoundingClientRect()
  const offsetX = customRect.left - protyleRect.left + (enProtyleCustomAreaContainerOffset / 2)
  const offsetY = customRect.top - protyleRect.top + (enProtyleCustomAreaContainerOffset / 2)
  // enProtyleActualAreaContainerRef.value.style.transform = `translate(${offsetX}px, ${offsetY}px)`
  enProtyleActualAreaContainerRef.value.style.left = `${offsetX}px`
  enProtyleActualAreaContainerRef.value.style.top = `${offsetY}px`
}

const enable = () => {
  registerDom()
  watchDomChange(matchActualAreaToCustomArea)
}

const disable = () => {
  // 注销事件
  unWatchDomChange(matchActualAreaToCustomArea)

  // 删除思源移动block时拷贝的dom
  const enCustomAreaId = enProtyleCustomAreaRef.value?.dataset.enId
  const oldCustomAreaDomCopiedBySiyuan = document.querySelector(`.${enProtyleCustomAreaClassName}-${enCustomAreaId}`)
  oldCustomAreaDomCopiedBySiyuan?.remove()

  // 注销 ref
  enProtyleCustomAreaRef.value?.remove()
  enProtyleCustomAreaRef.value = null

  enProtyleCustomAreaContainerRef.value?.remove()
  enProtyleCustomAreaContainerRef.value = null

  enProtyleActualAreaRef.value?.remove()
  enProtyleActualAreaRef.value = null
  enProtyleActualAreaContainerRef.value?.remove()
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
  position: absolute;
}
</style>
