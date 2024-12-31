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
  --en-arco-resizebox-trigger-default-width: 6px;

  .arco-resizebox-trigger-icon-wrapper {
    border-radius: var(--b3-border-radius);

    background-color: var(--b3-theme-surface);
    // background-color: var(--b3-theme-background);
    &:hover {
      background-color: var(--b3-theme-surface);
    }
  }

  [class*='arco-'] {
    svg {
      fill: none;
    }
  }
}
</style>
