<template>
  <span
    :class="`enBlockTimeContainer ${updatedFormatted ? 'updated' : ''}`"
    @click="showCreated = !showCreated"
  >
    {{ showCreated ? createdFormatted : updatedFormatted }}
  </span>
</template>

<script setup lang="ts">
import dayjs from 'dayjs';
import { ref, watchEffect } from 'vue';

const props = defineProps<{
  pDom: HTMLDivElement
  updated: undefined | dayjs.Dayjs
  updatedFormatted: string
  created: undefined | dayjs.Dayjs
  createdFormatted: string
  defaultBlockType: 'created' | 'updated'
}>()

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

  &.updated {
    &::before {
      content: '             /  /     :  :  ';
      white-space: pre;
      position: absolute;
      left: 0;
      top: 0;
      font-size: var(--timeFontSize);
      color: var(--sky-blue);
    }
  }
}
</style>
