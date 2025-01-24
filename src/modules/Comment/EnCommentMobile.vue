<template>
  <Teleport
    v-if="EnNavMoreRef"
    :to="EnNavMoreRef"
  >
    <a-doption
      @click="switchCommentStatus"
    >
      <div class="flexAlignCenter enGap">
        <template v-if="commentEnabled">
          <icon-pen size="18" />
          关闭批注
        </template>
        <template v-else>
          <icon-edit size="18" />
          开启批注
        </template>
      </div>
    </a-doption>
  </Teleport>

  <Teleport
    v-if="currentProtyle?.contentElement"
    :to="currentProtyle?.contentElement"
  >
    <div
      v-show="currentClickedElement"
      ref="enCommentMobileBtnsRef"
      class="EnCommentMobileBtns"
    >
      <a-button
        class="EnCommentButton"
        type="primary"
        @click.capture.stop.prevent="startComment"
      >
        <template #icon>
          <icon-plus />
        </template>
      </a-button>
      <a-button
        class="EnCommentButton"
        type="primary"
        @click.capture.stop.prevent="onClickSelectButton"
      >
        <template #icon>
          <icon-select-all />
        </template>
      </a-button>
      <a-button
        class="EnCommentButton"
        type="primary"
        @click.capture.stop.prevent="showCommentHistoryList"
      >
        <template #icon>
          <SyIcon name="iconHistory" />
        </template>
      </a-button>
    </div>
  </Teleport>

  <Teleport to="body">

    <a-modal
      v-model:visible="popoverVisible"
      class="enCommentContainerModal enCommentContainerModalMobile"
      modal-class="enCommentContainer"
      :footer="false"
      :mask="false"
      :alignCenter="false"
    >
      <template #title>
        <div
          class="row flexAlignCenter"
          style="width: 100%;"
        >
          <div class="flexAlignCenter">
            添加评论
          </div>
          <a-divider direction="vertical" />
          <div class="flexAlignCenter">
            日记笔记本：
          </div>
          <div>
            <EnNotebookSelector
              v-model="moduleOptions.notebookId"
              :notebook-list="openedNotebookList"
            />
          </div>
        </div>
      </template>
      <div
        class="enCommentContainerContent"
      >
        <a-spin
          dot
          :loading="isCommenting"
        >
          <EnProtyle
            :blockId="currentBlockId"
            :options="{
              action: [],
            }"
            @after-render="onAfterRender"
          />
        </a-spin>
      </div>
    </a-modal>
  </Teleport>

  <EnDrawer
    v-model:visible="commentListVisible"
    :footer="false"
    class="EnCommentListDrawer"
  >
    <template #title>
      <div>
        评论列表
      </div>
    </template>
    <div class="enCommentContainerContentHistoryCommentList">
      <template v-if="selectedCommentIdList.length > 0">
        <!-- <a-divider orientation="left">历史评论</a-divider> -->
        <div class="historyCommentList">
          <div
            v-for="item of selectedCommentIdList"
            :key="item.commentBlockId"
          >
            <EnProtyle
              :blockId="item.commentBlockId"
              :options="{
                action: [],
              }"
              disableEnhance
            />
          </div>
        </div>
      </template>
    </div>
  </EnDrawer>
</template>

<script setup lang="ts">
import {
  deleteBlock,
  flushTransactions,
  getBlockAttrs,
  setBlockAttrs,
  sql,
} from '@/api'
import EnDrawer from '@/components/EnDrawer.vue'
import EnNotebookSelector from '@/components/EnNotebookSelector.vue'
import EnProtyle from '@/components/EnProtyle.vue'
import { getNodeIdByCommentId } from '@/modules/Comment/Comment'
import {
  appendBlockIntoDailyNote,
} from '@/modules/DailyNote/DailyNote'
import { EnNavMoreRef } from '@/modules/EnMobileNav.vue'
import {
  injectGlobalData,
  useModule,
} from '@/modules/EnModuleControl/ModuleProvide'
import {
  debounce,
  generateShortUUID,
} from '@/utils'
import {
  EN_MODULE_LIST,
} from '@/utils/Constants'
import {
  getSelectionCopy,
} from '@/utils/DOM'
import {
  useSiyuanDatabaseIndexCommit,
  useSiyuanEvent,
} from '@/utils/EventBusHooks'
import { getColorStringWarn } from '@/utils/Log'
import {
  getClosetSiyuanNodeByDom,
  SiyuanSelectClassName,
  SyDomNodeTypes,
  useCurrentProtyle,
} from '@/utils/Siyuan'
import { Notification } from '@arco-design/web-vue'
import dayjs from 'dayjs'
import {
  Protyle,
  showMessage,
} from 'siyuan'
import {
  computed,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
  watchEffect,
} from 'vue'

