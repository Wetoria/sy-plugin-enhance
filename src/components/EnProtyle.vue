<template>
  <div
    ref="protyleContainerRef"
    class="EnProtyleContainer"
    :class="autoBind ? [
      blockIdValid ? 'valid' : 'invalid',
      blockId ? '' : 'no_block_id',
    ] : []"
  >
    <div
      ref="protyleRenderAreaRef"
      class="protyle_render_area"
      @keydown.capture.enter.exact="captureEnterKeyEvent"
    >
      <div></div>
    </div>
    <div
      v-if="processing"
      class="protyle_handling_prompt"
    >
      <a-tooltip>
        <a-spin
          :spinning="true"
        >
          <template #icon>
            <icon-sync />
          </template>
        </a-spin>
        <template #content>
          正在处理，请勿在此时进行其他操作
        </template>
      </a-tooltip>
    </div>
  </div>
  <Teleport
    v-if="EnProtyleUtilAreaRef && changeHelperPosition"
    :disabled="!changeHelperPosition"
    :to="EnProtyleUtilAreaRef"
  >
    <div
      ref="protyleUtilAreaRef"
      class="EnProtyleInnerUtilArea"
      :class="{
        hideGutters,
      }"
    >
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import {
  flushTransactions,
  sql,
} from '@/api'
import { usePlugin } from '@/main'
import { useEnProtyleUtilAreaRef } from '@/utils/DOM'
import { useSiyuanEventTransactions } from '@/utils/EventBusHooks'
import {
  IProtyleOptions,
  Protyle,
} from 'siyuan'
import {
  onBeforeMount,
  onBeforeUnmount,
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

  autoBind?: boolean

  // 是否隐藏思源的 gutters 元素
  hideGutters?: boolean
}>()
const emits = defineEmits<{
  after: [protyle: Protyle]
  afterRender: [protyle: Protyle]
}>()


const blockId = defineModel<string>('blockId', {
  required: true,
})


const protyleContainerRef = ref<HTMLDivElement>()
const protyleRenderAreaRef = ref<HTMLDivElement>()
const protyleRef = ref<Protyle>()


const plugin = usePlugin()

const EnProtyleUtilAreaRef = useEnProtyleUtilAreaRef()
const protyleUtilAreaRef = ref<HTMLDivElement | null>(null)
const blockIdValid = ref(false)

// 目前只移动下面四个元素
// 未来如果有观察到需要移动的元素，再继续添加
const targetProtyleUtilClassList = [
  'protyle-gutters',
  'protyle-toolbar',
  'protyle-hint',
]

const checkBlockId = async () => {
  await flushTransactions() // 防止新增块等情况下，数据库中块信息未及时更新
  const blockInfoRes = await sql(`select * from blocks where id = '${props.blockId}'`)

  if (!blockInfoRes || !blockInfoRes.length) {
    blockIdValid.value = false
    destroyProtyle()
    return
  }
  blockIdValid.value = true
}


// TODO 如果思源调整了这部分逻辑，可能需要删掉这个拦截处理
// INFO 拦截思源 Enter 未带任何修饰符的事件（仅Enter）
const captureEnterKeyEvent = (event: KeyboardEvent) => {
  if (!props.autoBind) {
    return
  }

  // 如果需要自动绑定（比如白板中），拦截一些思源内部的逻辑



  const selection = window.getSelection()
  if (!selection.rangeCount) return false

  const range = selection.getRangeAt(0)
  const isCollapsed = range.collapsed
  const isAtStart = range.startOffset === 0
  let target = range.startContainer.parentElement as HTMLElement
  target = target?.closest('[data-node-id]') as HTMLDivElement
  const firstChildOfWysiwyg = protyleRef.value?.protyle.wysiwyg.element.firstElementChild
  const isFirstChildOfWysiwyg = firstChildOfWysiwyg === target
  const isAtFirst = isCollapsed && isAtStart && isFirstChildOfWysiwyg


  // INFO 如果光标在起始位置，则不让在前方创建新行
  if (isAtFirst) {
    event.preventDefault()
    event.stopPropagation()
    event.stopImmediatePropagation()
  }
}

