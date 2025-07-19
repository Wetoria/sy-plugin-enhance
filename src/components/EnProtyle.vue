<!-- 基本的 Protyle 渲染组件 -->
<!-- 只根据传入的 blockId 进行渲染 -->
<template>
  <div
    ref="protyleContainerRef"
    class="EnProtyleContainer"
  >
    <div></div>
  </div>
</template>

<script setup lang="ts">
import { usePlugin } from '@/main'
import {
  IProtyleOptions,
  Protyle,
} from 'siyuan'
import {
  onMounted,
  ref,
  watch,
} from 'vue'


const props = defineProps<{
  blockId: string
  disableEnhance?: boolean
  options?: IProtyleOptions
  appendEmptyBlock?: boolean
}>()
const emits = defineEmits<{
  after: [protyle: Protyle]
  afterRender: [protyle: Protyle]
}>()
const protyleContainerRef = ref<HTMLDivElement>()
const protyleRef = ref<Protyle>()

const plugin = usePlugin()

const renderProtyle = () => {
  if (!props.blockId) {
    protyleRef.value?.destroy()
    protyleRef.value = null
    if (protyleContainerRef.value) {
      protyleContainerRef.value.innerHTML = `<div></div>`
    }
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

  protyleRef.value = new Protyle(
    plugin.app,
    protyleContainerRef.value?.firstElementChild as HTMLDivElement,
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


        if (props.appendEmptyBlock) {
          // #region 👇 插入一个空的元素，防止删除了最后一个块以后，思源自动创建新块
          const div = document.createElement('div')
          div.classList.add('EnProtyleAutoEmptyBlock')
          div.classList.add('protyle-custom')
          protyle.protyle.wysiwyg.element.append(div)
          // #endregion 👆 插入一个空的元素，防止删除了最后一个块以后，思源自动创建新块
        }


        emits('after', protyle)
      },
      ...rest,
    },
  )
  emits('afterRender', protyleRef.value)
}

onMounted(() => {
  renderProtyle()
})

watch(props, () => {
  renderProtyle()
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
