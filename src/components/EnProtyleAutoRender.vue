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
      minHeight: `${containerMinHeight}px`,
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
import { getBlockDOM } from '@/api'
import { usePlugin } from '@/main'
import { debounce } from '@/utils'
import {
  useElementVisibility,
  useResizeObserver,
} from '@vueuse/core'
import {
  IProtyleOptions,
  Protyle,
} from 'siyuan'
import {
  onBeforeUnmount,
  onMounted,
  ref,
  watch
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
    action,
    render,
    ...rest
  } = options

  destroyProtyle()
  protyleRef.value = new Protyle(
    plugin.app,
    protyleRenderAreaRef.value?.firstElementChild as HTMLDivElement,
    {
      blockId: blockId || props.blockId,
      action: action || ['cb-get-focus'],
      render: {
        breadcrumb: false,
        ...render,
      },
      after(protyle: Protyle) {
        if (props.disableEnhance) {
          protyle.protyle.element.classList.toggle('EnDisableProtyleEnhance', true)
          protyle.protyle.contentElement.classList.toggle('EnDisableProtyleEnhance', true)
        }
        emits('after', protyle)
      },
      ...rest,
    },
  )
  emits('afterRender', protyleRef.value)
}

const blockDom = ref<string>()
const containerMinHeight = ref(0)
const getBlockDomForBlockId = async (blockId: string) => {
  const blockDomRes = await getBlockDOM(blockId)
  blockDom.value = blockDomRes.dom
  updateProtyleMinHeight()
}
const updateProtyleMinHeight = debounce(() => {
  const div = document.createElement('div')
  div.innerHTML = `
    <div class="protyle">
      <div class="protyle-content">
        <div class="protyle-wysiwyg">
          ${blockDom.value}
        </div>
      </div>
    </div>
  `
  div.style.opacity = '0'
  const protyleDom = div.firstElementChild as HTMLDivElement

  // 插入并获取 protyle 内容的高度
  protyleRenderAreaRef.value?.appendChild(div)
  containerMinHeight.value = protyleDom.clientHeight

  // 计算完成，移除 protyle 的 html
  protyleRenderAreaRef.value?.removeChild(div)
})

useResizeObserver(protyleContainerRef, () => {
  updateProtyleMinHeight()
})


const containerIsVisible = useElementVisibility(protyleContainerRef)
watch(containerIsVisible, () => {
  if (containerIsVisible.value) {
    renderProtyle()
  } else {
    destroyProtyle()
  }
})

onMounted(() => {
  getBlockDomForBlockId(props.blockId)
})

watch(props, () => {
  getBlockDomForBlockId(props.blockId)
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
