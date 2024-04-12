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
const indicatorRef = ref();
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
