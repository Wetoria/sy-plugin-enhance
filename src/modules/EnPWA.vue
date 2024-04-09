<template>

</template>

<script setup lang="ts">
import { useEnhancer } from '@/modules/GlobalStatus';
import { onMounted } from 'vue';

const EnhancerState = useEnhancer()

onMounted(() => {
  const metaDom = document.createElement('meta')
  metaDom.name = "apple-mobile-web-app-status-bar-style"
  metaDom.content = "black-translucent"

  const headDom = document.documentElement.querySelector('head')
  if (headDom) {
    headDom.appendChild(metaDom)
  }

  // @ts-ignore
  const isStandalone = window.navigator.standalone
  EnhancerState.value.isStandalone = isStandalone
  if (isStandalone) {
    document.documentElement.dataset.enIsStandalone = isStandalone
  }
  document.documentElement.dataset.enOrientation = window.screen.orientation.type
  window.screen.orientation.addEventListener('change', (event) => {
    document.documentElement.dataset.enOrientation = (event.target as ScreenOrientation).type
  })
})
</script>

<style lang="scss">

</style>
