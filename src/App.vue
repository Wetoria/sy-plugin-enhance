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
        <TestArco />
      </div>
      <div class="hiddenArea">

      </div>

      <!-- 全平台 -->
      <template>
        <EnSettings />
        <EnSiyuanEntry />
        <EnEditor />
        <EnBackgroundImg v-if="isVip" />
        <EnOthers />
        <EnQuickNote v-if="isNotFree" />
        <ArcoDartkTheme />

        <DailyNote />
        <LifeLog />
        <EnVideoAndAudio v-if="isNotFree" />
      </template>

      <!-- 仅移动端 -->
      <template v-if="plugin.isMobile">
        <EnPWA />
        <EnMobileNav />

      </template>

      <!-- 仅桌面端 -->
      <template v-else>

      </template>

      <!-- <FixedDocArea v-if="!plugin.isMobile" /> -->
    </div>
  </a-config-provider>
</template>

<script setup lang="ts">
import { watchEffect } from 'vue';
import { usePlugin } from './main';
import EnSiyuanEntry from './modules/EnSiyuanEntry.vue';


import LifeLog from './modules/LifeLog/LifeLog.vue';
import TestArco from './modules/Test/TestArco.vue';
import ArcoDartkTheme from './modules/ArcoDartkTheme.vue';
import EnPWA from './modules/EnPWA.vue';
import DailyNote from './modules/DailyNote/DailyNote.vue';
import EnSettings, { isPro, isVip, isNotFree } from './modules/Settings/EnSettings.vue';
import EnOthers from './modules/EnOthers.vue';
import EnBackgroundImg from './modules/Background/EnBackgroundImg.vue';
import EnQuickNote from './modules/QuickNote/EnQuickNote.vue';
import EnEditor from './modules/Editor/EnEditor.vue';
import EnMobileNav from './modules/EnMobileNav.vue';
import EnVideoAndAudio from './modules/EnVideoAndAudio.vue';

const plugin = usePlugin()

watchEffect(() => {
  document.documentElement.dataset.enhancerIsMobile = `${plugin.isMobile}`
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

.flexCenter {
  display: flex;
  justify-content: center;
  align-items: center;
}

.flexJustifyCenter {
  display: flex;
  justify-content: center;
}

.flexAlignCenter {
  display: flex;
  align-items: center;
}
.enGap {
  display: flex;
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
