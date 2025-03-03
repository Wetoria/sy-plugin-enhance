<template>
  <div
    class="fn__flex-1 fn__flex-column"
    :class="{ 'en-leaf-panel--dock': mode === 'dock', 'en-leaf-panel--tab': mode === 'tab' }"
  >
    <div class="block__icons">
      <div class="block__logo">
        <EnIconLeaf2 />
        叶归
      </div>
      <span class="fn__flex-1"></span>
      <div class="block__icons-group">
        <template v-if="mode === 'dock'">
          <span
            class="block__icon b3-tooltips b3-tooltips__sw"
            aria-label="打开页签"
            @click="openLeafTab"
          >
            <svg><use xlink:href="#iconFile"></use></svg>
          </span>
        </template>
        <span
          class="block__icon b3-tooltips b3-tooltips__sw"
          aria-label="设置"
          @click="openSettings"
        >
          <svg><use xlink:href="#iconSettings"></use></svg>
        </span>
        <template v-if="mode === 'dock'">
          <span
            data-type="min"
            class="block__icon b3-tooltips b3-tooltips__sw"
            aria-label="最小化"
          >
            <svg><use xlink:href="#iconMin"></use></svg>
          </span>
        </template>
      </div>
    </div>
    <div class="fn__flex-1 en-dock">
      <EnUserMemo :mode="mode" :plugin="plugin" />
    </div>
  </div>
</template>

<script setup lang="ts">
import EnIconLeaf2 from '@/components/EnIconLeaf2.vue'
import { usePlugin } from '@/main'
import EnUserMemo from './panels/EnUserMemo.vue'
import { openLeafTab as openLeafTabFunc } from './EnLeafPanel'
import type { ViewMode } from './types'

const props = withDefaults(defineProps<{
  mode?: ViewMode
  plugin?: any
}>(), {
  mode: 'dock',
  plugin: undefined
})

const plugin = props.plugin || usePlugin()

const openSettings = () => {
  plugin.openSetting()
}

const openLeafTab = () => {
  openLeafTabFunc(plugin)
}
</script>

<style lang="scss">
.en-dock {
  padding: 8px;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.block__icons {
  display: flex;
  align-items: center;
  padding: 0 8px;
  height: 32px;
  box-sizing: border-box;
  border-bottom: 1px solid var(--b3-border-color);

  .block__logo {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 14px;

    svg {
      height: 14px;
      width: 14px;
      fill: currentColor;
    }
  }

  .block__icons-group {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .block__icon {
    padding: 4px;
    cursor: pointer;

    svg {
      height: 14px;
      width: 14px;
      fill: currentColor;
    }

    &:hover {
      background-color: var(--b3-theme-background-light);
      border-radius: var(--b3-border-radius);
    }
  }
}

.en-leaf-panel {
  &--dock {
    width: 100%;
    min-width: 240px;
  }

  &--tab {
    width: 100%;
    max-width: 960px;
    margin: 0 auto;
    padding: 0 16px;
  }
}
</style>
