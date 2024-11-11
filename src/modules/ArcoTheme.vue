<template>

</template>

<script setup lang="ts">
import { debounce } from '@/utils';
import { onMounted } from 'vue';

onMounted(() => {
  const handler = () => {
    document.body.setAttribute('arco-theme', document.documentElement.dataset.themeMode)
  }
  handler()
  const observer = new MutationObserver(debounce(handler, 100));
  observer.observe(document.documentElement, {
    attributes: true,
  })
})
</script>

<style lang="scss">

</style>
