<template>
  <slot></slot>
</template>

<script setup lang="ts">
import { sql } from '@/api'
import {
  EN_COMMENT_KEYS,
  provideCommentIdList,
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

const globalWindowData = injectGlobalWindowData()
const protyleContentRefList = computed<IProtyleObserverItem[]>(() => {
  return globalWindowData.value.protyleList
})

const getAllCommentIds = async () => {
  const protyleBlockIdList = protyleContentRefList.value.map((i) => i.protyleBlockId)

  if (!protyleBlockIdList.length) {
    commentIdList.value = []
    return
  }

  const sqlStmt = `
    with comment_ids as (
      select distinct
        CASE
          WHEN b.type = 'd' THEN b.id
          ELSE b.root_id
        END as id
      from
        blocks b
      where
        id in (${protyleBlockIdList.map((i) => `'${i}'`).join(',')})
      union
      select distinct
        b.id
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
      a.*
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
