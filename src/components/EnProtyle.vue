<template>
  <div
    ref="protyleContainerRef"
    class="EnProtyleContainer"
    :class="auto ? [
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
      class="protyle_handling_prompt flexCenter"
    >
      <span>
        正在更新卡片绑定的块 id，请勿进行其他操作
      </span>
      <a-spin
        :spinning="true"
      >
        <template #icon>
          <icon-sync />
        </template>
      </a-spin>
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
  deleteBlock,
  flushTransactions,
  getBlockInfo,
  sql,
} from '@/api'
import { usePlugin } from '@/main'
import { debounce } from '@/utils'
import { useEnProtyleUtilAreaRef } from '@/utils/DOM'
import { useSiyuanEventTransactions } from '@/utils/EventBusHooks'
import { mergeElementsIntoSuperBlock, SyDomNodeTypes, waitingForSuperBlockIndexCommited } from '@/utils/Siyuan'
import {
  IProtyleOptions,
  Protyle,
} from 'siyuan'
import {
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

  auto?: boolean

  // 是否隐藏思源的 gutters 元素
  hideGutters?: boolean
}>()
const emits = defineEmits<{
  after: [protyle: Protyle]
  afterRender: [protyle: Protyle]
  updated: [blockId: string, type: 'delete' | 'move' | 'update']
  moved: [parentId: string]
}>()


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
  if (!props.auto) {
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

const renderProtyle = async (id?: string) => {
  const newId = id || props.blockId

  if (!newId) {
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

  const blockId = newId

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

// 监听 blockId 的变化，重新渲染 protyle
watch(() => props.blockId, () => {
  renderProtyle()
})

defineExpose({
  protyleRef,
})

// #region 👇 监听思源的事务
// 主要是实现对块 ID 的检查

let offTransactionEvent = null // 定义事务监听清理函数
onMounted(() => {
  if (props.auto) {
    offTransactionEvent = useSiyuanEventTransactions(handleTransaction)
  }
})
onBeforeUnmount(() => {
  if (offTransactionEvent) {
    offTransactionEvent()
  }
})

const processing = ref(false)


const deletedFlag = ref(false)
const movedFlag = ref(false)


const needRemovedBlockIds = ref([])
const needRemovedBlockIdsInterval = ref(null)
const removeBlocksCreatedByOtherProtyle = () => {
  needRemovedBlockIdsInterval.value = setInterval(() => {

    if (!needRemovedBlockIds.value.length) {
      clearInterval(needRemovedBlockIdsInterval.value)
      return
    }

    const wysiwygElement = protyleRef.value?.protyle?.wysiwyg.element
    if (!wysiwygElement) {
      return
    }

    let firstLevelChildren = Array.from(wysiwygElement?.children) as HTMLElement[]
    firstLevelChildren = firstLevelChildren.filter((item) => item.dataset.nodeId)

    needRemovedBlockIds.value.forEach((needRemovedBlockId) => {
      const target = firstLevelChildren.find((child) => child.dataset.nodeId === needRemovedBlockId)
      if (target) {
        target.remove()
        needRemovedBlockIds.value = needRemovedBlockIds.value.filter((id) => id !== needRemovedBlockId)
      }
    })
  })
}
onBeforeUnmount(() => {
  if (needRemovedBlockIdsInterval.value) {
    clearInterval(needRemovedBlockIdsInterval.value)
  }
})


const checkAndMerge = () => {
  processing.value = true
  const finished = () => {
    processing.value = false
  }

  const isDocProtyle = protyleRef.value?.protyle.wysiwyg.element.dataset.docType === SyDomNodeTypes.NodeDocument
  // 如果当前是文档类型，则放弃合并
  if (isDocProtyle) {
    finished()
    return
  }

  const wysiwygElement = protyleRef.value?.protyle?.wysiwyg.element

  let firstLevelNodeChildren = Array.from(wysiwygElement?.children) as HTMLElement[]
  firstLevelNodeChildren = firstLevelNodeChildren.filter((item) => item.dataset.nodeId)
  const firstNode = firstLevelNodeChildren[0]

  const isOnlyOne = firstLevelNodeChildren.length === 1
  if (isOnlyOne) {
    const nodeId = firstLevelNodeChildren[0].dataset.nodeId
    const isSame = nodeId === props.blockId
    if (!isSame) {
      // 如果当前块 ID 和第一个子块的 ID 不一致，则更新当前块 ID
      emits('updated', nodeId, 'update')
    }

    finished()
    return
  }

  const firstNodeIsHeading = firstNode.dataset.type === SyDomNodeTypes.NodeHeading
  if (firstNodeIsHeading) {
    const headingNodeId = firstNode.dataset.nodeId
    emits('updated', headingNodeId, 'update')
    finished()
    return
  }

  const superBlockId = mergeElementsIntoSuperBlock(protyleRef.value, firstLevelNodeChildren)
  waitingForSuperBlockIndexCommited(() => {
    emits('updated', superBlockId, 'update')
    finished()
  })
}

const checkAndMergeIntervalFlag = ref(null)
// 应该不需要判断当前 protyle 是不是正在编辑了
// 在 handleTransaction 中已经判断过了
// 如果以后有问题的话，再另外处理了
const waitingToCheckAndMergeBlocks = debounce(() => {
  if (checkAndMergeIntervalFlag.value) {
    // 如果已经在处理中了，取消之前的等待
    clearInterval(checkAndMergeIntervalFlag.value)
  }

  checkAndMergeIntervalFlag.value = setInterval(() => {
    if (needRemovedBlockIds.value.length || movedFlag.value || deletedFlag.value) {
      return
    }

    clearInterval(checkAndMergeIntervalFlag.value)

    // 检查并合并块
    checkAndMerge()
  }, 0)
// }, 1000 * 30) // 停止编辑 30s 后检查并合并块
}) // 停止编辑 30s 后检查并合并块
onBeforeUnmount(() => {
  if (checkAndMergeIntervalFlag.value) {
    clearInterval(checkAndMergeIntervalFlag.value)
  }
  waitingToCheckAndMergeBlocks.cancel()
})


const handleBlockWithOtherProtyle = (event) => {
  const {
    detail,
  } = event || {}

  const wysiwygElement = protyleRef.value?.protyle?.wysiwyg.element
  if (!wysiwygElement) {
    return
  }

  const {
    data,
  } = detail
  const {
    doOperations = [],
  } = data[0]


  doOperations.forEach((operation) => {
    const {
      action,
      id,
      parentID,
      previousID,
    } = operation

    // 当前块被删除
    if (id === props.blockId) {
      if (action === 'delete') {
        // 标记当前 protyle 绑定的块已被删除
        deletedFlag.value = true
        return
      }

      // 当前块被移动
      if (action === 'move') {
        movedFlag.value = true

        if (!previousID) {
          // 如果 previousID 为空，则说明当前块是父块的第一个子块
          // parentId 就是新的父块 ID
          emits('moved', parentID)

          // 不能销毁当前的 protyle，否则不能监听到后续自动新增块的逻辑
          // destroyProtyle()
          renderProtyle(parentID)
          return
        }

        getParentBlockId(previousID)
        return
      }

      return
    }


    const isAddContentIntoProtyle = ['insert', 'move'].includes(action)

    if (isAddContentIntoProtyle) {
      // 记录下需要从 EnProtyle 中移除的块
      needRemovedBlockIds.value.push(id)
    }
  })
  removeBlocksCreatedByOtherProtyle()
}

const removeAutoCreatedBlock = (detail) => {
  const operation = detail.data[0].doOperations[0]
  // 当前块在其他地方被删除了，需要删除新创建的空块，并标记 protyle 无效
  if (operation.action === 'insert' && detail.data[0].doOperations.length === 1) {
    blockIdValid.value = false
    destroyProtyle()
    emits('updated', '', 'delete')
    deleteBlock(operation.id)
  }
}

const getParentBlockId = async (id: string) => {
  const blockInfo = await getBlockInfo(id)
  const parentIsNotDoc = blockInfo.parent_id !== blockInfo.root_id

  if (blockInfo.parent_id && parentIsNotDoc) {
    emits('updated', blockInfo.parent_id, 'move')
    emits('moved', blockInfo.parent_id)
    renderProtyle(blockInfo.parent_id)
  } else {
    renderProtyle(props.blockId)
  }
}

const handleTransaction = (event) => {
  if (!props.blockId) {
    // 如果块 ID 为空，则不进行处理
    return
  }

  if (!props.auto) {
    // 如果 auto 为 false，则不进行处理
    return
  }

  const { detail } = event

  const isCurrentAppEvent = detail.app === protyleRef.value?.protyle.app.appId
  const isCurrentProtyleEvent = detail.sid === protyleRef.value?.protyle?.id


  if (!isCurrentAppEvent) {
    // 证明是伺服其他端的思源触发的，不进行处理
    // 比如多人协作的场景
    // 用户 A 在伺服本体的electron中使用
    // 用户 B 在伺服的web中使用
    // 假如 B 编辑了，在 A 这里，不应该处理，以用户 B 输入的内容为准
    return
  }

  // FIXME 跨端的时候，其他端如果在某个卡片的块后增加了块，不会被清理掉
  if (!isCurrentProtyleEvent) {
    // 如果是其他编辑器中操作的事件，则需要进行一些处理
    // 比如删除其他编辑器中新增的块
    handleBlockWithOtherProtyle(event)
    return
  }

  if (deletedFlag.value) {
    removeAutoCreatedBlock(detail)
    deletedFlag.value = false
    return
  }

  if (movedFlag.value) {
    removeAutoCreatedBlock(detail)
    return
  }

  // 剩余的情况则是需要判断并记录当前 protyle 中的块 ID
  waitingToCheckAndMergeBlocks()
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

    & * {
      color: rgba(240, 182, 34, 1) !important;
    }
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
