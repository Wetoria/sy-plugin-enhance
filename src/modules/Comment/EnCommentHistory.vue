<template>

</template>

<script setup lang="ts">
import { injectCommentIdList } from '@/modules/Comment/Comment'

const commentIdList = injectCommentIdList()
// watchEffect(() => {
//   console.log('commentIdList', commentIdList?.value)
// })
</script>

<style lang="scss" scoped>

</style>
