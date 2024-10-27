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
          <div class="flexAlignCenter">
            添加评论｜
          </div>
          <div class="flexAlignCenter">笔记本：</div>
          <div>
            <a-select
              placeholder="选择笔记本"
              v-model="dailyNoteNotebookId"
            >
              <a-option
                v-for="notebook of openedNotebookList"
                :key="notebook.id"
                :value="notebook.id"
                :label="notebook.name"
              >
              </a-option>
            </a-select>
          </div>
        </div>
      </template>
      <div
        class="enCommentContainerContent"
      >
        <EnProtyle
          :blockId="currentBlockId"
          :options="{
            action: [],
          }"
          @after-render="onAfterRender"
        />
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
import { appendDailyNoteBlock, getBlockAttrs, setBlockAttrs, sql } from '@/api';
import EnProtyle from '@/components/EnProtyle.vue';
import { usePlugin } from '@/main';
import { debounce, generateShortUUID } from '@/utils';
import { positionModalWithTranslate, targetIsInnerOf, targetIsOutsideOf, useRegisterStyle } from '@/utils/DOM';
import { useSiyuanEventLoadedProtyleStatic, useSiyuanEventTransactions } from '@/utils/EventBusHooks';
import { warn } from '@/utils/Log';
import { useMousePostion } from '@/utils/Mouse';
import { useCurrentProtyle } from '@/utils/Siyuan'
import dayjs from 'dayjs';
import { Protyle, showMessage } from 'siyuan';
import { onBeforeUnmount, onMounted, ref, watch, watchEffect } from 'vue';

const currentProtyle = useCurrentProtyle()

const openedNotebookList = ref(window.siyuan.notebooks.filter(i => !i.closed))
const dailyNoteNotebookId = ref(openedNotebookList.value[0]?.id)

// 是否默认新增一个输入的行
const defaultInserNewLine = true
// TODO 后续需要支持在当前文档中插入
const appendType: 'daily-note' | 'cur-doc' | 'target-doc' = 'daily-note'


const messageFlag = ref(null)

const popoverVisible = ref(false)
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
let isJustClosed = false
const closeModalOutside = (event: Event) => {
  if (!isInCommentModal(event.target as HTMLElement)) {
    popoverVisible.value = false
    isJustClosed = true
  }
}
onMounted(() => {
  document.addEventListener('dblclick', closeModalOutside)
})
onBeforeUnmount(() => {
  document.removeEventListener('dblclick', closeModalOutside)
})

const currentBlockId = ref()
const newCommentNodeIdRef = ref()

const onAfterRender = (protyle: Protyle) => {
  protyle.protyle.element.classList.toggle('EnDisableProtyleEnhance', true)
  protyle.protyle.contentElement.classList.toggle('EnDisableProtyleEnhance', true)
  const flag = setInterval(() => {
    const target = protyle.protyle.contentElement.querySelector(`[data-node-id="${currentBlockId.value}"]`)
    if (target) {
      clearInterval(flag)

      const modal = document.querySelector('.enCommentContainerModal .enCommentContainer') as HTMLDivElement
      if (!modal) {
        return
      }
      modal.style.transform = `unset`
      const {
        translateX,
        translateY,
      } = positionModalWithTranslate(adjustModalTargetRef.value, modal)
      modal.style.transform = `translate(${translateX}px, ${translateY}px)`
      adjustModalTargetRef.value = null

      protyle.focusBlock(target, false)
      if (messageFlag.value) {
        clearTimeout(messageFlag.value)
      }
    }
  }, 0)
}

const destoryProtyle = () => {
  currentBlockId.value = ''
}

const getCommentIdByNodeId = (nodeId: string) => {
  const shortUUID = generateShortUUID()
  return `en-comment-id-${nodeId}-${shortUUID}`
}

const getNodeIdByCommentId = (commentId: string) => {
  const temp = commentId.split('-')
  temp.pop()
  const nodeId = [temp.pop(), temp.pop()].reverse().join('-')
  return nodeId
}

const adjustModalTargetRef = ref<HTMLElement>(null)
const adjustCommentModalByElement = (element: HTMLElement) => {
  popoverVisible.value = true
  adjustModalTargetRef.value = element
}

const commentByNodeIdAndText = async (nodeId: string, text: string) => {
  const commentId = getCommentIdByNodeId(nodeId)
  await commentByCommentIdAndText(commentId, text)
  return commentId
}

const commentByCommentIdAndText = async (commentId: string, text: string) => {
  const nodeId = getNodeIdByCommentId(commentId)

  const res = await appendDailyNoteBlock(
    'markdown',
    `- ${text}${defaultInserNewLine ? '\n\n    &ZeroWidthSpace;' : ''}`,
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
  newCommentNodeIdRef.value = newCommentNodeId

  await setBlockAttrs(newCommentNodeId, {
    'custom-en-comment-ref-id': commentId
  })

}

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
    warn('firstNodeParent is incorrect.')
    return
  }
  const superBlock = firstNodeParent as HTMLElement
  const superBlockId = superBlock.dataset.nodeId

  commentForSingleBlockByNodeId(superBlockId, superBlock)
}

