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
  // background-image: url('./bg.png');
  display: flex;
}
body {
  opacity: 0.9;
}

:root {
  --en-status-height: 56px;
  --en-toolbar-height: 30px;
}

</style>
