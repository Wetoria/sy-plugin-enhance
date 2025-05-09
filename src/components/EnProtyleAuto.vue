<!-- 增强的 Protyle 渲染组件 -->
<!-- 主要是为了解决白板等场景下，需要将内部的块转换为对应的容器块 -->
<!-- 使得绑定的块 ID 唯一，保证后续能正确渲染对应的内容 -->
<template>
  <div
    ref="protyleContainerRef"
    class="EnProtyleContainer"
    :class="auto ? [
      blockIdValid ? 'valid' : 'invalid',
      blockId ? '' : 'no_block_id',
    ] : []"
    :data-en_invalid_msg="invalidMsg"
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
  flushTransactions,
  getBlockInfo,
  sql,
} from '@/api'
import { usePlugin } from '@/main'
import { debounce } from '@/utils'
import { useEnProtyleUtilAreaRef } from '@/utils/DOM'
import { useSiyuanEventTransactions } from '@/utils/EventBusHooks'
import {
  mergeElementsIntoSuperBlock,
  SyDomNodeTypes,
  SyNodeTypes,
  waitingForSuperBlockIndexCommited,
} from '@/utils/Siyuan'
import dayjs from 'dayjs'
import {
  IOperation,
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

  auto?: boolean

  // 是否隐藏思源的 gutters 元素
  hideGutters?: boolean
}>()



const emits = defineEmits<{
  after: [protyle: Protyle]
  afterRender: [protyle: Protyle]
  updated: [blockId: string, type: 'after_delete' | 'after_move' | 'after_merge']
}>()

const emitBlockIdUpdated = (blockId: string, type: 'after_delete' | 'after_move' | 'after_merge') => {
  if (blockId === props.blockId) {
    return
  }
  destroyProtyle()
  innerUpdated.value = true
  emits('updated', blockId, type)

  renderProtyle(blockId)
}


const protyleContainerRef = ref<HTMLDivElement>()
const protyleRenderAreaRef = ref<HTMLDivElement>()
const protyleRef = ref<Protyle>()


const plugin = usePlugin()

const EnProtyleUtilAreaRef = useEnProtyleUtilAreaRef()
const protyleUtilAreaRef = ref<HTMLDivElement | null>(null)



const blockIdValid = ref(false)
const invalidMsg = ref('')
const setBlockIdValid = (valid: boolean, msg?: string) => {
  blockIdValid.value = valid
  invalidMsg.value = msg
}



// 目前只移动下面的元素
// 未来如果有观察到需要移动的元素，再继续添加
const targetProtyleUtilClassList = [
  'protyle-gutters',
  'protyle-toolbar',
  'protyle-hint',
]

const currentBlockInfo = ref(null)
const checkBlockId = async () => {
  await flushTransactions() // 防止新增块等情况下，数据库中块信息未及时更新
  const blockInfoRes = await sql(`select * from blocks where id = '${props.blockId}'`)

  if (!blockInfoRes || !blockInfoRes.length) {
    setBlockIdValid(false, `未找到ID为 ${props.blockId} 的块`)

    currentBlockInfo.value = null
    destroyProtyle()
    return
  }
  currentBlockInfo.value = blockInfoRes[0]
  setBlockIdValid(true)
}


// NOTICE 如果思源调整了这部分逻辑，可能需要删掉这个拦截处理
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

const focusBlockId = ref('')
const focusByBlockIdWhenAfterRender = (id: string) => {
  focusBlockId.value = id
}

const renderProtyle = async (id?: string) => {
  const newId = id || props.blockId

  destroyProtyle()
  if (!newId) {
    setBlockIdValid(false, '未绑定块 ID')
    return
  }

  const blockId = newId

  await flushTransactions()
  await checkBlockId()

  if (!blockIdValid.value) {
    return
  }

  protyleRef.value = new Protyle(
    plugin.app,
    protyleRenderAreaRef.value?.firstElementChild as HTMLDivElement,
    {
      blockId,
      action: ['cb-get-all'],
      render: {
        breadcrumb: false,
      },
      debugger: true,
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

        // #region 👇 插入一个空的元素，防止删除了最后一个块以后，思源自动创建新块
        const div = document.createElement('div')
        div.classList.add('EnProtyleAutoEmptyBlock')
        div.classList.add('protyle-custom')
        protyle.protyle.wysiwyg.element.append(div)
        // #endregion 👆 插入一个空的元素，防止删除了最后一个块以后，思源自动创建新块

        if (focusBlockId.value) {
          protyle.focusBlock(protyle.protyle.element.querySelector(`[data-node-id="${focusBlockId.value}"]`), false)
          focusBlockId.value = ''
        }


        emits('after', protyle)
      },
    },
  )
  emits('afterRender', protyleRef.value)
  if (innerUpdated.value) {
    innerUpdated.value = false
  }
}

