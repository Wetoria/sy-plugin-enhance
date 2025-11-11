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

  <template
    v-if="renderActualArea"
  >
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
import {
  enLog,
  enWarn,
  getColorStringWarn,
} from '@/utils/Log'
import {
  computed,
  onBeforeUnmount,
  onMounted,
  ref,
  useSlots,
} from 'vue'

export const enProtyleCustomAreaClassName = 'enProtyleCustomArea'
export const enProtyleActualAreaClassName = 'enProtyleActualArea'

let count = 0
</script>

<script setup lang="ts">

const props = defineProps<IProps>()
const enProtyleCustomAreaContainerOffset = 0

interface IProps {
  name?: string
  // 获取占位元素要插入的目标DOM（必填）
  getPlaceholderTargetDom: () => HTMLElement | null
  // 获取实际元素要插入的目标DOM（必填，如果有 default slot）
  getActualTargetDom?: () => HTMLElement | null
  // 获取实际容器的参考DOM，用于计算位置（可选，如果不提供则使用 getActualTargetDom 的结果）
  getActualContainerDom?: () => HTMLElement | null
  // 主要还是文档 doc 和思源 siyuan 占满了。系统级别的还是暂时不考虑了。
  fullScreen?: 'doc' | 'siyuan' | 'system' | undefined
}

const disableAutoMatch = computed(() => !!props.fullScreen)

const enProtyleCustomAreaRef = ref<HTMLElement | null>(null)
const enProtyleCustomAreaContainerRef = ref<HTMLElement | null>(null)

const enProtyleActualAreaRef = ref<HTMLElement | null>(null)
const enProtyleActualAreaContainerRef = ref<HTMLElement | null>(null)

const slots = useSlots()

const hasDefaultSlot = computed(() => !!slots.default)
const hasCustomAreaSlot = computed(() => !!slots.customArea)
const bothDefaultAndCustomSlot = computed(() => hasDefaultSlot.value && hasCustomAreaSlot.value)

const renderActualArea = computed(() => {
  return hasDefaultSlot.value && enProtyleActualAreaRef.value && enProtyleCustomAreaRef.value
})

const protyleContentRef = ref<HTMLElement | null>(null)
defineExpose({
  protyleContentRef,
})

const registerDom = () => {
  // 获取占位元素的目标DOM
  const placeholderTargetDom = props.getPlaceholderTargetDom()
  if (!placeholderTargetDom) {
    enWarn(`${getColorStringWarn('Render Placeholder Area Failed: ')} can not get placeholder target dom`)
    return
  }

  count++

  // 注册占位区域
  const enProtyleCustomAreaDom = appendTargetDomAsClassOrder(
    `${enProtyleCustomAreaClassName}-${count}`,
    placeholderTargetDom,
    {
      needCustomClass: true,
    },
  )
  const isSameDom = enProtyleCustomAreaDom === enProtyleCustomAreaRef.value
  if (isSameDom) {
    enLog(`${getColorStringWarn('No need to update Placeholder Area: ')} is same dom`)
    return
  }
  enProtyleCustomAreaDom.classList.add(enProtyleCustomAreaClassName)
  if (props.name) {
    enProtyleCustomAreaDom.classList.add(props.name)
  }
  enProtyleCustomAreaDom.dataset.enTargetNodeId = placeholderTargetDom.dataset.nodeId
  enProtyleCustomAreaDom.dataset.enId = `${count}`
  enProtyleCustomAreaRef.value = enProtyleCustomAreaDom

  // 如果没有 default slot，不需要注册实际区域
  if (!hasDefaultSlot.value) {
    return
  }

  // 获取实际元素的目标DOM
  const actualTargetDom = props.getActualTargetDom?.()
  if (!actualTargetDom) {
    enWarn(`${getColorStringWarn('Render Actual Area Failed: ')} getActualTargetDom is required when using default slot`)
    return
  }

  // 设置 protyleContentRef（用于位置计算）
  protyleContentRef.value = props.getActualContainerDom?.() || actualTargetDom

  // 注册实际区域
  const enProtyleActualDom = appendTargetDomAsClassOrder(
    `${enProtyleActualAreaClassName}-${count}`,
    actualTargetDom,
  )
  enProtyleActualDom.classList.add(enProtyleActualAreaClassName)
  if (props.name) {
    enProtyleActualDom.classList.add(props.name)
  }
  enProtyleActualDom.dataset.enTargetNodeId = placeholderTargetDom.dataset.nodeId
  enProtyleActualDom.dataset.enId = `${count}`
  enProtyleActualAreaRef.value = enProtyleActualDom
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

  // 检查父元素是否隐藏，只在值改变时更新 display
  const hiddenParent = enProtyleCustomAreaContainerRef.value?.closest('.fn__none')
  const shouldHide = !!hiddenParent

  if (shouldHide) {
    enProtyleActualAreaContainerRef.value.style.opacity = '0'
    enProtyleActualAreaContainerRef.value.style.pointerEvents = 'none'
  } else {
    enProtyleActualAreaContainerRef.value.style.opacity = '1'
    enProtyleActualAreaContainerRef.value.style.pointerEvents = 'auto'
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
  if (bothDefaultAndCustomSlot.value) {
    enWarn(`Please don't use both default and custom slot at the same time`)
  }

  // 验证必要的 props
  if (!props.getPlaceholderTargetDom) {
    enWarn(`${getColorStringWarn('EnProtyleShadowArea: ')} getPlaceholderTargetDom is required`)
    return
  }

  if (hasDefaultSlot.value && !props.getActualTargetDom) {
    enWarn(`${getColorStringWarn('EnProtyleShadowArea: ')} getActualTargetDom is required when using default slot`)
    return
  }

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
