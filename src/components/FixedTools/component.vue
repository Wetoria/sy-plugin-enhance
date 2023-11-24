<template>
  <div
    class="v-fixedTools"
    @mousedown="onMouseDown"
    @touchstart="onMouseDown"
  >
    <svg class="v-fixedToolsIcon">
      <use xlink:href="#iconAdd"></use>
    </svg>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';

const startPos = ref({
  x: 0,
  y: 0,
});
const topCssValue = computed(() => `${startPos.value.y}px`)
const leftCssValue = computed(() => `${startPos.value.x}px`)

const setPos = (event) => {
  startPos.value = {
    x: (event.touches ? event.touches[0].clientX : event.clientX) - 25,
    y: (event.touches ? event.touches[0].clientY : event.clientY) - 25,
  }
  if (startPos.value.x < 0) {
    startPos.value.x = 0;
  }
  if (startPos.value.y < 0) {
    startPos.value.y = 0;
  }
  if (startPos.value.x > document.body.clientWidth - 25) {
    startPos.value.x = document.body.clientWidth - 25;
  }
  if (startPos.value.y > document.body.clientHeight - 25) {
    startPos.value.y = document.body.clientHeight - 25;
  }
}

const onMove = (event) => {
  setPos(event)
}

const unregister = () => {
  console.log('unregister')
  document.body.removeEventListener('mousemove', onMove)
  document.body.removeEventListener('touchmove', onMove)
  document.body.removeEventListener('mouseup', unregister)
  document.body.removeEventListener('touchend', unregister)
  document.body.removeEventListener('mouseleave', unregister)
}

const onMouseDown = (event) => {
  setPos(event)

  document.body.addEventListener('mousemove', onMove)
  document.body.addEventListener('touchmove', onMove)
  document.body.addEventListener('mouseleave', unregister)
  document.body.addEventListener('touchend', unregister)
  document.body.addEventListener('mouseup', unregister)
}
</script>


<style lang="scss" scoped>
.v-fixedTools {
  width: 50px;
  height: 50px;
  border-radius: 100%;

  display: flex;
  justify-content: center;
  align-items: center;

  cursor: pointer;

  position: fixed;
  top: v-bind(topCssValue);
  left: v-bind(leftCssValue);
  // top: 50%;
  // left: 50%;
  // top: 300px;
  // left: 100px;
  background-color: rgba(0, 0, 0, 0.3);
  z-index: 999;

  & .v-fixedToolsIcon {
    font-size: 18px;
    width: 22px;
    height: 22px;
    color: rgba(255, 255, 255, 0.7);
  }
}
.v-fixedTools:hover {
  background-color: rgba(255, 255, 255);
  & .v-fixedToolsIcon {
    color: rgba(0, 0, 0, 0.6);
  }
}
</style>
