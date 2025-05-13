<template>
  <a-tooltip :content="content || '跳转至目标块'">
    <template #content>
      <slot name="content" />
    </template>
    <a-link @click="jumpToBlock" class="EnBlockJumper">
      <template #icon>
        <SyIcon
          name="iconOpen"
          :size="10"
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

const emits = defineEmits<{
  (e: 'click'): void
  (e: 'beforeJump'): boolean
}>()

const jumpToBlock = () => {
  emits('click')
  const jump = emits('beforeJump')
  if (typeof jump === 'boolean' && !jump) {
    return
  }
  openDocById(props.blockId)
}

</script>

<style lang="scss" scoped>
.EnBlockJumper {
  :deep(.arco-link-icon) {
    display: flex;
  }
}
</style>