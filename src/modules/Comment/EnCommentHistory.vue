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
        <template v-if="selectedCommentIdList.length > 0">
          <!-- <a-divider orientation="left">历史评论</a-divider> -->
          <div class="historyCommentList">
            <a-card
              v-for="item of selectedCommentIdList"
              :key="item.commentBlockId"
              class="historyCommentListItemCard"
            >
              <div class="historyCommentListItemOperations">
                <a-button-group>
                  <a-button type="text" @click="(event) => quickMakeCardForCommentBlock(event, item)">
                    <template #icon>
                      <SyIcon name="iconRiffCard" />
                    </template>
                    快速制卡
                  </a-button>
                  <a-popconfirm
                    content="确定删除吗？"
                    position="tr"
                    type="error"
                    @ok="onDeleteComment(item)"
                  >
                    <a-button type="text" status="danger">
                      <template #icon>
                        <SyIcon name="iconTrashcan" />
                      </template>
                      删除
                    </a-button>
                  </a-popconfirm>
                </a-button-group>
              </div>
              <EnProtyle
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
          <div class="flexCenter" style="padding: 10px 16px;">
            请选择批注过的块
          </div>
        </template>
      </div>
    </div>
  </EnDock>
</template>

<script setup lang="ts">
import { deleteBlock, sql } from '@/api'
import EnDock from '@/components/EnDock/EnDock.vue'
import EnProtyle from '@/components/EnProtyle.vue'
import SyIcon from '@/components/SiyuanTheme/SyIcon.vue'
import {
  EN_COMMENT_KEYS,
  getNodeIdByCommentId,
  injectCommentIdList,
  isCancelShowCommentListDom,
  isCommentNode,
} from '@/modules/Comment/Comment'
import { useRegisterStyle } from '@/utils/DOM'
import { useCurrentProtyle } from '@/utils/Siyuan'
import { quickMakeCard } from '@/utils/Siyuan/Card'
import { nextTick } from 'process'
import { onBeforeUnmount, onMounted, ref, watchEffect } from 'vue'

const commentIdList = injectCommentIdList()
// watchEffect(() => {
//   console.log('commentIdList', commentIdList?.value)
// })


// #region 点击评论，显示历史评论列表

const popoverVisible = ref(false)


const closeModalByEsc = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    event.stopImmediatePropagation()
    popoverVisible.value = false
  }
}
watchEffect(() => {
  if (popoverVisible.value) {
    document.addEventListener('keydown', closeModalByEsc, true)
  } else {
    document.removeEventListener('keydown', closeModalByEsc, true)
  }
})

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
  selectedCommentIdList.value = selectedCommentIdList.value.filter((i) => i.commentBlockId !== blockId)

  // 确保 EnProtyle 已经销毁，再删除块
  // 否则会出现需要重建索引的问题
  nextTick(() => {
    // 调用思源 API 删除块
    deleteBlock(blockId)
  })
}

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
        --en-comment-highlight-color-base: 240, 182, 34;
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

  :deep(.protyle-content) {
    padding-bottom: unset !important;
    scrollbar-gutter: auto;


    .protyle-wysiwyg {
      padding: 2px 2px !important;
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

      .protyle-content {
        padding-bottom: unset !important;
      }

      :deep(.arco-card) {
        border-radius: var(--b3-border-radius);
        overflow: hidden;
        background-color: var(--b3-theme-background);

        .arco-card-body {
          padding: 0;
        }
      }

      .historyCommentListItemOperations {
        display: flex;
        justify-content: flex-end;
        padding: 4px 8px;
      }
    }
  }
}
</style>

<style lang="scss">

</style>
