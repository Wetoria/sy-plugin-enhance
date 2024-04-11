<template>
  <span
    class="enBlockTimeContainer"
    @click="showCreated = !showCreated"
  >
    {{ showCreated ? createdStr : updatedStr }}
  </span>
</template>

<script setup lang="ts">
import dayjs from 'dayjs';
import { computed, ref } from 'vue';

const props = defineProps<{
  pDom: HTMLDivElement
}>()

const FORMAT_TIME = 'YYYY/MM/DD HH:mm:ss'

const updated = computed(() => {
  const updateTimeStr = props.pDom.getAttribute('updated')
  return dayjs(updateTimeStr)
})
const updatedStr = computed(() => `updated: ${updated.value.format(FORMAT_TIME)}`)
const created = computed(() => {
  const nodeId = props.pDom.dataset.nodeId
  const createdInId = nodeId.split('-')[0]
  props.pDom.setAttribute('created', createdInId)
  return dayjs(createdInId)
})
const createdStr = computed(() => `created: ${created.value.format(FORMAT_TIME)}`)

const showCreated = ref(true)
</script>

<style lang="scss" scoped>
.enBlockTimeContainer {
  font-family: monospace;
  position: relative;
  font-size: var(--timeFontSize);

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
</style>
