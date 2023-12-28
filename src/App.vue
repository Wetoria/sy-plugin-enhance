<template>
  <div class="SyEnhancerApp">
    <TopBarEntry />
    <!-- <HackUI /> -->
    <FixedTools v-if="showFloatingBall" />
    <LifeLog />
    <FixedDocArea v-if="!plugin.isMobile" />
    <HackEditor />
  </div>
</template>

<script setup>
import { computed, onMounted, watch } from 'vue';
import FixedTools from './components/FixedTools.vue';
import { autoSync } from './logic';
import { usePlugin } from './main';
import LifeLog from './components/LifeLog/LifeLog.vue';
import FixedDocArea from './components/FixedDocArea.vue';
import HackUI from './components/HackSiyuan/HackUI.vue';
import { registerShortcutKey } from './logic/ShortcutKey.ts';
import TopBarEntry from './components/TopBarEntry.vue';
import { syncLocalStorage, useSettings } from './logic/Settings.ts';
import HackEditor from './components/HackEditor.vue';
const settings = useSettings()

registerShortcutKey();

watch(() => settings.value.useVipStyle, () => {
  document.documentElement.dataset.enhancer = `${settings.value.useVipStyle}`
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
})
</script>

<style lang="scss">
.SyEnhancerApp {
  position: fixed;
  width: 100vw;
  height: 100dvh;
  box-sizing: border-box;
  pointer-events: none;
  border: 2px solid red;
  top: 0;
  left: 0;
  z-index: 100;
}
</style>
