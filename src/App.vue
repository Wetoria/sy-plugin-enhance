<template>
  <a-config-provider
    size="mini"
  >
    <div
      id="SyEnhancerApp"
      class="SyEnhancerApp"
    >
      <div
        id="SyEnhancerAppDisplayArea"
        class="displayArea"
      >
        <div
          ref="EnProtyleUtilAreaRef"
          class="EnProtyleUtilArea"
        ></div>
      </div>
      <div
        id="SyEnhancerAppHiddenArea"
        class="hiddenArea"
      >

      </div>
      <ModuleControl />

      <!-- <FixedDocArea v-if="!plugin.isMobile" /> -->
    </div>
  </a-config-provider>
</template>

<script setup lang="ts">
import ModuleControl from '@/modules/EnModuleControl/ModuleControl.vue'

import {
  registerGlobalObserver,
  useEnProtyleUtilAreaRef,
} from '@/utils/DOM'

const EnProtyleUtilAreaRef = useEnProtyleUtilAreaRef()

registerGlobalObserver()
</script>

<style lang="scss">
:root {
  --sky-blue: #00bfff;
  --sky-blue-blur: #00bfff7f;

  --en-gap: var(--b3-border-radius);
  // --b3-theme-background: #000;
}

.flexRow,
.row {
  display: flex;
  gap: var(--en-gap);
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

  z-index: 10;
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

.body--window {

  #layouts {
    div[data-type="wnd"] {
      background: var(--b3-theme-background);
    }
  }
}
</style>
