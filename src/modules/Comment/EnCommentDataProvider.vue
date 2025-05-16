<template>
  <slot></slot>
</template>

<script setup lang="ts">
import {
  flushTransactions,
  sql,
} from '@/api'
import {
  EN_COMMENT_KEYS,
  getNodeIdByCommentId,
  provideCommentIdList,
  provideCommentInfoList,
} from '@/modules/Comment/Comment'
import { injectGlobalWindowData } from '@/modules/EnModuleControl/ModuleProvide'
import { debounce } from '@/utils'
import { useSiyuanEventTransactions } from '@/utils/EventBusHooks'
import {
  computed,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from 'vue'


const commentIdList = ref([])
provideCommentIdList(commentIdList)

const commentInfoList = ref<EnCommentInfo[]>([])
provideCommentInfoList(commentInfoList)


const globalWindowData = injectGlobalWindowData()
const protyleContentRefList = computed<IProtyleObserverItem[]>(() => {
  return globalWindowData.value.protyleList
})

const getAllCommentIds = async () => {
  await flushTransactions()
  const protyleBlockIdList = protyleContentRefList.value.map((i) => i.protyleBlockId)

  if (!protyleBlockIdList.length) {
    commentIdList.value = []
    commentInfoList.value = []
    return
  }

  // 根据当前打开的 protyle 里，所有块的 id
  // 获取所有评论了这些块的 commentId
  const sqlStmt = `
    with comment_ids as (
      select distinct
        CASE
          WHEN b.type = 'd' THEN b.id
          ELSE b.root_id
        END as id,
        b.root_id as comment_for_doc_id
      from
        blocks b
      where
        id in (${protyleBlockIdList.map((i) => `'${i}'`).join(',')})
      union
      select distinct
        b.id as id,
        b.root_id as comment_for_doc_id
      from
        blocks b
      where
        root_id in (
          select
            CASE
              WHEN type = 'd' THEN id
              ELSE root_id
            END
          from
            blocks
          where
            id in (${protyleBlockIdList.map((i) => `'${i}'`).join(',')})
        )
    )
    select
      a.*,
      c.comment_for_doc_id as comment_for_doc_id
    from
      attributes a
      inner join comment_ids c
    where
      a.name = '${EN_COMMENT_KEYS.nodeCommentRefKey}'
      and a.value like '${EN_COMMENT_KEYS.commentIdPrefix}-' || c.id || '-%'
    limit
      9999999
  `
  const res = await sql(sqlStmt)
  commentIdList.value = res.map((i) => i.value)
  const newCommentInfoList = res.map((i) => {
    return {
      commentId: i.value,
      commentForDocId: i.comment_for_doc_id,
      commentForNodeId: getNodeIdByCommentId(i.value),
      commentBlockId: i.block_id,
    }
  })
  const isSame = commentInfoList.value.length === newCommentInfoList.length && commentInfoList.value.every((i) => newCommentInfoList.some((j) => j.commentId === i.commentId))
  if (!isSame) {
    commentInfoList.value = newCommentInfoList
  }
}



const debouncedGetAllCommentIds = debounce(getAllCommentIds, 1000)

watch(protyleContentRefList, () => {
  debouncedGetAllCommentIds()
}, { immediate: true })

onMounted(() => {
  debouncedGetAllCommentIds()
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
