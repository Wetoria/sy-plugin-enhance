<template>
  <slot></slot>
</template>

<script setup lang="ts">
import { sql } from '@/api'
import {
  EN_COMMENT_KEYS,
  provideCommentIdList,
} from '@/modules/Comment/Comment'
import { useSiyuanEventTransactions } from '@/utils/EventBusHooks'
import {
  onBeforeUnmount,
  onMounted,
  ref,
} from 'vue'


const commentIdList = ref([])
provideCommentIdList(commentIdList)

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
</script>

<style lang="scss" scoped>

</style>
