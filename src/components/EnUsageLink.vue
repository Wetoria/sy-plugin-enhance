<template>
  <a
    class="enUsageLink"
    @click="onClick"
  >
    <slot>详细说明</slot>
  </a>
</template>

<script setup lang="ts">
import { EN_CONTENT_ANCHOR_MAP } from '@/utils/Constants'
import { computed } from 'vue'

const props = defineProps<{
  url?: string
  part?: keyof typeof EN_CONTENT_ANCHOR_MAP
}>()
const baseDocUrl = `https://simplest-frontend.feishu.cn/docx/B3NndXHi7oLLXJxnxQmcczRsnse`
const finalUrl = computed(() => {
  if (props.url) {
    // 以后可以在这里控制跳转的域名
    return `${baseDocUrl}${props.url}`
  }
  const partPath = EN_CONTENT_ANCHOR_MAP[props.part]
  const replacedPartPath = partPath.replace(baseDocUrl, '')
  return `${baseDocUrl}${replacedPartPath}`
})

const onClick = (event: MouseEvent) => {
  event.preventDefault()
  window.open(finalUrl.value, '_blank')
}
</script>

<style lang="scss" scoped>
.enUsageLink {
  cursor: pointer;
}
</style>
