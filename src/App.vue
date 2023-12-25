<template>
  <div class="SyEnhancerApp">
    <HackUI />

    <FixedTools v-if="showFloatingBall" />

    <LifeLog />

    <FixedDocArea v-if="!plugin.isMobile" />
  </div>
</template>

<script setup>
import { computed, onMounted, watch } from 'vue';
import FixedTools from './components/FixedTools.vue';
import { autoSync, insertBlockTime, syncLocalStorage, useSettings } from './logic';
import { usePlugin } from './main';
import LifeLog from './components/LifeLog/LifeLog.vue';
import FixedDocArea from './components/FixedDocArea.vue';
import HackUI from './components/HackSiyuan/HackUI.vue';
const settings = useSettings()

watch(() => settings.value.useVipStyle, () => {
  document.documentElement.dataset.enhancer = `${settings.value.useVipStyle}`
})

watch(() => settings.value.enableBlockTime, () => {
  document.documentElement.dataset.enhancerEnableBlockTime = `${settings.value.enableBlockTime}`
})
watch(() => settings.value.blockTimeFontSize, () => {
  const isEnableBlockTime = settings.value.enableBlockTime
  if (isEnableBlockTime) {
    document.documentElement.style.setProperty('--timeFontSize', `${settings.value.blockTimeFontSize}px`)
  }
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

  autoSync()

  insertBlockTime();
})

</script>

<style lang="scss">

</style>
