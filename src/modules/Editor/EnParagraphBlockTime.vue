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
import { FORMAT_DATE, FORMAT_TIME } from './EnParagraphBlockAttrContainer.vue';

const props = defineProps<{
  pDom: HTMLDivElement
  updated: undefined | dayjs.Dayjs
  updatedFormatted: string
  created: undefined | dayjs.Dayjs
  createdFormatted: string
  defaultBlockType: 'created' | 'updated'
}>()

const styledFormatted = computed(() => {
  let value = showCreated.value ? props.created : props.updated
  if (!value) {
    return
  }
  const ymd = value.format(FORMAT_DATE)
    .replace(/\//g, `<span class="EnBlockTimeDivider ${showCreated.value ? 'showCreate' : 'showUpdated'}">/</span>`)
  const hms = value.format(FORMAT_TIME)
    .replace(/:/g, `<span class="EnBlockTimeDivider ${showCreated.value ? 'showCreate' : 'showUpdated'}">:</span>`)
  return `
    <span>
      <span class="enBlockTimeYMD">${ymd}</span>
      <span class="enBlockTimeHMS">${hms}</span>
    </span>
  `
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
    font-size: var(--timeFontSize);
    &.showUpdated {
      color: var(--sky-blue);
    }
  }
}
</style>
<style lang="scss">
.protyle-wysiwyg[data-en_is_dailynote] {
  & .enBlockTimeYMD {
    display: none;
  }
}
</style>
