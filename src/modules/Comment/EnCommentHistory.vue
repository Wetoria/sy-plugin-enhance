<template>
  <EnDock
    v-model:open="popoverVisible"
    icon="iconEnComment"
    title="历史批注"
    autoOpen
    type="EnCommentHistory"
  >
    <div
      class="enCommentListContainerContent"
    >
      <div class="enCommentListContainerContentHistoryCommentList">
        <a-spin :loading="isLoading">
          <template v-if="commentListForCurrentProtyle.length > 0">
            <!-- <a-divider orientation="left">历史评论</a-divider> -->
            <div
              ref="historyCommentListRef"
              class="historyCommentList"
              :style="{
              }"
            >
              <a-card
                v-for="item of commentListForCurrentProtyle"
                :key="item.commentBlockId"
                class="historyCommentListItemCard"
                :data-en_comment_for_node_id="item.commentForNodeId"
                :class="[
                  selectedCommentIdList.find((i) => i.commentBlockId === item.commentBlockId) ? 'selected' : '',
                ]"
              >
                <div class="historyCommentListItemOperations">
                  <EnBlockJumper
                    :blockId="item.commentForNodeId"
                    @click="onClickCommentItem(item)"
                  />
                  <EnButtonIcon
                    type="text"
                    @click="(event) => quickMakeCardForCommentBlock(event, item)"
                  >
                    <SyIcon name="iconRiffCard" />
                    <template #prompt>
                      快速制卡
                    </template>
                  </EnButtonIcon>
                  <a-popconfirm
                    content="确定删除吗？"
                    position="tr"
                    type="error"
                    @ok="onDeleteComment(item)"
                  >
                    <EnButtonIcon
                      type="text"
                      status="danger"
                    >
                      <SyIcon name="iconTrashcan" />
                      <template #prompt>
                        删除
                      </template>
                    </EnButtonIcon>
                  </a-popconfirm>
                </div>
                <EnProtyleAutoRender
                  :key="item.commentBlockId"
                  :blockId="item.commentBlockId"
                  :options="{
                    action: [],
                  }"
                  disableEnhance
                />
              </a-card>
            </div>
          </template>
          <template v-else>
            <div
              class="flexCenter"
              style="padding: 10px 16px;"
            >
              请点击编辑区的一篇文档
            </div>
          </template>
        </a-spin>
      </div>
    </div>
  </EnDock>
</template>

<script setup lang="ts">
import {
  deleteBlock,
  getBlockDOM,
  sql,
} from '@/api'
import EnBlockJumper from '@/components/EnBlockJumper.vue'
import EnButtonIcon from '@/components/EnButtonIcon.vue'
import EnDock from '@/components/EnDock/EnDock.vue'
import EnProtyleAutoRender from '@/components/EnProtyleAutoRender.vue'
import SyIcon from '@/components/SiyuanTheme/SyIcon.vue'
import {
  EN_COMMENT_KEYS,
  getNodeIdByCommentId,
  injectCommentIdList,
  injectCommentInfoList,
  isCancelShowCommentListDom,
  isCommentNode,
} from '@/modules/Comment/Comment'
import { injectGlobalWindowData } from '@/modules/EnModuleControl/ModuleProvide'
import { useRegisterStyle } from '@/utils/DOM'
import { useCurrentProtyle } from '@/utils/Siyuan'
import { quickMakeCard } from '@/utils/Siyuan/Card'
import {
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
  watchEffect,
} from 'vue'

const commentInfoList = injectCommentInfoList()
const commentIdList = injectCommentIdList()

const isLoading = ref(false)


// #region 点击评论，显示历史评论列表

const popoverVisible = ref(false)


const currentProtyle = useCurrentProtyle()
const quickMakeCardForCommentBlock = (event: MouseEvent, item: { commentBlockId: string }) => {

  const target = event.target as HTMLElement
  const cardElement = target.closest('.historyCommentListItemCard')
  if (!cardElement) {
    return
  }
  const blockElement = cardElement.querySelector(`[data-node-id="${item.commentBlockId}"]`) as HTMLElement

  if (!blockElement) {
    return
  }
  // 点击块，好记录当前 Protyle
  blockElement.click()
  quickMakeCard(currentProtyle.value, [blockElement])
}

const onDeleteComment = (item: { commentBlockId: string }) => {
  const blockId = item.commentBlockId
  // 先从列表中移除
  commentListForCurrentProtyle.value = commentListForCurrentProtyle.value.filter((i) => i.commentBlockId !== blockId)
  selectedCommentIdList.value = selectedCommentIdList.value.filter((i) => i.commentBlockId !== blockId)

  // 确保 EnProtyle 已经销毁，再删除块
  // 否则会出现需要重建索引的问题
  nextTick(() => {
    // 调用思源 API 删除块
    deleteBlock(blockId)
  })
}

