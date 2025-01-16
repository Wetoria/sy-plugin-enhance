<template>
  <div
    class="enSettingItem"
    :data-isMobile="isMobile"
  >
    <!-- 移动端 -->
    <template
      v-if="isMobile"
    >
      <template v-if="!mode || mode === 'horizontal'">
        <div class="settingItemMainArea">
          <div class="settingTitle">
            <slot></slot>
          </div>
          <div
            v-if="hasOptSlot"
            class="settingItemOptionArea"
          >
            <slot name="opt"></slot>
          </div>
        </div>
        <div class="settingDesc">
          <slot
            v-if="hasDescSlot"
            name="desc"
          ></slot>
        </div>
      </template>
      <template v-else-if="mode === 'vertical'">
        <div
          class="settingItemMainArea flexColumn"
          style="
            width: 100%;
          "
        >
          <div
            class="settingTitle"
            style="
              width: 100%;
              max-width: 100%;
            "
          >
            <slot></slot>
          </div>
          <div
            v-if="hasOptSlot"
            class="settingItemOptionArea"
            style="
              width: 100%;
              max-width: 100%;
            "
          >
            <slot name="opt"></slot>
          </div>
          <div
            class="settingDesc"
            style="
              width: 100%;
              max-width: 100%;
            "
          >
            <slot
              v-if="hasDescSlot"
              name="desc"
            ></slot>
          </div>
        </div>
      </template>
      <template v-else-if="mode === 'manual'">
        <slot></slot>
      </template>
    </template>

    <!-- 桌面端 -->
    <template v-else>
      <template v-if="mode && mode === 'manual'">
        <slot></slot>
      </template>
      <template v-else>
        <div class="settingItemMainArea">
          <div class="settingTitle">
            <slot></slot>
          </div>
          <div
            v-if="hasOptSlot"
            class="settingItemOptionArea"
          >
            <slot name="opt"></slot>
          </div>
        </div>
        <div class="settingDesc">
          <slot
            v-if="hasDescSlot"
            name="desc"
          ></slot>
        </div>
      </template>
    </template>
  </div>
</template>

<script lang="ts" setup>
import { usePlugin } from '@/main'
import {
  computed,
  useSlots,
} from 'vue'

defineProps<{
  mode?: 'horizontal' | 'vertical' | 'manual'
}>()
const plugin = usePlugin()
const isMobile = computed(() => plugin.isMobile)

const slots = useSlots()
const hasDescSlot = computed(() => {
  return !!slots.desc
})

const hasOptSlot = computed(() => {
  return !!slots.opt
})
</script>

<style lang="scss">
.enSettingItem {
  display: flex;
  width: 100%;
  min-height: 32px;
  flex-direction: column;
  gap: var(--en-gap);

  .settingItemMainArea {
    flex: 1;
    display: flex;
    gap: var(--en-gap);
    align-items: center;
  }

  .settingTitle {
    font-weight: bold;
    display: flex;
    align-items: center;
    height: 28px;
    flex: 1;
    flex-shrink: 0;
  }

  .settingDesc {
    color: var(--b3-theme-on-surface);
    font-size: 14px;
  }

  .settingItemOptionArea {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    height: 28px;

    min-width: 20%;
    max-width: 50%;

    .arco-input-number,
    .arco-select {
      width: min(185px, 100%);
    }
  }

  &[data-isMobile="true"] {

    .settingItemOptionArea {
      & > .arco-select,
      & > .arco-input-number,
      & > div,
      & > span {
        width: 100%;
      }

      .EnBlockAppendModeSelectorContainer .arco-select,
      .arco-select,
      .arco-input-number {
        width: 100%;
      }
    }
  }
}
</style>
