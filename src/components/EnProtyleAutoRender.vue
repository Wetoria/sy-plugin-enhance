<!-- 基本的 Protyle 渲染组件 -->
<!-- 只根据传入的 blockId 进行渲染 -->
<template>
  <div
    ref="protyleContainerRef"
    class="fullContent EnProtyleContainer"
    :class="{
      EnProtyleContainerVisible: containerIsVisible,
    }"
    :style="{
      minHeight: `${contentHeight}px`,
    }"
  >
    <div
      ref="protyleRenderAreaRef"
      class="fullContent EnProtyleRenderArea"
    >
      <div></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useProtyleContentHeight } from '@/components/EnProtyle/useProtyleContentHeight'
import { usePlugin } from '@/main'
import {
  useElementVisibility,
} from '@vueuse/core'
import {
  IProtyleOptions,
  Protyle,
} from 'siyuan'
import {
  onBeforeUnmount,
  ref,
  watch,
} from 'vue'


const props = defineProps<{
  blockId: string
  disableEnhance?: boolean
  options?: IProtyleOptions
}>()
const emits = defineEmits<{
  after: [protyle: Protyle]
  afterRender: [protyle: Protyle]
}>()
const protyleContainerRef = ref<HTMLDivElement>()
const protyleRenderAreaRef = ref<HTMLDivElement>()
const protyleRef = ref<Protyle>()

const plugin = usePlugin()


const containerIsVisible = useElementVisibility(protyleContainerRef)
const {
  contentHeight,
  startResizeObserver,
  stopResizeObserver,
} = useProtyleContentHeight({
  blockId: props.blockId,
  containerRef: protyleContainerRef,
  renderAreaRef: protyleRenderAreaRef,
  onResize: (size) => {
    if (containerIsVisible.value) {
      contentHeight.value = size.height
    }
  },
})


const destroyProtyle = () => {
  protyleRef.value?.destroy()
  protyleRef.value = null
  if (protyleRenderAreaRef.value) {
    protyleRenderAreaRef.value.innerHTML = `<div></div>`
  }
}
onBeforeUnmount(() => {
  destroyProtyle()
})

const renderProtyle = () => {
  if (!props.blockId) {
    destroyProtyle()
    return
  }
  const {
    options = {},
  } = props

  const {
    blockId,
    render,
    ...rest
  } = options

  destroyProtyle()
  protyleRef.value = new Protyle(
    plugin.app,
    protyleRenderAreaRef.value?.firstElementChild as HTMLDivElement,
    {
      blockId: blockId || props.blockId,
      action: ['cb-get-all'],
      render: {
        breadcrumb: false,
        ...render,
      },
      after(protyle: Protyle) {
        if (props.disableEnhance) {
          protyle.protyle.element.classList.toggle('EnDisableProtyleEnhance', true)
          protyle.protyle.contentElement.classList.toggle('EnDisableProtyleEnhance', true)
        }
        startResizeObserver()
        emits('after', protyle)
      },
      ...rest,
    },
  )
  emits('afterRender', protyleRef.value)
}


watch(containerIsVisible, () => {
  if (containerIsVisible.value) {
    renderProtyle()
  } else {
    stopResizeObserver()
    destroyProtyle()
  }
})

defineExpose({
  protyleRef,
})

</script>

<style lang="scss" scoped>
.EnProtyleContainer {
  width: 100%;
  height: 100%;

  :deep(.protyle) {
    min-height: 100%;

    .protyle-content {
      padding-bottom: 16px;
    }

    .protyle-wysiwyg {
      width: 100%;
      min-height: 100%;
      box-sizing: border-box;
      padding: 16px 16px !important;
      padding-bottom: 64px !important;
    }
  }
}
</style>