const destroyProtyle = () => {
  if (protyleRef.value) {
    protyleRef.value?.destroy()
    protyleRef.value = null
    if (protyleRenderAreaRef.value) {
      protyleRenderAreaRef.value.innerHTML = `<div></div>`
    }
  }
}

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

  await checkBlockId()

  if (!blockIdValid.value) {
    return
  }

  protyleRef.value?.destroy()
  protyleRef.value = new Protyle(
    plugin.app,
    protyleRenderAreaRef.value?.firstElementChild as HTMLDivElement,
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
onBeforeUnmount(() => {
  destroyProtyle()
})

watch(props, () => {
  renderProtyle()
})

defineExpose({
  protyleRef,
})

// #region 👇 监听思源的事务
// 主要是实现对块 ID 的检查

let offTransactionEvent = null // 定义事务监听清理函数
onMounted(() => {
  offTransactionEvent = useSiyuanEventTransactions(handleTransaction)
})
onBeforeMount(() => {
  if (offTransactionEvent) {
    offTransactionEvent()
  }
})

const processing = ref(false)

const removeNodeCreatedByOther = (event) => {
  const {
    detail,
  } = event || {}

  const {
    sid,
  } = detail

  const currentProtyleId = protyleRef.value?.protyle?.id

  const wysiwygElement = protyleRef.value?.protyle?.wysiwyg.element
  if (!wysiwygElement) {
    return
  }
  const children = Array.from(wysiwygElement?.children) as HTMLElement[]
  const isOtherProtyleEvent = sid !== currentProtyleId
  console.log('isOtherProtyleEvent is ', isOtherProtyleEvent)

  // 如果是当前 protyle 的事件，则不进行处理
  if (!isOtherProtyleEvent) {
    return
  }

  const {
    data,
  } = detail
  const {
    doOperations = [],
  } = data[0]
  console.log('doOperations is ', doOperations)


  doOperations.forEach((operation) => {
    const {
      action,
      id,
    } = operation

    const isAddContentIntoProtyle = ['insert', 'move'].includes(action)
    console.log('isAddContentIntoProtyle is ', isAddContentIntoProtyle, action)

    if (isAddContentIntoProtyle) {
      let target = null
      let targetIndex = -1
      children.forEach((child, index) => {
        if (child.dataset.nodeId === id) {
          target = child
          targetIndex = index
        }
      })
      console.log('target is ', target, 'targetIndex is ', targetIndex)
      if (!target) {
        // 如果目标节点不存在，则不进行处理
        return
      }
      if (targetIndex <= 0) {
        // 如果插入后是第一个块，则不进行处理
        return
      }
      target.remove()
    }
  })
}

const handleTransaction = async (event) => {

  if (!props.blockId) {
    // 如果块 ID 为空，则不进行处理
    return
  }

  if (!props.autoBind) {
    // 如果 autoBind 为 false，则不进行处理
    return
  }

  // 如果被其他 protyle 新增了块，需要删除
  // 为了防止页面“闪烁”，只能在这里进行处理
  setTimeout(() => {
    removeNodeCreatedByOther(event)
  }, 0)
  setTimeout(() => {
    removeNodeCreatedByOther(event)
  }, 10)

}

// #endregion 👆 监听思源的事务
</script>

<style lang="scss" scoped>
.EnProtyleContainer {
  width: 100%;
  height: 100%;

  .protyle_render_area {
    width: 100%;
    height: 100%;
  }

  .protyle_handling_prompt {
    position: absolute;
    bottom: 8px;
    right: 8px;
    z-index: 1;
  }

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
      padding-right: 8px !important;
      padding-bottom: 64px !important;
    }
  }

  &.invalid,
  &.no_block_id {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;

    .protyle_render_area {
      display: none;
    }

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

.EnProtyleInnerUtilArea {
  &.hideGutters {
    :deep(.protyle-gutters) {
      display: none !important;
    }
  }
}
</style>
