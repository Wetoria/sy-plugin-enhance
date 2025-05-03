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
import { sql } from '@/api'
import EnDock from '@/components/EnDock/EnDock.vue'
import EnProtyle from '@/components/EnProtyle.vue'
import {
  getNodeIdByCommentId,
  injectCommentIdList,
  isCancelShowCommentListDom,
  isCommentNode,
} from '@/modules/Comment/Comment'
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


const onClickComment = async (event: MouseEvent) => {
  let target = event.target as HTMLElement

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

  selectedCommentIdList.value = []
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
      padding: 6px 16px !important;
    }
  }


  .enCommentListContainerContentHistoryCommentList {
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
    }
  }
}
</style>

<style lang="scss">

</style>
