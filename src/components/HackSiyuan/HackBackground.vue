<template>
  <Teleport to="html">
    <div class="enBackground" id="enhancerContainer">
      <div
        class="enPWAPadding1"
      ></div>
      <div
        class="enPWAMain"
      ></div>
      <div
        class="enPWAPadding2"
      ></div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">

</script>

<style lang="scss">
.enBackground {
  background-repeat: no-repeat;
  background-attachment: fixed;
  background-size: cover;
  background-position: center center;
  width: 100%;
  height: 100vh;
  position: absolute;
  z-index: -10000;
  top: 0;
  left: 0;
  pointer-events: none;
  background-image: url('./bg.png');
  display: flex;
}
body {
  opacity: 0.9;
}

:root {
  --en-status-height: 56px;
  --en-toolbar-height: 30px;
}

html[data-en-is-standalone="true"] {
  height: 100vh;

  // 正常竖屏
  &[data-en-orientation="portrait-primary"] {

    body {
      #menu,
      .b3-dialog__container {
        padding-top: var(--en-status-height);
      }
    }
    .enPWAPadding1 {
      width: 100%;
      height: var(--en-status-height);
      background-color: var(--b3-theme-background);
      opacity: 0.9;
    }
  }

  // 左横屏
  &[data-en-orientation="landscape-primary"] {
    body {
      padding-left: var(--en-status-height);
      padding-right: var(--en-toolbar-height);
    }

    .enPWAPadding1 {
      width: var(--en-status-height);
      height: 100%;
      background-color: var(--b3-theme-background);
      opacity: 0.9;
    }
    .enPWAMain {
      flex: 1;
    }
    .enPWAPadding2 {
      width: var(--en-toolbar-height);
      height: 100%;
      background-color: var(--b3-theme-background);
      opacity: 0.9;
    }

    #menu,
    .b3-menu,
    .b3-dialog__container {
      box-sizing: border-box;
      padding: 0px 30px 8px 56px;
    }
  }

  // 右横屏
  &[data-en-orientation="landscape-secondary"] {
    body {
      padding-right: var(--en-status-height);
      padding-left: var(--en-toolbar-height);
    }

    .enPWAPadding2 {
      width: var(--en-status-height);
      height: 100%;
      background-color: var(--b3-theme-background);
      opacity: 0.9;
    }
    .enPWAMain {
      flex: 1;
    }
    .enPWAPadding1 {
      width: var(--en-toolbar-height);
      height: 100%;
      background-color: var(--b3-theme-background);
      opacity: 0.9;
    }

    #menu,
    .b3-menu,
    .b3-dialog__container {
      box-sizing: border-box;
      padding: 0px 56px 8px 30px;
    }
  }
}

@media screen and (orientation: portrait) {
  html[data-en-is-standalone="true"] {
    padding-top: var(--en-status-height);
  }
}

@media screen and (orientation: landscape) {
  .side-panel {
    width: calc(100vw - 86px);
  }
}

</style>