const currentProtyle = useCurrentProtyle()

const lastClickedElement = ref(null)
const currentClickedElement = ref(null)
const enCommentMobileBtnsRef = ref(null)

const adjustBtnsPosition = () => {
  if (!enCommentMobileBtnsRef.value) {
    return
  }

  if (!currentClickedElement.value) {
    return
  }
  console.log('currentClickedElement', currentClickedElement.value)
  const rect = currentClickedElement.value?.getBoundingClientRect()
  const contentRect = currentProtyle.value?.contentElement?.getBoundingClientRect()
  enCommentMobileBtnsRef.value.style.top = `${rect.top - contentRect.top + 30 + (rect.height / 2) - 12}px`
}

const recordCurrentBlock = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  // while (target && !target.dataset.nodeId) {
  //   target = target.parentElement as HTMLElement
  // }

  lastClickedElement.value = currentClickedElement.value
  currentClickedElement.value = target
  // if (target?.dataset.nodeId) {
  //   currentClickedElement.value = target
  // } else {
  //   currentClickedElement.value = null
  // }

  adjustBtnsPosition()
}

const onSwitchProtyle = (event: any) => {
  lastClickedElement.value = null
  currentClickedElement.value = null
}

let offSwitchProtyle = null
const enable = (protyleContent: HTMLDivElement) => {
  document.addEventListener('click', recordCurrentBlock)

  offSwitchProtyle = useSiyuanEvent('switch-protyle', onSwitchProtyle)

  protyleContent.addEventListener('scroll', adjustBtnsPosition)
}

const disable = (protyleContent: HTMLDivElement) => {
  document.removeEventListener('click', recordCurrentBlock)

  offSwitchProtyle?.()

  protyleContent.removeEventListener('scroll', adjustBtnsPosition)

}

const commentEnabled = ref(false)
const switchCommentStatus = () => {
  const editor = document.querySelector('#editor:not(.fn__none)')
  if (!editor) {
    Notification.info('未找到正在编辑的文档')
    return
  }

  commentEnabled.value = !commentEnabled.value

  const protyleContent = editor.querySelector('.protyle-content') as HTMLDivElement

  protyleContent.classList.toggle('en_commenting', commentEnabled.value)

  if (commentEnabled.value) {
    enable(protyleContent)
  } else {
    disable(protyleContent)
  }
}

const onClickSelectButton = () => {
  const lastClickedElementParents = []
  let target = lastClickedElement.value
  while (target) {
    if (target.dataset.nodeId || target.classList.contains('protyle-wysiwyg')) {
      lastClickedElementParents.push(target)
    }
    target = target.parentElement
  }

  if (!lastClickedElementParents.length) {
    currentClickedElement.value.classList.add(SiyuanSelectClassName)
    return
  }

  let commonParent = null
  let currentParent = currentClickedElement.value
  while (currentParent) {
    if (lastClickedElementParents.includes(currentParent)) {
      commonParent = currentParent
      break
    }
    currentParent = currentParent.parentElement
  }

  if (!commonParent) {
    enLog('commonParent not found')
    return
  }

  let lastTarget = lastClickedElement.value
  if (lastTarget !== commonParent) {
    while (lastTarget && lastTarget.parentElement !== commonParent) {
      lastTarget = lastTarget.parentElement
    }
  }

  let currentTarget = currentClickedElement.value
  if (currentTarget !== commonParent) {
    while (currentTarget && currentTarget.parentElement !== commonParent) {
      currentTarget = currentTarget.parentElement
    }
  }

  if (lastTarget === currentTarget) {
    lastTarget.classList.add(SiyuanSelectClassName)
    return
  }


  const children = commonParent.children
  const lastTargetIndex = Array.from(children).indexOf(lastTarget)
  const currentTargetIndex = Array.from(children).indexOf(currentTarget)
  const startIndex = Math.min(lastTargetIndex, currentTargetIndex)
  const endIndex = Math.max(lastTargetIndex, currentTargetIndex)

  for (let i = startIndex; i <= endIndex; i++) {
    children[i].classList.add(SiyuanSelectClassName)
  }
}

