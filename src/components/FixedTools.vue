<template>
  <Teleport to="body">
    <div
      class="v-fixedTools"
      @mousedown="onMouseDown"
      @touchstart="onMouseDown"
      @click="onClick"
    >
      <svg class="v-fixedToolsIcon">
        <use xlink:href="#iconAdd"></use>
      </svg>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watchEffect } from 'vue';
import { Plugin, getFrontend } from 'siyuan';
import { usePlugin } from '@/main'
import { createTodayDailyNote } from '@/utils/DailyNoteHelper';

const storageKey = `vFixedToolPos-${getFrontend()}`;

enum Direction {
  TOP = 'top',
  TOP_LEFT = 'top-left',
  TOP_RIGHT = 'top-right',
  RIGHT = 'right',
  RIGHT_TOP = 'right-top',
  RIGHT_BOTTOM = 'right-bottom',
  LEFT = 'left',
  LEFT_TOP = 'left-top',
  LEFT_BOTTOM = 'left-bottom',
  BOTTOM = 'bottom',
  BOTTOM_LEFT = 'bottom-left',
  BOTTOM_RIGHT = 'bottom-right',
  RADIUS = 'radius',
  CIRCLE = 'circle',
  NONE = 'none'
}

const edgeFixedPos = ref(['', ''])
const position = ref({
  x: 0,
  y: 0,
});
const topCssValue = computed(() => `${position.value.y}px`)
const leftCssValue = computed(() => `${position.value.x}px`)

const plugin: Plugin = usePlugin();

watchEffect(() => {
  if (!plugin) return

  plugin.loadData(storageKey).then((pos) => {
    if (pos) {
      setPos(pos)
    }
  })
})

const setPosByEvent = (event) => {
  const posInfo = {
    x: (event.touches ? event.touches[0].clientX : event.clientX) - 25,
    y: (event.touches ? event.touches[0].clientY : event.clientY) - 25,
  }
  setPos(posInfo)
}

const setPos = (pos) => {
  position.value = pos;
  edgeFixedPos.value = ['', ''];
  if (position.value.x <= 0) {
    position.value.x = 0;
    edgeFixedPos.value[0] = Direction.LEFT
  }
  if (position.value.y <= 0) {
    position.value.y = 0;
    edgeFixedPos.value[1] = Direction.TOP
  }
  if (position.value.x >= document.body.clientWidth - 50) {
    position.value.x = document.body.clientWidth - 50;
    edgeFixedPos.value[0] = Direction.RIGHT
  }
  if (position.value.y >= document.body.clientHeight - 50) {
    position.value.y = document.body.clientHeight - 50;
    edgeFixedPos.value[1] = Direction.BOTTOM
  }
  if (plugin) {
    const posInfo = JSON.stringify(position.value);
    plugin.saveData(storageKey, posInfo)
  }
}

const onMove = (event) => {
  setPosByEvent(event)
}

const unregister = () => {
  document.body.removeEventListener('mousemove', onMove)
  document.body.removeEventListener('touchmove', onMove)
  document.body.removeEventListener('mouseup', unregister)
  document.body.removeEventListener('touchend', unregister)
  document.body.removeEventListener('mouseleave', unregister)
}

const onMouseDown = (event) => {
  setPosByEvent(event)

  document.body.addEventListener('mousemove', onMove)
  document.body.addEventListener('touchmove', onMove)
  document.body.addEventListener('mouseup', unregister)
  document.body.addEventListener('touchend', unregister)
  document.body.addEventListener('mouseleave', unregister)
}

const listenResize = () => {
  const newPosition = position.value;

  if (Direction.LEFT === edgeFixedPos.value[0]) {
    newPosition.x = 0
  } else if (Direction.RIGHT === edgeFixedPos.value[0]) {
    newPosition.x = document.body.clientWidth - 50
  }
  if (Direction.TOP === edgeFixedPos.value[1]) {
    newPosition.y = 0
  } else if (Direction.BOTTOM === edgeFixedPos.value[1]) {
    newPosition.y = document.body.clientHeight - 50
  }
  setPos(newPosition);
}
onMounted(() => {
  window.addEventListener('resize', listenResize)
})
onUnmounted(() => {
  window.removeEventListener('resize', listenResize)
})

const onClick = () => {
  createTodayDailyNote();
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
