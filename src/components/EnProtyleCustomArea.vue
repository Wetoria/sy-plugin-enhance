<template>
  <!-- 在块下方渲染的占位区域 -->
  <Teleport
    v-if="enProtyleCustomAreaRef"
    :to="enProtyleCustomAreaRef"
  >
    <div
      ref="enProtyleCustomAreaContainerRef"
      class="enProtyleCustomAreaContainer enCancelShowCommentListDom"
      @mousedown="cancelMouseDown"
    >
      <slot name="customArea"></slot>
    </div>
  </Teleport>

  <template v-if="enProtyleActualAreaRef">
    <!-- 实际显示白板的区域 -->
    <Teleport :to="fullScreen === 'siyuan' ? 'body' : enProtyleActualAreaRef">
      <div
        ref="enProtyleActualAreaContainerRef"
        class="enProtyleActualAreaContainer"
        :data-en_fullscreen="fullScreen"
      >
        <slot></slot>
      </div>
    </Teleport>
  </template>
</template>

<script lang="ts">
import {
  appendTargetDomAsClassOrder,
  unWatchDomChange,
  watchDomChange,
} from '@/utils/DOM'
import { getColorStringWarn } from '@/utils/Log'
import {
  computed,
  onBeforeUnmount,
  onMounted,
  ref,
} from 'vue'

export const enProtyleCustomAreaClassName = 'enProtyleCustomArea'
export const enProtyleActualAreaClassName = 'enProtyleActualArea'
</script>

<script setup lang="ts">

const props = defineProps<IProps>()
const enProtyleCustomAreaContainerOffset = 0

let count = 0

interface IProps {
  getTargetBlockDom: () => HTMLElement
  // 主要还是文档 doc 和思源 siyuan 占满了。系统级别的还是暂时不考虑了。
  fullScreen?: 'doc' | 'siyuan' | 'system' | undefined
}

const disableAutoMatch = computed(() => !!props.fullScreen)

const enProtyleCustomAreaRef = ref<HTMLElement | null>(null)
const enProtyleCustomAreaContainerRef = ref<HTMLElement | null>(null)

const enProtyleActualAreaRef = ref<HTMLElement | null>(null)
const enProtyleActualAreaContainerRef = ref<HTMLElement | null>(null)

const protyleContentRef = ref<HTMLElement | null>(null)
defineExpose({
  protyleContentRef,
})

const registerDom = () => {
  const dom = props.getTargetBlockDom()
  if (!dom) {
    // enLog(`${getColorStringWarn('Render Protyle Custom Area Failed: ')} can not get target dom`)
    return
  }
  count++
  const enProtyleCustomAreaDom = appendTargetDomAsClassOrder(
    `${enProtyleCustomAreaClassName}-${count}`,
    dom,
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
    parent,
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
  if (disableAutoMatch.value) {
    return
  }
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

  &[data-en_fullscreen="doc"] {
    width: 100% !important;
    height: 100% !important;

    top: 0px !important;
    left: 0px !important;

    z-index: 10;
  }

  &[data-en_fullscreen="siyuan"] {
    width: 100% !important;
    height: calc(100% - 32px) !important;

    position: fixed;
    top: 32px !important;
    left: 0px !important;

    z-index: 10;
  }
}
</style>