const commentForSingleBlockByNodeId = (nodeId: string, adjustTarget: HTMLElement) => {
  const sqlStmt = `select * from blocks where id = '${nodeId}'`;
  const startTime = dayjs()
  const flag = setInterval(async () => {
    const mdRes = await sql(sqlStmt) as any[]

    if (mdRes.length > 0 || dayjs().diff(startTime, 'second') > 10) {
      clearInterval(flag)
      const blockMarkdown = mdRes[0]?.markdown
      const blockContent = mdRes[0]?.content
      if (!blockMarkdown) {
        warn('md is null')
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

      const enCommentId = await commentByNodeIdAndText(nodeId, finalMd)

      const blockAttrs = await getBlockAttrs(nodeId)
      const currentBlockCommentIdAttr = blockAttrs['custom-en-comment-id']
      let currentBlockCommentIdList = []
      if (currentBlockCommentIdAttr) {
        currentBlockCommentIdList = currentBlockCommentIdAttr.split(' ')
      }
      currentBlockCommentIdList.push(enCommentId)
      await setBlockAttrs(nodeId, {
        'custom-en-comment-id': currentBlockCommentIdList.join(' '),
      })
      if (adjustTarget) {
        adjustCommentModalByElement(adjustTarget)
      }
    }
  }, 300)
}

const commentForInlineText = async () => {
  const protyle = currentProtyle.value

  // 获取临时注释元素
  protyle.toolbar?.setInlineMark(protyle, 'en-comment-temp', 'range')

  const commentElements = document.querySelectorAll('[data-type~="en-comment-temp"]') as NodeListOf<Element>
  const commentEl = commentElements[0] as HTMLElement

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

  // 获取思源节点(理应是段落)
  let siyuanNode = commentEl
  while(siyuanNode != null && !siyuanNode.dataset.nodeId) {
    siyuanNode = siyuanNode.parentElement
  }

  if (!siyuanNode) {
    warn('siyuanNode is null')
    return
  }

  const nodeId = siyuanNode.dataset.nodeId

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

  if (!selectText.replace(/[\u200B]/g, '')) {
    commentForSingleBlockByNodeId(nodeId, siyuanNode)
    return
  }

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
    adjustCommentModalByElement(firstComment as HTMLElement)
  }
}

const startComment = async () => {
  console.log('start to comment')

  const protyle = currentProtyle.value
  const selectedNodes = Array.from(protyle.contentElement.querySelectorAll('.protyle-wysiwyg--select'))

  messageFlag.value = setTimeout(() => {
    showMessage('创建评论中，请等待窗口自动显示', 3000)
  }, 1000)

  if (selectedNodes.length === 0) {
    commentForInlineText()
    return
  }

  const isSelectedMultiBlocks = selectedNodes.length > 1
  let isSameParent = true
  const parentNode = selectedNodes[0].parentElement
  for (let i = 1; i < selectedNodes.length; i++) {
    if (selectedNodes[i].parentElement !== parentNode) {
      isSameParent = false
      break
    }
  }
  const allChildren = Array.from(parentNode.childNodes).filter((i: HTMLElement) => 'dataset' in i && 'nodeId' in i.dataset && i.dataset.nodeId)
  const parentNodeIsWysiwyg = parentNode.classList.contains('protyle-wysiwyg')

  // 1. 如果选中了多个 Block
  if (isSelectedMultiBlocks) {
    // 需要合并成超级块
    if (isSameParent && (parentNodeIsWysiwyg || allChildren.length !== selectedNodes.length)) {
      convertIntoSuperBlockAndComment(selectedNodes as HTMLElement[])
    } else {
      // 对单一的块进行评论
      commentForSingleBlockByNodeId(parentNode.dataset.nodeId, parentNode)
    }
    return
  }

  // 2. 如果选中了 1 个 Block
  if (selectedNodes.length === 1) {
    const block = selectedNodes[0] as HTMLElement
    commentForSingleBlockByNodeId(block.dataset.nodeId, block)
    return
  }
}

watch(popoverVisible, (newVal) => {
  if (!newVal) {
    destoryProtyle()
  } else {
    currentBlockId.value = newCommentNodeIdRef.value
    newCommentNodeIdRef.value = ''

    openedNotebookList.value = window.siyuan.notebooks.filter(i => !i.closed)
  }
})

const commentButtonIsShown = ref(false)
let commentButtonIsShowing = false
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
  console.log('watchMouseUp', isJustClosed)
  if (isJustClosed) {
    isJustClosed = false
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
  getCurrentMousePosition,
} = useMousePostion({
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

const onClickCommentButton = () => {
  hideCommentButton()
  startComment()
}
const onMouseEnterCommentButton = () => {
  stopReadyToHideCommentButton()
}

const plugin = usePlugin()
plugin.addCommand({
  langKey: "EnLineComment",
  langText: '划词评论(<a class="enCommentUsageLinkBtn" href="https://simplest-frontend.feishu.cn/docx/B3NndXHi7oLLXJxnxQmcczRsnse#share-ZMuedaqblocvljxlmFbcHFKcnPd" target="_blank">使用说明</a>)',
  hotkey: "",
  editorCallback: () => {
    if (popoverVisible.value) {
      popoverVisible.value = false
    } else {
      startComment()
    }
  },
});
const onClickComment = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  if (target.classList.contains('enCommentUsageLinkBtn')) {
    event.stopImmediatePropagation()
  }
}
onMounted(() => {
  document.addEventListener('click', onClickComment, true)
})
onBeforeUnmount(() => {
  document.removeEventListener('click', onClickComment, true)
})

const commentIdList = ref([])

const styleDomRef = useRegisterStyle('en-line-comment-style')
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
      text-decoration-color: var(--en-comment-underline-color);
      text-decoration-thickness: var(--en-comment-underline-width);
      text-shadow: var(--en-comment-text-shadow);
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
  const sqlStmt = `select * from attributes where name = 'custom-en-comment-ref-id'  and value like 'en-comment-id-%'`
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
</script>

<style lang="scss" scoped>
</style>

<style lang="scss">
:root{
  --en-comment-background-color: var(--b3-font-color11, #65b84d);
  --en-comment-underline-color: var(--b3-card-success-color, rgb(183, 223, 185));
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
