<template>

</template>

<script setup lang="ts">
import { debounce } from '@/utils'
import {
  onBeforeUnmount,
  onMounted,
} from 'vue'

const handler = debounce(() => {
  document.body.setAttribute('arco-theme', document.documentElement.dataset.themeMode)
}, 100)

let observer = null
onMounted(() => {
  handler()
  observer = new MutationObserver(handler)
  observer.observe(document.documentElement, {
    attributes: true,
  })
})
onBeforeUnmount(() => {
  observer?.disconnect()
  observer = null
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

  svg.arco-icon {
    fill: none;
  }
}
</style>
