<template>
  <a-tooltip
    :popupVisible="tooltipVisible"
    @update:popupVisible="onPopupVisibleChange"
  >
    <template #content>
      <slot name="prompt"/>
    </template>
    <a-button
      class="EnButtonIcon"
      size="small"
      type="text"
      v-bind="$attrs"
      @click="onClick"
    >
      <template #icon>
        <slot />
      </template>
    </a-button>
  </a-tooltip>
</template>

<script setup lang="ts">
import { usePlugin } from '@/main'
import { ref } from 'vue'

const plugin = usePlugin()
const emit = defineEmits<{
  (e: 'click'): void
}>()

const tooltipVisible = ref(false)
const onPopupVisibleChange = (visible: boolean) => {
  if (plugin.isMobile) {
    return
  }
  tooltipVisible.value = visible
}

const onClick = () => {
  emit('click')
}
</script>

<style lang="scss" scoped>
.EnButtonIcon {
  border-radius: var(--b3-border-radius);
}
</style>