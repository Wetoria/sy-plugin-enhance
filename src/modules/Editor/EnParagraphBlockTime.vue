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
import { computed, ref, watchEffect } from 'vue';

const props = defineProps<{
  pDom: HTMLDivElement
  defaultBlockType: 'created' | 'updated'
}>()

const updated = ref(getUpdated(props.pDom))

const updatedStr = computed(() => updated.value ? `updated: ${updated.value.format(FORMAT_TIME)}` : '')
const created = computed(() => {
  const nodeId = props.pDom.dataset.nodeId
  const createdInId = nodeId.split('-')[0]
  props.pDom.setAttribute('created', createdInId)
  return dayjs(createdInId)
})
const createdStr = computed(() => `created: ${created.value.format(FORMAT_TIME)}`)

const showCreated = ref(props.defaultBlockType === 'created')
watchEffect(() => {
  showCreated.value = props.defaultBlockType === 'created'
})
setInterval(() => {
    // 每秒更新段落更新时间
    const newUpdated = getUpdated(props.pDom)
    updated.value = newUpdated
  }, 1000)
</script>

<script lang="ts">
export const FORMAT_TIME = 'YYYY/MM/DD HH:mm:ss'

export const getUpdated = (pDom) => {
  const updateTimeStr = pDom.getAttribute('updated')
  if (!updateTimeStr) {
    return
  }
  return dayjs(updateTimeStr)
}
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
