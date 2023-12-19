<template>
  <div
    class="settingItem"
    :data-isMobile="isMobile"
  >
    <template
      v-if="isMobile"
    >
      <template v-if="!mode || mode == 'simple'">
        <div class="settingItemDescArea">
          <div class="settingTitle">
            <slot></slot>
          </div>
          <div class="settingDesc">
            <slot name="desc"></slot>
          </div>
        </div>
        <div class="settingItemOptionArea">
          <slot name="opt"></slot>
        </div>
      </template>
      <template v-else-if="mode == 'complex'">
        <div
          class="settingItemDescArea"
          style="
            display: flex;
            flex-direction: column;
            gap: 8px;
          "
        >
          <div class="settingTitle">
            <slot></slot>
          </div>
          <div>
            <slot name="opt"></slot>
          </div>
          <div class="settingDesc">
            <slot name="desc"></slot>
          </div>
        </div>
      </template>
    </template>
    <template v-else>
      <div class="settingItemDescArea">
        <div class="settingTitle">
          <slot></slot>
        </div>
        <div class="settingDesc">
          <slot name="desc"></slot>
        </div>
      </div>
      <div class="settingItemOptionArea">
        <slot name="opt"></slot>
      </div>
    </template>
  </div>
</template>

<script lang="ts" setup>
import { usePlugin } from '@/main';
import { computed } from 'vue';

const plugin = usePlugin()
const isMobile = computed(() => plugin.isMobile)

defineProps<{
  mode?: 'simple' | 'complex';
}>()
</script>

<style lang="scss" scoped>
.settingItem {
  display: flex;
  width: 100%;
  min-height: 32px;
  align-items: center;
  gap: 8px;

  .settingItemDescArea {
    flex: 1;

    .settingTitle {
    }

    .settingDesc {
      color: var(--b3-theme-on-surface);
      font-size: 14px;
    }
  }

  .settingItemOptionArea {
    display: flex;
    justify-content: flex-end;

    min-width: 20%;
  }

  &[data-isMobile="true"] {
    :deep(.b3-select),
    :deep(.b3-text-field) {
      width: 100%;
    }
  }
}
</style>