const globalData = injectGlobalData()
const openedNotebookList = computed(() => globalData.value.openedNotebookList)

// 是否默认新增一个输入的行
const defaultInserNewLine = true

const {
  moduleOptions,
} = useModule<EnModuleComment>(EN_MODULE_LIST.COMMENT)
const dailyNoteNotebookId = computed(() => moduleOptions.value.notebookId)


const messageFlag = ref(null)
const stopMessage = () => {
  if (messageFlag.value) {
    clearTimeout(messageFlag.value)
    messageFlag.value = null
  }
}

// #region protyle 控制逻辑相关

const currentBlockId = ref()

const onAfterRender = (protyle: Protyle) => {
  protyle.protyle.element.classList.toggle('EnDisableProtyleEnhance', true)
  protyle.protyle.contentElement.classList.toggle('EnDisableProtyleEnhance', true)
  const flag = setInterval(() => {
    const target = protyle.protyle.contentElement.querySelector(`[data-node-id="${currentBlockId.value}"]`)
    if (target) {
      clearInterval(flag)

      protyle.focusBlock(target, false)
      isCommenting.value = false
      stopMessage()
    }
  }, 0)
}

const destoryProtyle = () => {
  currentBlockId.value = ''
}

// #endregion protyle 控制逻辑相关

// #region 评论 modal 窗口

const popoverVisible = ref(false)

// #region 双击关闭评论窗口

const isInCommentModal = (target: HTMLElement) => {
  let targetElement = target
  while (targetElement) {
    if (targetElement.classList.contains('enCommentContainerModal')) {
      return true
    }
    targetElement = targetElement.parentElement
  }
  return false
}

// #endregion 双击关闭评论窗口

watchEffect(() => {
  if (popoverVisible.value) {
  } else {
    // 关闭弹窗时，销毁 protyle
    destoryProtyle()
  }
})

// #endregion 评论 modal 窗口


// #region 评论的业务逻辑相关

// 根据 nodeId 生成 commentId
const getCommentIdByNodeId = (nodeId: string) => {
  const shortUUID = generateShortUUID()
  return `en-comment-id-${nodeId}-${shortUUID}`
}


const lastCommentParams = ref({
  commentId: '',
  text: '',
})

watch(dailyNoteNotebookId, async () => {
  if (popoverVisible.value) {
    if (currentBlockId.value) {
      // IMP 最好是移动，而不是删除以后再新建
      await deleteBlock(currentBlockId.value)
      createCommentIntoDailyNote(lastCommentParams.value.commentId, lastCommentParams.value.text)
    }
  }
})

// 根据 commentId 和文本在思源中创建评论，获取到新的评论 nodeId，用来在 protyle 中展示
const newCommentNodeIdRef = ref()

const createCommentIntoDailyNote = async (commentId: string, text: string) => {
  try {
    const res = await appendBlockIntoDailyNote(
      'markdown',
      text,
      dailyNoteNotebookId.value,
    )

    const {
      doOperations = [],
    } = res[0]
    const transaction = doOperations[0]
    const {
      id,
      data,
    } = transaction

    let tempDom = document.createElement('div')
    tempDom.innerHTML = data

    tempDom = tempDom.firstElementChild as HTMLDivElement
    const listItemNode = tempDom.firstElementChild as HTMLDivElement
    const isListItemNode = listItemNode?.dataset.type === SyDomNodeTypes.NodeListItem

    if (!isListItemNode) {
      enWarn('Get List Item Node id Failed.')
    }

    const newCommentNodeId = isListItemNode ? listItemNode.dataset.nodeId : id
    await setBlockAttrs(newCommentNodeId, {
      'custom-en-comment-ref-id': commentId,
    })

    lastCommentParams.value = {
      commentId,
      text,
    }

    newCommentNodeIdRef.value = newCommentNodeId
    popoverVisible.value = true
  } catch (error) {
    stopMessage()
  }
}
const commentByCommentIdAndText = async (commentId: string, text: string) => {
  const mdText = `- ${text}${defaultInserNewLine ? '\n\n    &ZeroWidthSpace;' : ''}`
  await createCommentIntoDailyNote(commentId, mdText)
}

