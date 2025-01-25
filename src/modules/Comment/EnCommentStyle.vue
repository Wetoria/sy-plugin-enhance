<template>
  <slot></slot>
</template>

<script setup lang="ts">
import {
  EN_COMMENT_KEYS,
  getNodeIdByCommentId,
  injectCommentIdList,
  injectCommentOptions,
} from '@/modules/Comment/Comment'
import { useRegisterStyle } from '@/utils/DOM'
import {
  onBeforeUnmount,
  watchEffect,
} from 'vue'

const commentOptions = injectCommentOptions()

// #region 监听思源事件，更新评论样式
const commentIdList = injectCommentIdList()

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



// #endregion 监听思源事件，更新评论样式
</script>

<style lang="scss" scoped>

</style>
