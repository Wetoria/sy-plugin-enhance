<template>
  <div class="EnTagsContainer">
    <div
      v-if="fold"
      :style="{
        display: 'block',
        width: '100%',
      }"
    >
      <a-overflow-list>
        <slot></slot>
        <template #overflow="{ number }">
          <a-tag @click="fold = false">
            <div class="flexAlignCenter enGap EnTagsController">
              <SyIcon name="iconDown" />
              <span>+{{ number }}</span>
            </div>
          </a-tag>
        </template>
      </a-overflow-list>
    </div>
    <a-space
      v-else
      :wrap="true"
    >
      <slot></slot>
      <a-tag @click="fold = true">
        <div class="flexAlignCenter enGap EnTagsController">
          <SyIcon name="iconUp" />
          <span>收起</span>
        </div>
      </a-tag>
    </a-space>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue"
import SyIcon from "./SiyuanTheme/SyIcon.vue"

const fold = ref(true)
</script>

<style lang="scss" scoped>
.EnTagsContainer {
  display: flex;
  flex-wrap: wrap;
  gap: var(--en-gap);

  :deep(.arco-overflow-list-overflow) {
    display: flex;
  }

  .EnTagsController {
    color: var(--sky-blue);
  }
}
</style>