// 当有新的评论 nodeId 时，更新当前的 blockId
// 即使评论窗口关闭着，也让它渲染着
watchEffect(() => {
  if (newCommentNodeIdRef.value) {
    currentBlockId.value = newCommentNodeIdRef.value
    newCommentNodeIdRef.value = ''
  }
})

const isCommenting = ref(false)
const startComment = async () => {
  isCommenting.value = true
  selectedCommentIdList.value = []

  const protyle = currentProtyle.value
  const selectedNodes = Array.from(protyle.contentElement.querySelectorAll('.protyle-wysiwyg--select'))

  if (!popoverVisible.value) {
    messageFlag.value = setTimeout(() => {
      showMessage('创建评论中，请等待窗口自动显示', 3000)
    }, 1000)
  }

  if (selectedNodes.length === 0) {
    // 防止 selection 更新不及时
    const siyuanNode = getClosetSiyuanNodeByDom(currentClickedElement.value)

    if (!siyuanNode) {
      enWarn('siyuanNode was not found')
      return
    }
    // 如果未选择行内文字，则对单个块（段落块）进行评论
    if (selectionCopy.value.isCollapsed) {
      const nodeId = siyuanNode.dataset.nodeId
      commentForSingleBlockByNodeId(nodeId, siyuanNode)
      return
    }
    commentForInlineText()
    return
  }

  // 如果选中了 1 个 Block
  if (selectedNodes.length === 1) {
    const block = selectedNodes[0] as HTMLElement
    commentForSingleBlockByNodeId(block.dataset.nodeId, block)
    return
  }


  // 如果选中多个块
  let isSameParent = true
  const parentNode = selectedNodes[0].parentElement
  for (let i = 1; i < selectedNodes.length; i++) {
    if (selectedNodes[i].parentElement !== parentNode) {
      isSameParent = false
      break
    }
  }

  const allChildren = Array.from(parentNode.childNodes).filter((i: HTMLElement) => 'dataset' in i && 'nodeId' in i.dataset && i.dataset.nodeId)
  const isNotSelectedAllSiyuanChildNodes = allChildren.length !== selectedNodes.length
  const parentNodeIsWysiwyg = parentNode.classList.contains('protyle-wysiwyg')

  // 需要合并成超级块
  if (isSameParent && (parentNodeIsWysiwyg || isNotSelectedAllSiyuanChildNodes)) {
    convertIntoSuperBlockAndComment(selectedNodes as HTMLElement[])
  } else {
    // 对单一的块进行评论
    commentForSingleBlockByNodeId(parentNode.dataset.nodeId, parentNode)
  }
}

// #region 注册 selectionchange 事件

const selectionCopy = ref<Record<string, any>>({})
const watchSelectionChange = () => {
  selectionCopy.value = getSelectionCopy()
}

onMounted(() => {
  document.addEventListener('selectionchange', watchSelectionChange)
})
onBeforeUnmount(() => {
  document.removeEventListener('selectionchange', watchSelectionChange)
})

// #endregion 注册 selectionchange 事件

// #endregion 评论的业务逻辑相关



