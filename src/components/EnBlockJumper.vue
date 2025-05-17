<template>
  <EnButtonIcon
    type="text"
    class="EnBlockJumper"
    @click="jumpToBlock"
    v-bind="$attrs"
  >
    <SyIcon
      name="iconOpen"
      :size="10"
    />
    <template #prompt>
      <slot>跳转原文</slot>
    </template>
  </EnButtonIcon>
</template>

<script setup lang="ts">
import EnButtonIcon from '@/components/EnButtonIcon.vue'
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