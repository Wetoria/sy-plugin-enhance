<template>
  <a-tooltip :content="content || '跳转至目标块'">
    <template #content>
      <slot name="content" />
    </template>
    <a-link @click="jumpToBlock">
      <template #icon>
        <SyIcon
          name="iconOpen"
        />
      </template>
      跳转原文
    </a-link>
  </a-tooltip>
</template>

<script setup lang="ts">
import SyIcon from '@/components/SiyuanTheme/SyIcon.vue'
import { openDocById } from '@/utils/Note'


const props = defineProps<{
  blockId: string
  content?: string
}>()

const jumpToBlock = () => {
  openDocById(props.blockId)
}

</script>

<style lang="scss" scoped>

</style>