// 将多个块转换为超级块，然后对超级块进行备注
const convertIntoSuperBlockAndComment = async (selectedNodes: HTMLElement[]) => {
  const protyle = currentProtyle.value
  const protyleIns = protyle.getInstance()

  const firstNode = selectedNodes[0] as HTMLElement

  protyleIns.turnIntoOneTransaction(selectedNodes, 'BlocksMergeSuperBlock', 'row')
  let firstNodeParent = firstNode.parentElement
  const startTime = dayjs()
  while (firstNodeParent && firstNodeParent.dataset.type !== 'NodeSuperBlock') {
    firstNodeParent = firstNodeParent.parentElement
    const now = dayjs()
    if (now.diff(startTime, 'minute') > 1) {
      break
    }
  }
  if (!firstNodeParent) {
    enWarn('firstNodeParent is incorrect.')
    return
  }
  const superBlock = firstNodeParent as HTMLElement
  const superBlockId = superBlock.dataset.nodeId

  enLog('Convert into super block.')
  enLog('Ready to flush transactions.')
  await flushTransactions()
  enLog('Flush done. Ready to comment for single block.')
  const off = useSiyuanDatabaseIndexCommit(debounce(async () => {
    enLog(`${getColorStringWarn(`Ready to comment for super block.`)}`)
    off()
    await commentForSingleBlockByNodeId(superBlockId, superBlock)
  }, 20))
}

// 对单个块进行评论
const commentForSingleBlockByNodeId = async (nodeId: string, adjustTarget: HTMLElement) => {
  const sqlStmt = `select * from blocks where id = '${nodeId}'`
  const mdRes = await sql(sqlStmt) as any[]

  const blockMarkdown = mdRes[0]?.markdown
  const blockContent = mdRes[0]?.content
  if (!blockMarkdown) {
    enWarn('md is null')
    return
  }

  const lines = blockMarkdown.replace(/^\{\{\{row(\s*)*/, '').replace(/(\s*)*\}\}\}$/, '').split('\n')
  let newMarkdown = ''
  lines.forEach((line) => {
    newMarkdown += `${line}\n    > `
  })
  const unblankLines = lines.filter((i) => i.trim())
  const isBiggerThan3Lines = unblankLines.length > 3

  // @ts-expect-error window.siyuan?.config
  const blockRefDynamicAnchorTextMaxLen = window.siyuan?.config.editor.blockRefDynamicAnchorTextMaxLen || 96
  const splicedContent = blockContent.length > blockRefDynamicAnchorTextMaxLen
    ? `${blockContent.slice(0, blockRefDynamicAnchorTextMaxLen)}...`
    : blockContent
  const finalMd = `((${nodeId} "${splicedContent}"))\n    > 原文内容${isBiggerThan3Lines ? '(已折叠)' : ''}\n    > ${newMarkdown}\n    {: style="" fold="${isBiggerThan3Lines ? '1' : '0'}" }`

  const blockAttrs = await getBlockAttrs(nodeId)
  const currentBlockCommentIdAttr = blockAttrs['custom-en-comment-id']
  let currentBlockCommentIdList = currentBlockCommentIdAttr ? currentBlockCommentIdAttr.split(' ') : []

  const currentBlockCommentId = currentBlockCommentIdList.length
    ? (currentBlockCommentIdList.find((cId) => cId.includes(nodeId)) || getCommentIdByNodeId(nodeId))
    : getCommentIdByNodeId(nodeId)

  currentBlockCommentIdList.push(currentBlockCommentId)
  currentBlockCommentIdList = Array.from(new Set(currentBlockCommentIdList))
  await setBlockAttrs(nodeId, {
    'custom-en-comment-id': currentBlockCommentIdList.join(' '),
  })

  await commentByCommentIdAndText(currentBlockCommentId, finalMd)
}

