<!-- App.vue 仅负责提供全局的显示区域 -->
<!-- 其他逻辑全都封装至 ModuleControl 中 -->
<template>
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
      <ModuleControl />
    </div>
  </div>
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
@use '/src/styles/index.scss';

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

  .displayArea {
    width: 100%;
    height: 100%;
    pointer-events: none;
  }
  .displayArea {
    display: flex;
    position: relative;
    padding: 24px;
    box-sizing: border-box;

    .EnProtyleUtilArea {
      pointer-events: auto;
    }
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
