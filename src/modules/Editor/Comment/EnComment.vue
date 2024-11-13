<!-- eslint-disable vue/require-v-for-key -->
<template>
  <div>
    <a-modal
      v-model:visible="popoverVisible"
      class="enCommentContainerModal"
      modal-class="enCommentContainer"
      draggable
      :footer="false"
      :mask="false"
      :alignCenter="false"
    >
      <template #title>
        <div class="row flexAlignCenter" style="width: 100%;">
          <template v-if="!selectedCommentIdList.length">
            <div class="flexAlignCenter">
              添加评论
            </div>
            <a-divider direction="vertical" />
            <div class="flexAlignCenter">日记笔记本：</div>
            <div>
              <EnNotebookSelector
                :notebookList="openedNotebookList.data"
                v-model="moduleOptions.dailyNoteNotebookId"
              />
            </div>
          </template>
          <template v-else>
            <div class="flexAlignCenter">
              历史评论
            </div>
          </template>
        </div>
      </template>
      <div
        class="enCommentContainerContent"
      >
        <a-spin dot :loading="isCommenting">
          <EnProtyle
            :blockId="currentBlockId"
            :options="{
              action: [],
            }"
            @after-render="onAfterRender"
          />
        </a-spin>

        <div class="enCommentContainerContentHistoryCommentList">
          <template v-if="selectedCommentIdList.length > 0">
            <!-- <a-divider orientation="left">历史评论</a-divider> -->
            <div class="historyCommentList">
              <div
                v-for="item of selectedCommentIdList"
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
      </div>
    </a-modal>
    <a-button
      class="enCommentButton"
      v-show="commentButtonIsShown"
      :style="{
        top: commentButtonPosition.y + 'px',
        left: commentButtonPosition.x + 'px',
      }"
      @click="onClickCommentButton"
      @mouseenter="onMouseEnterCommentButton"
    >
      <template #icon>
        <icon-plus />
      </template>
    </a-button>
  </div>
</template>

<script setup lang="ts">
import { deleteBlock, getBlockAttrs, setBlockAttrs, sql } from '@/api';
import EnNotebookSelector from '@/components/EnNotebookSelector.vue';
import EnProtyle from '@/components/EnProtyle.vue';
import { usePlugin } from '@/main';
import { appendBlockIntoDailyNote, useDailyNote } from '@/modules/DailyNote/DailyNote.vue';
import { debounce, generateShortUUID } from '@/utils';
import { addCommand } from '@/utils/Commands';
import { positionModalWithTranslate, targetIsInnerOf, targetIsOutsideOf, useRegisterStyle } from '@/utils/DOM';
import { useSiyuanEventLoadedProtyleStatic, useSiyuanEventTransactions } from '@/utils/EventBusHooks';
import { useMousePostion } from '@/utils/Mouse';
import { useCurrentProtyle } from '@/utils/Siyuan'
import dayjs from 'dayjs';
import { Protyle, showMessage } from 'siyuan';
import { computed, onBeforeUnmount, onMounted, ref, watch, watchEffect } from 'vue';

const plugin = usePlugin()

const currentProtyle = useCurrentProtyle()

const {
  openedNotebookList,
  moduleOptions,
} = useDailyNote()
const dailyNoteNotebookId = computed(() => moduleOptions.value.dailyNoteNotebookId)
// 是否默认新增一个输入的行
const defaultInserNewLine = true
// TODO 后续需要支持在当前文档中插入
const appendType: 'daily-note' | 'cur-doc' | 'target-doc' = 'daily-note'


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

      adjustCommentModal()

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

const closeModalOutside = (event: Event) => {
  if (!isInCommentModal(event.target as HTMLElement)) {
    popoverVisible.value = false
    doNotShowCommentButton = true
  }
}
onMounted(() => {
  document.addEventListener('dblclick', closeModalOutside)
})
onBeforeUnmount(() => {
  document.removeEventListener('dblclick', closeModalOutside)
})

// #endregion 双击关闭评论窗口

watchEffect(() => {
  if (popoverVisible.value) {
    // 隐藏评论按钮
    hideCommentButton()
  } else {
    // 关闭弹窗时，销毁 protyle
    destoryProtyle()
  }
})

const adjustModalTargetRef = ref<HTMLElement>(null)
const recordAdjustCommentModalTargetElement = (element: HTMLElement) => {
  adjustModalTargetRef.value = element
}

