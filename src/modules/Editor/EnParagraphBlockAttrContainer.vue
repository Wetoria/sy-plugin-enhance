<template>
  <Teleport
    :to="pProtyleAttrRef"
    v-if="pProtyleAttrRef"
  >
    <slot></slot>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';

const props = defineProps<{
  el: HTMLSpanElement
}>()
const pProtyleAttrRef = computed(() => {
  if (!props.el) return
  const protyleAttr = props.el.querySelector('.protyle-attr')
  if (!protyleAttr) return
  return protyleAttr.querySelector('.enProtyleAttrContainer')
})

</script>

<style lang="scss">

</style>
