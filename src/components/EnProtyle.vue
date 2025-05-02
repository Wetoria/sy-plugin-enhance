<template>
  <div
    ref="protyleContainerRef"
    class="EnProtyleContainer"
  >
    <div></div>
  </div>
  <Teleport
    v-if="EnProtyleUtilAreaRef && changeHelperPosition"
    :disabled="!changeHelperPosition"
    :to="EnProtyleUtilAreaRef"
  >
    <div
      ref="protyleUtilAreaRef"
    >
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { usePlugin } from '@/main'
import { useEnProtyleUtilAreaRef } from '@/utils/DOM'
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

  // 是否改变 protyle-hint、protyle-gutters 等思源 protyle 自带元素的位置
  // 防止在 transform 内部使用 protyle 时，这些元素不能正确定位的问题
  changeHelperPosition?: boolean

  options?: IProtyleOptions
}>()
const emits = defineEmits<{
  after: [protyle: Protyle]
  afterRender: [protyle: Protyle]
}>()
const protyleContainerRef = ref<HTMLDivElement>()
const protyleRef = ref<Protyle>()

const plugin = usePlugin()

const EnProtyleUtilAreaRef = useEnProtyleUtilAreaRef()
const protyleUtilAreaRef = ref<HTMLDivElement | null>(null)

// 目前只移动下面四个元素
// 未来如果有观察到需要移动的元素，再继续添加
const targetProtyleUtilClassList = [
  'protyle-gutters',
  'protyle-select',
  'protyle-toolbar',
  'protyle-hint',
]

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
        if (props.changeHelperPosition) {
          targetProtyleUtilClassList.forEach((className) => {
            const target = protyle.protyle.element.querySelector(`.${className}`)
            if (target) {
              protyleUtilAreaRef.value?.appendChild(target)
            }
          })
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
      padding-bottom: 0;
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