const adjustCommentModal = () => {
  const modal = document.querySelector('.enCommentContainerModal .enCommentContainer') as HTMLDivElement
  if (!modal) {
    return
  }

  modal.style.transform = `translate(${window.innerWidth}px, ${window.innerHeight}px)`
  const {
    translateX,
    translateY,
  } = positionModalWithTranslate(adjustModalTargetRef.value, modal)
  modal.style.transform = `translate(${translateX}px, ${translateY}px)`
}

// #endregion 评论 modal 窗口


// #region 评论的业务逻辑相关

// 根据 nodeId 生成 commentId
const getCommentIdByNodeId = (nodeId: string) => {
  const shortUUID = generateShortUUID()
  return `en-comment-id-${nodeId}-${shortUUID}`
}

// 根据 commentId 获取 nodeId
const getNodeIdByCommentId = (commentId: string) => {
  const temp = commentId.split('-')
  temp.pop()
  const nodeId = [temp.pop(), temp.pop()].reverse().join('-')
  return nodeId
}

// 根据 nodeId 和文本创建评论
const commentByNodeIdAndText = async (nodeId: string, text: string) => {
  const commentId = getCommentIdByNodeId(nodeId)
  await commentByCommentIdAndText(commentId, text)
  return commentId
}


const lastCommentParams = ref({
  commentId: '',
  text: '',
})