onMounted(() => {
  renderProtyle()
})
onBeforeUnmount(() => {
  destroyProtyle()
})

const innerUpdated = ref(false)
watch(() => props.blockId, () => {
  if (innerUpdated.value) {
    innerUpdated.value = false
    return
  }
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

const topIsDoc = () => {
  return protyleRef.value?.protyle?.wysiwyg?.element?.dataset?.docType === SyDomNodeTypes.NodeDocument
}

const topIsHeading = () => {
  const wysiwygTypeIsHeading = protyleRef.value?.protyle?.wysiwyg?.element?.dataset?.type === SyDomNodeTypes.NodeHeading
  const wysiwygElement = protyleRef.value?.protyle?.wysiwyg?.element
  if (!wysiwygElement) {
    return false
  }

  let firstLevelNodeChildren = Array.from(wysiwygElement?.children) as HTMLElement[]
  firstLevelNodeChildren = firstLevelNodeChildren.filter((item) => item.dataset.nodeId)
  const firstNode = firstLevelNodeChildren[0]
  if (!firstNode) {
    return false
  }
  const firstNodeIsHeading = firstNode.dataset.type === SyDomNodeTypes.NodeHeading
  return wysiwygTypeIsHeading || firstNodeIsHeading
}




// #region 👇 移除protyle中，其他protyle创建的块


const needRemovedBlockIds = ref([])
const needRemovedBlockIdsInterval = ref(null)
const initRemoveTime = ref()
const removeIdInList = (id: string) => {
  needRemovedBlockIds.value = needRemovedBlockIds.value.filter((item) => item !== id)
}


const recordNeedRemovedBlockDomIds = (operations: IOperation[]) => {
  // 记录下需要从 EnProtyle 中移除的块
  operations.forEach((operation) => {
    const {
      action,
      id,
      parentID,
      previousID,
      nextID,
    } = operation

    const isOtherBlock = id !== props.blockId
    const isAddContentIntoProtyle = ['insert', 'move'].includes(action)
    const insertToSameParent = (!previousID && !nextID) && parentID === currentBlockInfo.value.parent_id
    const isOtherBlockNearCurrentBlock = previousID === props.blockId || nextID === props.blockId || insertToSameParent

    // 记录下插入到当前块前后的块
    if (isOtherBlock && isAddContentIntoProtyle && isOtherBlockNearCurrentBlock) {
      // 记录下需要从 EnProtyle 中移除的块
      needRemovedBlockIds.value.push(id)
    }
  })

  removeBlocksCreatedByOtherProtyle()
}

const removeBlocksCreatedByOtherProtyle = () => {
  const isDocOrHeading = topIsDoc() || topIsHeading()
  if (isDocOrHeading) {
    return
  }
  initRemoveTime.value = dayjs()
  needRemovedBlockIdsInterval.value = setInterval(() => {

    if (!needRemovedBlockIds.value.length || dayjs().diff(initRemoveTime.value, 'seconds') > 2) {
      clearInterval(needRemovedBlockIdsInterval.value)
      return
    }

    const wysiwygElement = protyleRef.value?.protyle?.wysiwyg.element
    if (!wysiwygElement) {
      return
    }

    let firstLevelChildren = Array.from(wysiwygElement?.children) as HTMLElement[]
    // 只移除 protyle 中顶层被其他地方插入的块
    // 这样如果顶层是容器块的话，容器块内部创建的块会保留下来
    // INFO 实际上在记录的时候已经判断了是不是当前块前后，但是为了稳定，还是在这里做一个顶层过滤
    firstLevelChildren = firstLevelChildren.filter((item) => item.dataset.nodeId)

    needRemovedBlockIds.value.forEach((needRemovedBlockId) => {
      if (needRemovedBlockId === props.blockId) {
        removeIdInList(needRemovedBlockId)
        return
      }
      const target = firstLevelChildren.find((child) => child.dataset.nodeId === needRemovedBlockId)
      if (target) {
        target.remove()
        removeIdInList(needRemovedBlockId)
      }
    })
  })
}
onBeforeUnmount(() => {
  if (needRemovedBlockIdsInterval.value) {
    clearInterval(needRemovedBlockIdsInterval.value)
  }
})


// #endregion 👆 移除protyle中，其他protyle创建的块


const checkAndMerge = debounce(() => {
  processing.value = true
  const finished = () => {
    processing.value = false
  }

  const isDocProtyle = topIsDoc()
  // 如果当前是文档类型，则放弃合并
  if (isDocProtyle) {
    finished()
    return
  }

  const wysiwygElement = protyleRef.value?.protyle?.wysiwyg.element

  let firstLevelNodeChildren = Array.from(wysiwygElement?.children) as HTMLElement[]
  firstLevelNodeChildren = firstLevelNodeChildren.filter((item) => item.dataset.nodeId)
  const firstNode = firstLevelNodeChildren[0]

  const selection = window.getSelection()
  const range = selection.getRangeAt(0)
  if (range) {
    const start = range.startContainer
    const nodeElement = start?.parentElement?.closest('[data-node-id]') as HTMLElement
    if (nodeElement) {
      const nodeId = nodeElement.dataset.nodeId
      focusByBlockIdWhenAfterRender(nodeId)
    }
  }



  const firstNodeIsHeading = firstNode?.dataset?.type === SyDomNodeTypes.NodeHeading
  if (firstNodeIsHeading) {
    const headingNodeId = firstNode.dataset.nodeId
    emitBlockIdUpdated(headingNodeId, 'after_merge')
    finished()
    return
  }


  const isOnlyOne = firstLevelNodeChildren.length === 1
  if (isOnlyOne) {
    const nodeId = firstLevelNodeChildren[0].dataset.nodeId
    const isSame = nodeId === props.blockId
    if (!isSame) {
      // 如果当前块 ID 和第一个子块的 ID 不一致，则更新当前块 ID
      emitBlockIdUpdated(nodeId, 'after_merge')
    }

    finished()
    return
  }


  const superBlockId = mergeElementsIntoSuperBlock(protyleRef.value, firstLevelNodeChildren)
  waitingForSuperBlockIndexCommited(() => {
    emitBlockIdUpdated(superBlockId, 'after_merge')
    finished()
  })
}, 1000 * 2)



const handleTransaction = (event) => {
  if (!props.blockId) {
    // 如果块 ID 为空，则不进行处理
    return
  }

  if (!blockIdValid.value) {
    return
  }

  if (!props.auto) {
    // 如果 auto 为 false，则不进行处理
    return
  }


  const { detail } = event
  // console.log('detail is ', detail)
  const {
    data,
  } = detail
  const {
    doOperations = [],
  } = data[0]
  // console.log('doOperations is ', doOperations)

  const isCurrentAppEvent = !detail.app || detail.app === protyleRef.value?.protyle.app.appId
  const isOtherAppProtyleEvent = !isCurrentAppEvent
  const isCurrentProtyleEvent = detail.sid === protyleRef.value?.protyle?.id
  const isOtherProtyleEvent = !isCurrentProtyleEvent
  // console.log(`id: ${props.blockId}, isCurrentAppEvent is [${isCurrentAppEvent}], isCurrentProtyleEvent is [${isCurrentProtyleEvent}]`, protyleRef.value)
  // console.log('protyleRef.value?.protyle?.id is ', protyleRef.value?.protyle?.id)


  if (isOtherAppProtyleEvent || isOtherProtyleEvent) {
    recordNeedRemovedBlockDomIds(doOperations)
    handleCurrentBlockChange(doOperations)
    return
  }


  // 内部更改过了，不需要再检查合并了
  if (innerUpdated.value) {
    return
  }


  checkAndMerge()
}


const handleCurrentBlockChange = async (operations: IOperation[]) => {
  const currentBlockIsListItem = currentBlockInfo.value.type === SyNodeTypes.i
  const isParent = (id: string) => {
    return currentBlockInfo.value.parent_id === id
  }
  const targetOperation = operations.find((operation) => {
    const isDealingParentOfCurrentListItem = currentBlockIsListItem && isParent(operation.id)
    // 当前块 or 当前块是列表项，父列表被删除
    return operation.id === props.blockId || isDealingParentOfCurrentListItem
  })

  // console.log('targetOperation is ', targetOperation)
  if (!targetOperation) {
    return
  }


  const {
    action,
    id,
    parentID,
    previousID,
  } = targetOperation


  if (action === 'delete') {

    // 如果是转换超级块、引述块、列表块
    // 或者是当前是列表项，父列表被删除
    // 取第一个子块的 ID 作为新渲染的块
    const firstChild = operations.find((i) => i.action !== 'delete')

    if (firstChild?.id) {
      emitBlockIdUpdated(firstChild.id, 'after_delete')
      return
    }

    if (isParent(id)) {
      emitBlockIdUpdated('', 'after_delete')
      return
    }
    return
  }

  // 当前块被移动
  if (action === 'move') {

    if (!previousID) {
      // 如果 previousID 为空，则说明当前块是父块的第一个子块
      // parentId 就是新的父块 ID
      emitBlockIdUpdated(parentID, 'after_move')
      return
    }

    await flushTransactions()
    getBlockInfo(id).then((blockInfo) => {
      const renderCurrentBlock = () => {
        emitBlockIdUpdated(props.blockId, 'after_move')
      }

      const parentIsNotDoc = blockInfo?.parent_id !== blockInfo.root_id

      if (blockInfo.parent_id && parentIsNotDoc) {
        emitBlockIdUpdated(blockInfo.parent_id, 'after_move')
      } else {
        renderCurrentBlock()
      }

    })

  }
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
        content: attr(data-en_invalid_msg);
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
