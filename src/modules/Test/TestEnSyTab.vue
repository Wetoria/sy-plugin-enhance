<template>
  <EnSyTab
    ref="enSyTabRef"
    v-model:visible="visible"
    name="EnSyTabTest"
    title="叶归"

    @init="() => console.log('init')"
    @opened="() => console.log('opened')"
    @resize="() => console.log('resize')"
    @beforeClose="() => console.log('beforeClose')"
    @closed="() => console.log('closed')"
  >
    <div>测试自定义页签</div>
  </EnSyTab>
  <div
    style="pointer-events: auto;"
  >
    <!-- 通过 v-model:visible 控制页签的显示 -->
    <a-button
      @click="visible = !visible"
    >
      {{ visible ? '关闭页签' : '开启页签' }}
    </a-button>

    <!-- 通过 ref 控制页签的显示 -->
    <a-button
      @click="visible ? enSyTabRef.close() : enSyTabRef.open()"
    >
      {{ visible ? '关闭页签' : '开启页签' }}
    </a-button>

    <!-- 通过 ref 控制页签的打开位置 - 右侧分屏 -->
    <a-button
      @click="enSyTabRef.open({ position: 'right' })"
    >
      右侧分屏打开
    </a-button>

    <!-- 通过 ref 控制页签的打开位置 - 底部分屏 -->
    <a-button
      @click="enSyTabRef.open({ position: 'bottom' })"
    >
      底部分屏打开
    </a-button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'


const visible = ref(false)
const enSyTabRef = ref()
</script>

<style lang="scss" scoped>

</style>
