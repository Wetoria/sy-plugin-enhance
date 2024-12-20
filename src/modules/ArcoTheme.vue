<template>

</template>

<script setup lang="ts">
import { debounce } from '@/utils'
import { onMounted } from 'vue'

onMounted(() => {
  const handler = () => {
    document.body.setAttribute('arco-theme', document.documentElement.dataset.themeMode)
  }
  handler()
  const observer = new MutationObserver(debounce(handler, 100))
  observer.observe(document.documentElement, {
    attributes: true,
  })
})
</script>

<style lang="scss">
html {
  .arco-resizebox-trigger-icon-wrapper {
    // background-color: var(--b3-theme-background-light);
    background-color: var(--b3-theme-surface);
    border-radius: var(--b3-border-radius);

    &:hover {
      background-color: var(--b3-theme-background-light);
    }
  }
}
</style>
