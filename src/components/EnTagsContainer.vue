<template>
  <div
    class="EnTagsContainer"
    :style="{
      flexWrap: fold ? 'nowrap' : 'wrap'
    }"
  >
    <template v-if="fold">
      <div
        :style="{
          display: 'block',
          width: 'calc(100% - 42px)',
        }"
      >
        <a-overflow-list>
          <slot></slot>
          <template #overflow="{number}">
            <a-tag @click="fold = false">
              <div class="flexCenter enGap">
                <SyIcon name="iconDown" />
                <span>+{{ number }}</span>
              </div>
            </a-tag>
          </template>
        </a-overflow-list>
      </div>
    </template>
    <template v-else>
      <a-space :wrap="true">
        <slot></slot>
        <a-tag @click="fold = true">
          <div class="flexCenter enGap">
            <SyIcon name="iconUp" />
            <span>收起</span>
          </div>
        </a-tag>
      </a-space>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import SyIcon from './SiyuanTheme/SyIcon.vue';

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
}
</style>
