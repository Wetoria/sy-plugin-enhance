<template>
  <slot></slot>
</template>

<script setup lang="ts">
import { sql } from '@/api'
import {
  EN_COMMENT_KEYS,
  provideCommentIdList,
} from '@/modules/Comment/Comment'
import { debounce } from '@/utils'
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

const debouncedGetAllCommentIds = debounce(getAllCommentIds, 1000)

onMounted(() => {
  getAllCommentIds()
})

const offTransactions = useSiyuanEventTransactions(() => {
  debouncedGetAllCommentIds()
})
onBeforeUnmount(() => {
  offTransactions()
})
</script>

<style lang="scss" scoped>

</style>
