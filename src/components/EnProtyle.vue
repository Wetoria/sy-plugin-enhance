<template>
  <div
    ref="protyleContainerRef"
    class="EnProtyleContainer"
    :class="[
      blockIdValid ? 'valid' : 'invalid',
      blockId ? '' : 'no_block_id',
    ]"
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
import { sql } from '@/api'
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

  options?: Omit<IProtyleOptions, 'blockId'>
}>()
const emits = defineEmits<{
  after: [protyle: Protyle]
  afterRender: [protyle: Protyle]
}>()
const protyleContainerRef = ref<HTMLDivElement>()
const protyleRef = ref<Protyle>()

const destroyProtyle = () => {
  if (protyleRef.value) {
    protyleRef.value?.destroy()
    protyleRef.value = null
    if (protyleContainerRef.value) {
      protyleContainerRef.value.innerHTML = `<div></div>`
    }
  }
}

const plugin = usePlugin()

const EnProtyleUtilAreaRef = useEnProtyleUtilAreaRef()
const protyleUtilAreaRef = ref<HTMLDivElement | null>(null)
const blockIdValid = ref(false)

// 目前只移动下面四个元素
// 未来如果有观察到需要移动的元素，再继续添加
const targetProtyleUtilClassList = [
  'protyle-gutters',
  'protyle-select',
  'protyle-toolbar',
  'protyle-hint',
]

const renderProtyle = async () => {
  if (!props.blockId) {
    destroyProtyle()
    return
  }
  const {
    options = {},
  } = props

  const {
    action,
    render,
    ...rest
  } = options

  const blockId = props.blockId

  const blockInfoRes = await sql(`select * from blocks where id = '${blockId}'`)

  if (!blockInfoRes || !blockInfoRes.length) {
    blockIdValid.value = false
    destroyProtyle()
    return
  }

  blockIdValid.value = true
  protyleRef.value?.destroy()
  protyleRef.value = new Protyle(
    plugin.app,
    protyleContainerRef.value?.firstElementChild as HTMLDivElement,
    {
      blockId,
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

  &.invalid,
  &.no_block_id {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;

    &.invalid {
      &::before {
        content: '块 ID 无效';
      }
    }

    &.no_block_id {
      &::before {
        content: '未绑定块 ID';
      }
    }
  }
}
</style>
