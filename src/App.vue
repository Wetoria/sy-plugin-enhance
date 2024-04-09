<template>
  <a-config-provider
    size="small"
  >
    <div
      id="SyEnhancerApp"
      class="SyEnhancerApp"
      ref="SyEnhancerAppRef"
    >
      <div class="displayArea">
        <HackUI />
        <TestArco />
      </div>
      <div class="hiddenArea">

      </div>

      <!-- 全平台 -->
      <template>
        <EnSettings />
        <DailyNote />
        <EnSiyuanEntry />
        <LifeLog />
        <HackEditor />
        <EnBackgroundImg />
        <EnOthers />
        <ArcoDartkTheme />
      </template>

      <!-- 仅移动端 -->
      <template v-if="plugin.isMobile">
        <EnPWA />

      </template>

      <!-- 仅桌面端 -->
      <template v-else>

      </template>

      <!-- <FixedDocArea v-if="!plugin.isMobile" /> -->
    </div>
  </a-config-provider>
</template>

<script setup lang="ts">
import { computed, onMounted, watch, ref, watchEffect } from 'vue';
import { usePlugin } from './main';
import EnSiyuanEntry from './modules/EnSiyuanEntry.vue';


import LifeLog from './modules/LifeLog/LifeLog.vue';
import FixedDocArea from './components/FixedDocArea.vue';
import HackUI from './components/HackSiyuan/HackUI.vue';
import { syncLocalStorage, useSettings } from './logic/Settings.ts';
import HackEditor from './components/HackEditor.vue';
import { listenerViewport, useViewportInfo } from './logic/Viewport';
import TestArco, { TestArcoType, testFunc } from './modules/Test/TestArco.vue';
import ArcoDartkTheme from './modules/ArcoDartkTheme.vue';
import EnPWA from './modules/EnPWA.vue';
import DailyNote from './modules/DailyNote/DailyNote.vue';
import EnSettings from './modules/Settings/EnSettings.vue';
import EnOthers from './modules/EnOthers.vue';
import EnBackgroundImg from './modules/Background/EnBackgroundImg.vue';
const settings = useSettings()

const plugin = usePlugin()

const isMobile = computed(() => plugin.isMobile)
// const SyEnhancerAppRef = ref<HTMLDivElement>(null)

// const showFloatingBall = computed(() => {
//   const floatingBallPlatform = settings.value.floatingBallPlatform
//   if (floatingBallPlatform === 'none') {
//     return false;
//   }
//   if (floatingBallPlatform === 'all') {
//     return true
//   }
//   if (!isMobile.value) {
//     return false
//   }
//   return true
// })

// const ViewportInfo = useViewportInfo()
// const position = ref({
//   top: 0,
//   height: undefined,
// })
watchEffect(() => {
  // if (!SyEnhancerAppRef.value) {
  //   return
  // }
  // const {
  //   top,
  //   height,
  // } = ViewportInfo.value
  // if (position.value.top !== top) {
  //   SyEnhancerAppRef.value.style.top = ViewportInfo.value.top + 'px'
  //   position.value.top = top
  // }
  // if (ViewportInfo.value.height) {
  //   if (position.value.height !== height) {
  //     SyEnhancerAppRef.value.style.height = ViewportInfo.value.height + 'px'
  //     position.value.height = height
  //   }
  // }
})

onMounted(() => {
  addEventListener("storage", syncLocalStorage);
  // listenerViewport()
})
</script>

<style lang="scss">
:root {
  --sky-blue: #00bfff;
  --sky-blue-blur: #00bfff7F;

  --en-gap: 8px;
  // --b3-theme-background: #000;
}

.flexColumn {
  display: flex;
  flex-direction: column;
  gap: var(--en-gap);
}

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
    padding: 24px;
    box-sizing: border-box;
  }

  .hidderArea {
    display: none;
  }
}
</style>