const commentForInlineText = async () => {
  const protyle = currentProtyle.value

  const siyuanNode = getClosetSiyuanNodeByDom(currentClickedElement.value)
  const nodeId = siyuanNode.dataset.nodeId
  const contentEditableDiv = siyuanNode.firstElementChild
  const isReadonly = contentEditableDiv.getAttribute('contenteditable') === 'false'

  if (isReadonly) {
    contentEditableDiv.setAttribute('contenteditable', 'true')
  }
  // 获取临时注释元素
  protyle.toolbar?.setInlineMark(protyle, 'en-comment-temp', 'range')

  const commentElements = document.querySelectorAll('[data-type~="en-comment-temp"]') as NodeListOf<Element>

  // 先查看选择的所有区域，是否有相同的 commentId
  // 如果有，看是不是还有余下的。

  const idList = []
  for (let i = 0; i < commentElements.length; i++) {
    const commentElement = commentElements[i] as HTMLElement
    const nodeTypes = commentElement.dataset.type.split(/\s+/)
    idList.push(nodeTypes.filter((i) => i.startsWith('en-comment-id-')))
  }

  const findCommonIDs = (arrays) => {
    const [first, ...rest] = arrays
    return first.filter((id) => rest.every((arr) => arr.includes(id)))
  }

  const commonIDs = findCommonIDs(idList)

  const notSubOfParentIdList = []
  const sameId = commonIDs.find((id) => {
    if (!id.includes(nodeId)) {
      notSubOfParentIdList.push(id)
      return false
    }
    const targets = siyuanNode.querySelectorAll(`[data-type~="${id}"]`)
    return targets.length === commentElements.length
  })

  // 拼接选中区域的文本用来作为备注的引用内容
  let selectText = ''
  for (let i = 0; i < commentElements.length; i++) {
    const commentElement = commentElements[i] as HTMLElement
    selectText += commentElement.innerText
  }

  protyle?.toolbar?.setInlineMark(protyle, 'en-comment-temp', 'range')

  const enCommentId = sameId || getCommentIdByNodeId(nodeId)

  await commentByCommentIdAndText(enCommentId, `((${nodeId} "${selectText}"))`)
  // 清理临时标记

  // 清理非子节点的标记（比如复制出来的情况）
  notSubOfParentIdList.forEach((notSubOfParentId) => {
    protyle?.toolbar?.setInlineMark(protyle, notSubOfParentId, 'range')
  })

  if (!sameId) {
    // 如果没有相同的 id，增新增 id 标记
    protyle?.toolbar?.setInlineMark(protyle, enCommentId, 'range')
  }

  if (isReadonly) {
    contentEditableDiv.setAttribute('contenteditable', 'false')
  }
}

// #region 点击评论，显示历史评论列表

const selectedCommentIdList = ref<Array<{
  // 评论的目标块中的 id
  commentId: string
  // 评论的目标思源块 id
  commentForNodeId: string

  // 写下评论的块 id：列表（旧版）、列表项（新版）
  commentBlockId: string
}>>([])
const commentListVisible = ref(false)
watchEffect(() => {
  commentListVisible.value = !!selectedCommentIdList.value.length
})
const isCommentNode = (target: HTMLElement) => {
  return target?.getAttribute('custom-en-comment-id') || target?.dataset?.type?.includes('en-comment-id')
}
const isCancelShowCommentListDom = (target: HTMLElement) => {
  return target.classList.contains('enCancelShowCommentListDom')
}

const getCommentHistoryByDom = async (target: HTMLElement) => {
  const allCommentNodes = []
  while (target) {
    if (isCancelShowCommentListDom(target)) {
      return
    }
    if (isCommentNode(target)) {
      allCommentNodes.push(target)
    }
    target = target.parentElement
  }

  if (!allCommentNodes.length) {
    return
  }

  const allCommentIdForCommentNodes: Array<{
    commentId: string
    commentForNodeId: string
    commentBlockId?: string
  }> = []
  allCommentNodes.forEach((node) => {
    const customAttrCommentId = node.getAttribute('custom-en-comment-id')

    if (!customAttrCommentId) {
      const commentIdListInDataType = node.dataset.type.split(' ').filter((i) => i.startsWith('en-comment-id-'))
      commentIdListInDataType.forEach((id) => {
        const nodeId = getNodeIdByCommentId(id)
        allCommentIdForCommentNodes.push({
          commentId: id,
          commentForNodeId: nodeId,
        })
      })
      return
    }
    const commentIdList = customAttrCommentId.split(' ')
    commentIdList.forEach((id) => {
      const nodeId = getNodeIdByCommentId(id)
      allCommentIdForCommentNodes.push({
        commentId: id,
        commentForNodeId: nodeId,
      })
    })
  })

  const idListWhichHasComment = []
  allCommentIdForCommentNodes.forEach((id) => {
    if (commentIdList.value.includes(id.commentId) && !idListWhichHasComment.find((i) => i.commentId === id.commentId && i.commentForNodeId === id.commentForNodeId)) {
      idListWhichHasComment.push(id)
    }
  })

  if (!idListWhichHasComment.length) {
    return
  }

  console.log('idListWhichHasComment is ', idListWhichHasComment)
  const queryCommentBlockIdSql = `
    select
      *
    from
      attributes
    where
      name = 'custom-en-comment-ref-id'
      and value in (
        '${idListWhichHasComment.map((i) => i.commentId).join("','")}'
      )
  `.replace(/\s+/g, ' ').trim()
  const commentBlockIdRes = await sql(queryCommentBlockIdSql)

  selectedCommentIdList.value = []
  commentBlockIdRes.forEach((i) => {
    const item = {
      commentBlockId: i.block_id,
      commentId: i.value,
      commentForNodeId: getNodeIdByCommentId(i.value),
    }
    selectedCommentIdList.value.push(item)
  })

  currentBlockId.value = ''
}

