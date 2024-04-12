<template>
  <div
    class="enhanceToBottomIndicator"
    :data-node-id="blockId"
    ref="indicatorRef"
  ></div>
</template>

<script setup lang="ts">
import { ref } from "vue";

defineProps<{
  blockId: string;
}>();
</script>

<script lang="ts">
const indicatorRef = ref<HTMLDivElement>();

export function jumpToProtyleBottom(docId) {
  if (!docId) {
    return
  }

  const isTarget = indicatorRef.value.dataset.nodeId === docId
  if (!isTarget) {
    return
  }

  indicatorRef.value.scrollIntoView(false)

  const enhanceProtyleBottomContainer = indicatorRef.value.parentElement
  if (enhanceProtyleBottomContainer) {
    enhanceProtyleBottomContainer.parentElement.scrollTop += 80
  }
}
</script>

<style lang="scss" scoped>
html[data-en-debugging="true"] {
  .enhanceToBottomIndicator {
    background: var(--sky-blue);
  }
}
.enhanceToBottomIndicator {
  width: 100%;
  height: 2px;
}
</style>