watch(dailyNoteNotebookId, async () => {
  if (popoverVisible.value) {
    if (currentBlockId.value) {
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
    } = transaction;

    const newCommentNodeId = id

    await setBlockAttrs(newCommentNodeId, {
      'custom-en-comment-ref-id': commentId
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

  commentForSingleBlockByNodeId(superBlockId, superBlock)
}

// 对单个块进行评论
const commentForSingleBlockByNodeId = (nodeId: string, adjustTarget: HTMLElement) => {
  const sqlStmt = `select * from blocks where id = '${nodeId}'`;
  const startTime = dayjs()

  let flag: any = null

  const queryBlockAndComment = async () => {
    const mdRes = await sql(sqlStmt) as any[]

    if (mdRes.length > 0 || dayjs().diff(startTime, 'second') > 10) {
      clearInterval(flag)

      const blockMarkdown = mdRes[0]?.markdown
      const blockContent = mdRes[0]?.content
      if (!blockMarkdown) {
        enWarn('md is null')
        return
      }

      const lines = blockMarkdown.replace(/^{{{row(\s*\n*\s*)*/, '').replace(/(\s*\n*\s*)*}}}$/, '').split('\n');
      let newMarkdown = '';
      lines.forEach(line => {
        newMarkdown += `${line}\n    > `;
      });
      const unblankLines = lines.filter(i => i.trim())
      const isBiggerThan3Lines = unblankLines.length > 3

      //@ts-expect-error window.siyuan?.config
      const blockRefDynamicAnchorTextMaxLen = window.siyuan?.config.editor.blockRefDynamicAnchorTextMaxLen || 96
      const splicedContent = blockContent.length > blockRefDynamicAnchorTextMaxLen
        ? blockContent.slice(0, blockRefDynamicAnchorTextMaxLen) + '...'
        : blockContent
      const finalMd = `((${nodeId} "${splicedContent}"))\n    > 原文内容${isBiggerThan3Lines ? '(已折叠)' : ''}\n    > ${newMarkdown}\n    {: style="" fold="${isBiggerThan3Lines ? '1' : '0'}" }`

      const blockAttrs = await getBlockAttrs(nodeId)
      const currentBlockCommentIdAttr = blockAttrs['custom-en-comment-id']
      let currentBlockCommentIdList = currentBlockCommentIdAttr ? currentBlockCommentIdAttr.split(' ') : []

      const currentBlockCommentId = currentBlockCommentIdList.length ? currentBlockCommentIdList[0] : getCommentIdByNodeId(nodeId)

      currentBlockCommentIdList.push(currentBlockCommentId)
      currentBlockCommentIdList = Array.from(new Set(currentBlockCommentIdList))
      await setBlockAttrs(nodeId, {
        'custom-en-comment-id': currentBlockCommentIdList.join(' '),
      })

      await commentByCommentIdAndText(currentBlockCommentId, finalMd)

      if (adjustTarget) {
        recordAdjustCommentModalTargetElement(adjustTarget)
      }
    }
  }

  // 立即进行查询
  queryBlockAndComment()
  flag = setInterval(async () => {
    queryBlockAndComment()
  }, 300)
}

const commentForInlineText = async () => {
  const protyle = currentProtyle.value

  const selection = window.getSelection()

  const {
    focusNode,
  } = selection
  let siyuanNode = focusNode as HTMLElement
  while(siyuanNode != null && !siyuanNode?.dataset?.nodeId) {
    siyuanNode = siyuanNode.parentElement
  }

  if (!siyuanNode) {
    enWarn('siyuanNode is null')
    return
  }

  const nodeId = siyuanNode.dataset.nodeId

  // 如果未选择行内文字，则对单个块（段落块）进行评论
  if (selection.isCollapsed) {
    commentForSingleBlockByNodeId(nodeId, siyuanNode)
    return
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
    idList.push(nodeTypes.filter(i => i.startsWith('en-comment-id-')))
  }

  const findCommonIDs = (arrays) => {
    const [first, ...rest] = arrays;
    return first.filter(id => rest.every(arr => arr.includes(id)));
  };

  const commonIDs = findCommonIDs(idList);

  const notSubOfParentIdList = []
  const sameId = commonIDs.find(id => {
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

  protyle?.toolbar?.setInlineMark(protyle, 'en-comment-temp', "range");

  const enCommentId = sameId ? sameId : getCommentIdByNodeId(nodeId)

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

  const firstComment = document.querySelector(`[data-type~="${enCommentId}"]`)
  if (firstComment) {
    recordAdjustCommentModalTargetElement(firstComment as HTMLElement)
  }
}

// #region 显示评论按钮相关

const commentButtonIsShown = ref(false)
let commentButtonIsShowing = false
let doNotShowCommentButton = false
const showCommentButton = () => {
  commentButtonIsShowing = true
  commentButtonIsShown.value = true

  setTimeout(() => {
    commentButtonIsShowing = false
  }, 500)
}
const hideCommentButton = () => {
  if (commentButtonIsShowing) {
    commentButtonIsShowing = false
    return
  }
  commentButtonIsShown.value = false
}

const commentButtonPosition = ref({
  x: window.innerWidth,
  y: window.innerHeight,
})
const isInCommentButton = (target: HTMLElement) => {
  return targetIsInnerOf(target, (i) => i.classList.contains('enCommentButton'))
}

// 点击以后，显示评论按钮
const watchMouseUp = debounce((event: Event) => {
  if (doNotShowCommentButton) {
    doNotShowCommentButton = false
    return
  }
  const {
    target,
  } = event as MouseEvent
  // 点击评论按钮，跳过显示逻辑
  if (isInCommentButton(target as HTMLElement)) {
    return
  }
  // 点击 protyle 时，才显示评论按钮
  if (targetIsOutsideOf(target as HTMLElement, (i) => i.classList.contains('protyle-wysiwyg'))) {
    return
  }

  setTimeout(() => {
    // 延时获取鼠标当前位置，防止鼠标移动过快，导致位置获取不准确
    stopReadyToHideCommentButton()
    commentButtonPosition.value = {
      x: getCurrentMousePosition().clientX + 10,
      y: getCurrentMousePosition().clientY - 14,
    }
    showCommentButton()
  }, 200)
}, 200)

// 鼠标按下时，如果不在评论按钮上，则隐藏评论按钮
const watchMouseDown = (event: Event) => {
  stopReadyToHideCommentButton()
  if (!isInCommentButton(event.target as HTMLElement)) {
    hideCommentButton()
  }
}

const readyToHideCommentButtonFlag = ref(null)
const stopReadyToHideCommentButton = () => {
  if (readyToHideCommentButtonFlag.value) {
    clearTimeout(readyToHideCommentButtonFlag.value)
    readyToHideCommentButtonFlag.value = null
  }
}
const {
  eventBinded,
  bindEvent,
  unbindEvent,
  getCurrentMousePosition,
} = useMousePostion({
  immediate: false,
  onMouseUp: watchMouseUp,
  onMouseDown: watchMouseDown,
  onMouseMoveStart() {
    if (commentButtonIsShown.value) {
      readyToHideCommentButtonFlag.value = setTimeout(() => {
        hideCommentButton()
      }, 500)
    }
  },
})

addCommand({
  langKey: "En_Comment_EnableBtn",
  langText: '开关评论按钮',
  hotkey: "",
  callback: () => {
    if (eventBinded.value) {
      hideCommentButton()
      unbindEvent()
    } else {
      bindEvent()
    }
  },
});

const onClickCommentButton = () => {
  hideCommentButton()
  startComment()
}
const onMouseEnterCommentButton = () => {
  stopReadyToHideCommentButton()
}

// #endregion 显示评论按钮相关


// #region 插件快捷键相关

addCommand({
  langKey: "En_Comment",
  langText: '评论当前选中内容(<a class="enCommentUsageLinkBtn" href="https://simplest-frontend.feishu.cn/docx/B3NndXHi7oLLXJxnxQmcczRsnse#share-ZMuedaqblocvljxlmFbcHFKcnPd" target="_blank">使用说明</a>)',
  hotkey: "",
  editorCallback: () => {
    if (popoverVisible.value) {
      popoverVisible.value = false
    } else {
      startComment()
    }
  },
});
const onClickCommentUsageLinkBtn = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  if (target.classList.contains('enCommentUsageLinkBtn')) {
    event.stopImmediatePropagation()
  }
}
onMounted(() => {
  document.addEventListener('click', onClickCommentUsageLinkBtn, true)
})
onBeforeUnmount(() => {
  document.removeEventListener('click', onClickCommentUsageLinkBtn, true)
})

// #endregion 插件快捷键相关


// #region 监听思源事件，更新评论样式
const commentIdList = ref([])

const styleDomRef = useRegisterStyle('en-line-comment-style')
// 监听 commentIdList 的变化，更新样式
watchEffect(() => {
  const lineSelectorList = commentIdList.value.map(i => {
    const nodeId = getNodeIdByCommentId(i)
    return `[data-node-id="${nodeId}"] [data-type~="${i}"]`
  })
  const blockSelectorList = commentIdList.value.map(i => {
    const nodeId = getNodeIdByCommentId(i)
    return `[data-node-id="${nodeId}"][custom-en-comment-id~="${i}"]`
  })
  styleDomRef.value.textContent = `
    ${lineSelectorList.join(', ')} {
      text-decoration: var(--en-comment-style);
      text-decoration-color: var(--en-comment-line-underline-color);
      text-decoration-thickness: var(--en-comment-underline-width);
      text-shadow: var(--en-comment-text-shadow);

      & * {
        text-decoration: var(--en-comment-style);
        text-decoration-color: var(--en-comment-line-underline-color);
        text-decoration-thickness: var(--en-comment-underline-width);
        text-shadow: var(--en-comment-text-shadow);
      }
    }
    ${blockSelectorList.join(', ')} {
      &,
      [data-type="NodeParagraph"],
      [data-type="NodeHeading"] {
        & > div:first-child {
          text-decoration: var(--en-comment-style);
          text-decoration-color: var(--en-comment-underline-color);
          text-decoration-thickness: var(--en-comment-underline-width);
          text-shadow: var(--en-comment-text-shadow);

          & * {
            text-decoration: var(--en-comment-style);
            text-decoration-color: var(--en-comment-underline-color);
            text-decoration-thickness: var(--en-comment-underline-width);
            text-shadow: var(--en-comment-text-shadow);
          }

          img {
            border: var(--en-comment-underline-width) solid var(--en-comment-underline-color);
          }
        }
      }

      [data-type="NodeWidget"],
      [data-type="NodeBlockQueryEmbed"],
      [data-type="NodeHTMLBlock"],
      [data-type="NodeCodeBlock"],
      [data-type="NodeVideo"] video,
      [data-type="NodeAudio"] audio,
      [data-type="NodeIFrame"] {
        border: var(--en-comment-underline-width) solid var(--en-comment-underline-color);
      }
    }
  `
})

const getAllCommentIds = async () => {
  const sqlStmt = `select * from attributes where name = 'custom-en-comment-ref-id'  and value like 'en-comment-id-%' limit 9999999`
  const res = await sql(sqlStmt)
  commentIdList.value = res.map(i => i.value)
}

const offLoadedProtyleStatic = useSiyuanEventLoadedProtyleStatic(() => {
  getAllCommentIds()
})

const offTransactions = useSiyuanEventTransactions(() => {
  // 防止数据库还没更新完
  setTimeout(() => {
    getAllCommentIds()
  }, 1000)
})
onBeforeUnmount(() => {
  offLoadedProtyleStatic()
  offTransactions()
})

// #endregion 监听思源事件，更新评论样式


// #region 点击评论，显示历史评论列表

const selectedCommentIdList = ref<Array<{
  commentId: string;
  commentForNodeId: string;
  commentBlockId: string;
}>>([])
const isCommentNode = (target: HTMLElement) => {
  return target?.getAttribute('custom-en-comment-id') || target?.dataset?.type?.includes('en-comment-id')
}
const onClickComment = async (event: MouseEvent) => {
  let target = event.target as HTMLElement

  const allCommentNodes = []
  while (target) {
    if (isCommentNode(target)) {
      allCommentNodes.push(target)
    }
    target = target.parentElement
  }

  if (!allCommentNodes.length) {
    return
  }

  const allCommentIdForCommentNodes: Array<{
    commentId: string;
    commentForNodeId: string;
    commentBlockId?: string;
  }> = []
  allCommentNodes.forEach((node) => {
    const customAttrCommentId = node.getAttribute('custom-en-comment-id')

    if (!customAttrCommentId) {
      const commentIdListInDataType = node.dataset.type.split(' ').filter(i => i.startsWith('en-comment-id-'))
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
    if (commentIdList.value.includes(id.commentId) && !idListWhichHasComment.find(i => i.commentId === id.commentId && i.commentForNodeId === id.commentForNodeId)) {
      idListWhichHasComment.push(id)
    }
  })

  if (!idListWhichHasComment.length) {
    return
  }

  const firstHasCommentId = idListWhichHasComment[0].commentId
  const firstHasCommentInlineNode = document.querySelector(`[data-type~="${firstHasCommentId}"]`)
  const firstHasCommentNode = document.querySelector(`[custom-en-comment-id~="${firstHasCommentId}"]`)
  const firstCommentDom = firstHasCommentInlineNode || firstHasCommentNode

  // doNotShowCommentButton = true

  const queryCommentBlockIdSql = `select * from attributes where name = 'custom-en-comment-ref-id' and value in ('${idListWhichHasComment.map(i => i.commentId).join("','")}')`
  const commentBlockIdRes = await sql(queryCommentBlockIdSql)

  selectedCommentIdList.value = []
  idListWhichHasComment.forEach((id) => {
    const commentBlockId = commentBlockIdRes.find(i => i.value === id.commentId)?.block_id
    if (commentBlockId) {
      id.commentBlockId = commentBlockId
      selectedCommentIdList.value.push(id)
    }
  })

  popoverVisible.value = true
  currentBlockId.value = ''
  recordAdjustCommentModalTargetElement(firstCommentDom as HTMLElement)
  adjustCommentModal()
}
onMounted(() => {
  document.addEventListener('click', onClickComment, true)
})
onBeforeUnmount(() => {
  document.removeEventListener('click', onClickComment, true)
})

// #endregion 点击评论，显示历史评论列表

</script>

<style lang="scss" scoped>
</style>

<style lang="scss">
:root{
  --en-comment-background-color: var(--b3-font-color11, #65b84d);
  --en-comment-underline-color: var(--b3-card-success-color, rgb(183, 223, 185));
  // --en-comment-line-underline-color: var(--b3-theme-success, #65b84d);
  --en-comment-line-underline-color: var(--en-comment-underline-color);
  --en-comment-style: underline;
  --en-comment-underline-width: 2px;

  --en-comment-text-shadow: 0px -5px 24px var(--en-comment-background-color);
}
.enCommentContainerModal {
  pointer-events: none;

  & .arco-modal-wrapper {
    pointer-events: none;
    text-align: unset;
    overflow: hidden;
  }

  .enCommentContainer {
    pointer-events: auto;
    top: 0;
    vertical-align: top;
    min-height: 98px;
    background: var(--b3-theme-background);
    border: 1px solid var(--b3-border-color);
    transform: translate(100vw, 100vh);

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

      .enCommentContainerContentHistoryCommentList {
        display: flex;
        flex-direction: column;
        // gap: var(--en-gap);

        .historyCommentList {
          display: flex;
          flex-direction: column;
          // gap: var(--en-gap);

          max-height: 20vh;
          overflow: hidden;
          overflow-y: auto;

          .protyle-content {
        padding-bottom: unset !important;
      }
        }
      }
    }
  }
}

.arco-btn.enCommentButton {
  position: fixed;
  pointer-events: auto;
  background: var(--b3-theme-background);
  z-index: 1000;
  border: 1px solid var(--b3-border-color);

  &:hover {
    background: var(--b3-theme-background);
    border: 1px solid var(--b3-theme-on-background);
  }
}
</style>
