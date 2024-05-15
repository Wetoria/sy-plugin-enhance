<template>
  <span
    :class="`enBlockTimeContainer ${updatedFormatted ? 'updated' : ''}`"
    @click="showCreated = !showCreated"
    v-html="styledFormatted"
  >
  </span>
</template>

<script setup lang="ts">
import dayjs from 'dayjs';
import { computed, ref, watchEffect } from 'vue';

const props = defineProps<{
  pDom: HTMLDivElement
  updated: undefined | dayjs.Dayjs
  updatedFormatted: string
  created: undefined | dayjs.Dayjs
  createdFormatted: string
  defaultBlockType: 'created' | 'updated'
}>()

const replaceColon = (value) => {
  return value.replace(/\d:/g, '<span class="EnBlockTimeDivider">:</span>')
}

const styledFormatted = computed(() => {
  let value = showCreated.value ? props.createdFormatted : props.updatedFormatted
  value = replaceColon(value)
  return value
})

const showCreated = ref(props.defaultBlockType === 'created')
watchEffect(() => {
  showCreated.value = props.defaultBlockType === 'created'
})
</script>

<style lang="scss" scoped>
.enBlockTimeContainer {
  font-family: monospace;
  position: relative;
  font-size: var(--timeFontSize);

  :deep(.EnBlockTimeDivider) {
    color: var(--sky-blue);
    font-size: var(--timeFontSize);
  }
}
</style>