const onClickComment = async (event: MouseEvent) => {

  if (commentEnabled.value) {
    return
  }

  const target = event.target as HTMLElement

  getCommentHistoryByDom(target)
}

const showCommentHistoryList = () => {
  getCommentHistoryByDom(currentClickedElement.value)
}
// onMounted(() => {
//   document.addEventListener('click', onClickComment, true)
// })
// onBeforeUnmount(() => {
//   document.removeEventListener('click', onClickComment, true)
// })

// #endregion 点击评论，显示历史评论列表

</script>

<style lang="scss" scoped>
.EnCommentMobileBtns {
  position: absolute;
  top: 0;
  right: 8px;

  width: calc(24px + 8px + (2px * 2));

  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;

  .EnCommentButton {
    height: 24px;

    z-index: 2;

  }
}
</style>

<style lang="scss">
.en_commenting {
  padding-right: 24px;
}

.enCommentContainerModalMobile {
  pointer-events: none;

  & .arco-modal-wrapper {
    pointer-events: none;
    overflow: hidden;
  }

  .enCommentContainer {
    pointer-events: auto;
    top: 0;
    vertical-align: top;
    min-height: 98px;
    width: calc(100vw - 20px);
    background: var(--b3-theme-background);
    border: 1px solid var(--b3-border-color);
    transform: translateY(20px);
    max-height: calc(100vh - 40px);
    overflow: hidden;
    display: flex;
    flex-direction: column;

    .arco-modal-header {
      padding: 0 16px;
      border-bottom: 1px solid var(--b3-border-color);
      height: 36px;
    }

    .arco-modal-body {
      padding: 0;
    }

    .enCommentContainerContent {
      display: flex;
      flex-direction: column;
      flex: 1;
      overflow: auto;

      .protyle-content {
        padding-bottom: unset !important;
      }

      .protyle-wysiwyg {
        padding: 6px 16px !important;
      }
    }
  }
}

.EnCommentListDrawer {

  .arco-drawer {
    background: var(--b3-theme-background);

    .enCommentContainerContentHistoryCommentList {
      display: flex;
      flex-direction: column;
      // gap: var(--en-gap);

      .historyCommentList {
        display: flex;
        flex-direction: column;
        // gap: var(--en-gap);

        overflow: hidden;
        overflow-y: auto;

        .protyle-content {
          padding-bottom: unset !important;
        }

        .protyle-wysiwyg {
          padding: 6px 16px !important;
        }
      }
    }
  }

}

html[data-en-is-standalone="true"][data-en-pwa="true"] {
  &[data-en-orientation="portrait-primary"] {
    .enCommentContainer {
      transform: translateY(var(--en-status-height));
      max-height: calc(35vh);
    }
  }

  &[data-en-orientation="landscape-secondary"],
  &[data-en-orientation="landscape-primary"] {
    .enCommentContainer {
      margin: unset;
      width: calc(100% - var(--en-status-height) - var(--en-toolbar-height));
      max-height: calc(50vh);
    }
  }
  &[data-en-orientation="landscape-secondary"] {
    .enCommentContainer {
      transform: translateX(var(--en-toolbar-height));
    }
  }
  &[data-en-orientation="landscape-primary"] {
    .enCommentContainer {
      transform: translateX(var(--en-status-height));
    }
  }
}
</style>