const globalWindowData = injectGlobalWindowData()
const commentListForCurrentProtyle = ref<EnCommentInfo[]>([])

watch(currentProtyle, (newValue, oldValue) => {
  if (newValue?.block.id !== oldValue?.block.id) {
    getCommentsForCurrentProtyle()
  }
}, {
  deep: true,
})
watch(commentInfoList, () => {
  getCommentsForCurrentProtyle()
})

const getCommentsForCurrentProtyle = async () => {
  const currentProtyleId = currentProtyle.value?.block.id
  if (!currentProtyleId) {
    return
  }
  const isInEditor = globalWindowData.value.protyleList.find((i) => i.protyleBlockId === currentProtyleId)?.isEditorProtyle
  // 只显示编辑区中的批注历史
  if (!isInEditor) {
    return
  }
  commentListForCurrentProtyle.value = commentInfoList.value.filter((i) => i.commentForDocId === currentProtyleId)

  sortCommentListForCurrentProtyle()
}

const sortCommentListForCurrentProtyle = async () => {
  const currentProtyleDomRes = await getBlockDOM(currentProtyle.value.block.id)
  const currentProtyleDom = new DOMParser().parseFromString(currentProtyleDomRes.dom, 'text/html')

  commentListForCurrentProtyle.value.sort((a, b) => {
    const aTargetNodeElement =
      currentProtyleDom.querySelector(`[data-type~="${a.commentId}"]`)
      || currentProtyleDom.querySelector(`[custom-en-comment-id~="${a.commentId}"]`)
    const bTargetNodeElement =
      currentProtyleDom.querySelector(`[data-type~="${b.commentId}"]`)
      || currentProtyleDom.querySelector(`[custom-en-comment-id~="${b.commentId}"]`)

    if (!aTargetNodeElement || !bTargetNodeElement) {
      return 0
    }

    // 使用 compareDocumentPosition 比较两个元素的位置
    const position = aTargetNodeElement.compareDocumentPosition(bTargetNodeElement)

    // 如果 a 在 b 之前，返回 -1
    if (position & Node.DOCUMENT_POSITION_FOLLOWING) {
      return -1
    }
    // 如果 a 在 b 之后，返回 1
    if (position & Node.DOCUMENT_POSITION_PRECEDING) {
      return 1
    }
    // 如果位置相同，返回 0
    return 0
  })
}

const onClickCommentItem = (item: Omit<EnCommentInfo, 'commentForDocId'>) => {
  selectedCommentIdList.value = [item]
}


const historyCommentListRef = ref<HTMLDivElement>()


const selectedCommentIdList = ref<Array<{
  // 评论的目标块中的 id
  commentId: string
  // 评论的目标思源块 id
  commentForNodeId: string

  // 写下评论的块 id：列表（旧版）、列表项（新版）
  commentBlockId: string
}>>([])

watchEffect(() => {

  // 关闭历史批注窗口时，清空列表
  if (!popoverVisible.value) {
    selectedCommentIdList.value = []
  }
})

const styleDomRef = useRegisterStyle('en-comment-target-block-style')
watchEffect(() => {
  const styleText = selectedCommentIdList.value.map((i) => {
    return `
      [data-node-id="${i.commentForNodeId}"] {
        --en-comment-highlight-color: rgb(var(--en-comment-highlight-color-base)) !important;
        --en-comment-highlight-background-color: rgba(var(--en-comment-highlight-color-base), .25) !important;

        &[${EN_COMMENT_KEYS.commentIdInAttribute}~="${i.commentId}"] {

          &[data-type="NodeParagraph"],
          &[data-type="NodeHeading"],
          [data-type="NodeParagraph"],
          [data-type="NodeHeading"] {

            & > div:first-child {
              background-color: var(--en-comment-highlight-background-color) !important;
              text-decoration-color: var(--en-comment-highlight-color) !important;

              & *:not([data-type*="en-comment-id"]) {
                text-decoration-color: var(--en-comment-highlight-color) !important;
              }
            }

          }

        }

        [data-type~="${i.commentId}"] {
          background-color: var(--en-comment-highlight-background-color) !important;
          text-decoration-color: var(--en-comment-highlight-color) !important;
        }
      }
    `
  }).join('\n')
  styleDomRef.value.textContent = styleText
})


