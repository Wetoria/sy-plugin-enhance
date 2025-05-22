<template>
  <a-tooltip
    :popupVisible="tooltipVisible"
    @update:popupVisible="onPopupVisibleChange"
  >
    <template #content>
      <slot
        v-if="hasPrompt"
        name="prompt"
      />
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
import {
  computed,
  ref,
  useSlots,
} from 'vue'

const emit = defineEmits<{
  (e: 'click', event: MouseEvent): void | any
}>()
const plugin = usePlugin()
const tooltipVisible = ref(false)
const slots = useSlots()
const hasPrompt = computed(() => {
  return slots.prompt
})
const onPopupVisibleChange = (visible: boolean) => {
  if (plugin.isMobile) {
    return
  }
  if (!hasPrompt.value) {
    return
  }
  tooltipVisible.value = visible
}

const onClick = (event: MouseEvent) => {
  emit('click', event)
}

</script>

<style lang="scss" scoped>
.EnButtonIcon {
  border-radius: var(--b3-border-radius);
}
</style>
