<template>
  <div class="SyEnhancerApp">
    <FixedTools v-if="showFloatingBall" />
  </div>
</template>

<script setup>
import { computed, onMounted, watch } from 'vue';
import FixedTools from './components/FixedTools.vue';
import { syncLocalStorage, useSettings } from './logic';
import { usePlugin } from './main';

const settings = useSettings()

watch(() => settings.value.useVip, () => {
  document.documentElement.dataset.enhancer = `${settings.value.useVip}`
})

const plugin = usePlugin()

const isMobile = computed(() => plugin.isMobile)

const showFloatingBall = computed(() => {
  const floatingBallPlatform = settings.value.floatingBallPlatform
  if (floatingBallPlatform === 'none') {
    return false;
  }
  if (floatingBallPlatform === 'all') {
    return true
  }
  if (!isMobile.value) {
    return false
  }
  return true
})

onMounted(() => {
  addEventListener("storage", syncLocalStorage);
})

</script>

<style lang="scss">

</style>