const onClickComment = async (event: MouseEvent) => {
  let target = event.target as HTMLElement

  const protyleContentElement = (event.target as HTMLElement).closest('.protyle-content')
  if (!protyleContentElement) {
    return
  }
  const isInEditor = globalWindowData.value.protyleList.find((i) => i.protyleContentEl === protyleContentElement)?.isEditorProtyle
  if (!isInEditor) {
    return
  }

  selectedCommentIdList.value = []

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

  const firstHasCommentId = idListWhichHasComment[0].commentId
  const firstHasCommentInlineNode = document.querySelector(`[data-type~="${firstHasCommentId}"]`)
  const firstHasCommentNode = document.querySelector(`[custom-en-comment-id~="${firstHasCommentId}"]`)
  const firstCommentDom = firstHasCommentInlineNode || firstHasCommentNode

  // doNotShowCommentButton = true

  isLoading.value = true
  const queryCommentBlockIdSql = `select * from attributes where name = 'custom-en-comment-ref-id' and value in ('${idListWhichHasComment.map((i) => i.commentId).join("','")}')`
  const commentBlockIdRes = await sql(queryCommentBlockIdSql)

  idListWhichHasComment.forEach((id) => {
    const commentBlockId = commentBlockIdRes.find((i) => i.value === id.commentId)?.block_id
    if (commentBlockId) {
      id.commentBlockId = commentBlockId
      selectedCommentIdList.value.push(id)
    }
  })


  popoverVisible.value = true

  isLoading.value = false
  setTimeout(() => {
    scrollToFirstSelectedCard(idListWhichHasComment[idListWhichHasComment.length - 1].commentForNodeId)
  }, 0)
}

const scrollToFirstSelectedCard = (commentBlockId: string) => {
  const firstSelectedCard = historyCommentListRef.value?.querySelector(`[data-en_comment_for_node_id="${commentBlockId}"]`) as HTMLDivElement
  if (!firstSelectedCard) {
    return
  }

  firstSelectedCard.scrollIntoView({
    behavior: 'smooth',
  })

  // const protyleContentElement = currentProtyle.value.contentElement

  // const enDockElement = historyCommentListRef.value.closest('.EnDockContent') as HTMLElement

  // const targetNodeElement = protyleContentElement.querySelector(`[data-node-id="${firstSelectedCard.dataset.en_comment_for_node_id}"]`)
  // if (!targetNodeElement) {
  //   return
  // }

  // const targetNodeElementRect = targetNodeElement.getBoundingClientRect()
  // const firstSelectedCardRect = firstSelectedCard.getBoundingClientRect()

  // const offset = targetNodeElementRect.top - firstSelectedCardRect.top

  // enDockElement.scrollTop -= offset
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
.EnCommentListHeader {
  padding: 4px 8px;
}

.enCommentListContainerContent {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: auto;

  .EnProtyleContainer {
    padding-bottom: 4px;
  }

  :deep(.protyle-content) {
    padding-bottom: unset !important;
    overflow-y: hidden;


    .protyle-wysiwyg {
      padding: 2px 6px !important;
    }
  }


  .enCommentListContainerContentHistoryCommentList {
    display: flex;
    flex-direction: column;
    // gap: var(--en-gap);

    .historyCommentList {
      display: flex;
      flex-direction: column;
      gap: 10px;

      overflow: hidden;
      overflow-y: auto;
      padding: 10px 4px;

      position: relative;

      .protyle-content {
        padding-bottom: unset !important;
      }

      :deep(.arco-card) {
        border-radius: var(--b3-border-radius);
        overflow: hidden;
        background-color: var(--b3-theme-background);

        // position: absolute;
        // top: -2000px;
        // left: 4px;
        // width: calc(100% - 10px);

        // transition: top 0.3s ease-out;

        &.selected {

          &::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 2px;
            border-top-left-radius: var(--b3-border-radius);
            border-top-right-radius: var(--b3-border-radius);
            background-color: rgb(var(--en-comment-highlight-color-base));
          }
        }

        .arco-card-body {
          padding: 0;
        }
      }

      .historyCommentListItemOperations {
        display: flex;
        justify-content: flex-end;
        padding: 4px 8px;
        gap: 4px;
      }
    }
  }
}
</style>

<style lang="scss">
:root {
  --en-comment-highlight-color-base: 240, 182, 34;
}

.EnDock_EnCommentHistory {
  .EnDockContent {
    scrollbar-width: thin;
    scrollbar-color: var(--b3-scroll-color) transparent;

    &::-webkit-scrollbar {
      width: 2px;
    }

  }
}
</style>
