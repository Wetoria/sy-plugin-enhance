<template>
  <slot></slot>
</template>

<script setup lang="ts">
import { sql } from '@/api'
import {
  EN_COMMENT_KEYS,
  getNodeIdByCommentId,
  injectCommentOptions,
  provideCommentIdList,
} from '@/modules/Comment/Comment'
import { useRegisterStyle } from '@/utils/DOM'
import { useSiyuanEventTransactions } from '@/utils/EventBusHooks'
import {
  onBeforeUnmount,
  onMounted,
  ref,
  watchEffect,
} from 'vue'

const commentOptions = injectCommentOptions()

// #region 监听思源事件，更新评论样式
const commentIdList = ref([])
provideCommentIdList(commentIdList)

const styleDomRef = useRegisterStyle('en-line-comment-style')
onBeforeUnmount(() => {
  styleDomRef.value.remove()
})
// 监听 commentIdList 的变化，更新样式
watchEffect(() => {
  const lineSelectorList = commentIdList.value.map((i) => {
    const nodeId = getNodeIdByCommentId(i)
    return `[data-node-id="${nodeId}"] [data-type~="${i}"]`
  })
  const blockSelectorList = commentIdList.value.map((i) => {
    const nodeId = getNodeIdByCommentId(i)
    return `[data-node-id="${nodeId}"][${EN_COMMENT_KEYS.commentIdInAttribute}~="${i}"]`
  })
  styleDomRef.value.textContent = `
    ${lineSelectorList.join(', ')} {
      ${commentOptions.value.customStyleInline}
    }
    ${blockSelectorList.join(', ')} {
      ${commentOptions.value.customStyleBlock}
    }
  `
})

const getAllCommentIds = async () => {
  const sqlStmt = `
    select
      *
    from
      attributes
    where
      name = '${EN_COMMENT_KEYS.nodeCommentRefKey}'
      and value like '${EN_COMMENT_KEYS.commentIdPrefix}-%'
    limit
      9999999
  `
  const res = await sql(sqlStmt)
  commentIdList.value = res.map((i) => i.value)
}

onMounted(() => {
  getAllCommentIds()
})

const offTransactions = useSiyuanEventTransactions(() => {
  // 防止数据库还没更新完
  setTimeout(() => {
    getAllCommentIds()
  }, 1000)
})
onBeforeUnmount(() => {
  offTransactions()
})

// #endregion 监听思源事件，更新评论样式
</script>

<style lang="scss" scoped>

</style>
