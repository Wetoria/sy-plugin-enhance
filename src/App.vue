<template>
  <div
    id="SyEnhancerApp"
    class="SyEnhancerApp"
    ref="SyEnhancerAppRef"
  >
    <div class="displayArea">
      <HackUI />
    </div>
    <div class="hiddenArea">

    </div>
    <TopBarEntry />
    <FixedTools v-if="showFloatingBall" />
    <LifeLog />
    <!-- <FixedDocArea v-if="!plugin.isMobile" /> -->
    <HackEditor />
    <Teleport to="html">
      <div class="enBackground">
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, watch, ref, watchEffect } from 'vue';
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
import { listenerViewport, useViewportInfo } from './logic/Viewport';
const settings = useSettings()

registerShortcutKey();

watch(() => settings.value.useVipStyle, () => {
  document.documentElement.dataset.enhancer = `${settings.value.useVipStyle}`
})


const plugin = usePlugin()

const isMobile = computed(() => plugin.isMobile)
const SyEnhancerAppRef = ref<HTMLDivElement>(null)

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

const ViewportInfo = useViewportInfo()
const position = ref({
  top: 0,
  height: undefined,
})
watchEffect(() => {
  if (!SyEnhancerAppRef.value) {
    return
  }
  const {
    top,
    height,
  } = ViewportInfo.value
  if (position.value.top !== top) {
    SyEnhancerAppRef.value.style.top = ViewportInfo.value.top + 'px'
    position.value.top = top
  }
  if (ViewportInfo.value.height) {
    if (position.value.height !== height) {
      SyEnhancerAppRef.value.style.height = ViewportInfo.value.height + 'px'
      position.value.height = height
    }
  }
})

onMounted(() => {
  addEventListener("storage", syncLocalStorage);
  // listenerViewport()
  autoSync()
})
</script>

<style lang="scss">
#enApp {
  width: 100vw;
  height: 100dvh;
  max-height: 100vh;
  position: absolute;
  top: 0px;
  left: 0px;
  pointer-events: none;
  box-sizing: border-box;
}
.SyEnhancerApp {
  width: 100%;
  height: 100%;
  max-height: 100vh;
  box-sizing: border-box;
  pointer-events: none;

  position: absolute;
  top: 0;
  left: 0;
  z-index: 1;
  display: flex;
  flex-wrap: nowrap;

  .displayArea,
  .hidderArea {
    width: 100%;
    height: 100%;
    pointer-events: none;
  }
  .displayArea {
    display: flex;
    position: relative;
  }

  .hidderArea {
    display: none;
  }
}
.enBackground {
  background-repeat: no-repeat;
  background-attachment: fixed;
  background-size: cover;
  background-position: center center;
  width: 100%;
  height: 100%;
  position: absolute;
  z-index: -10000;
  top: 0;
  left: 0;
  pointer-events: none;
  background-image: url('./bg.png');
}
body {
  opacity: 0.815;
}
</style>
