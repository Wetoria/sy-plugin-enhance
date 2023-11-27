<template>
  <div class="MobileNavContainer">
    <div class="NavList" ref="navListRef">
      <div
        v-for="item of navList"
        class="NavItem"
        @click="() => {
          if (item.onClick) {
            item.onClick()
          }
        }"
      >
        <div class="NavItemIcon">
          <SyIcon :name="item.icon" size="18" />
        </div>
        <div class="NavItemLabel" v-if="showLabel">
          {{ item.label }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watchEffect } from 'vue';
import SyIcon from '@/components/SiyuanTheme/SyIcon.vue'
import { computed } from 'vue';
import { createTodayDailyNote } from '@/utils/DailyNoteHelper'
import {useMobileKeyBoardShown} from '@/utils'

const showLabel = ref(false)
const containerHeight = computed(() => {
  if (showLabel) {
    return 50
  }
  return 30
})
const containerHeightCss = computed(() => `${containerHeight}px`)

const navListRef = ref(null)
const navList = ref<Array<{
  icon: string;
  label: string;
  onClick?: () => void;
}>>([
  {
    icon: 'iconBack',
    label: 'Test',
  },
  {
    icon: 'iconForward',
    label: 'Test',
  },
  {
    icon: 'iconAdd',
    label: '日记',
    onClick: () => {
      createTodayDailyNote()
    }
  },
  {
    icon: 'iconSettings',
    label: '设置',
    onClick: () => {
      const toolbarMore = document.body.querySelector('#toolbarMore')
      if (toolbarMore) {
        toolbarMore.dispatchEvent(new MouseEvent('click'))
      }
    }
  },
])
const keyboardShown = useMobileKeyBoardShown();
watchEffect(() => {
  if (navListRef.value) {
    if (keyboardShown.value) {
      navListRef.value.style.transform = 'translateY(80px)'
      navListRef.value.style.transition = 'unset'

    } else {
      navListRef.value.style.transform = 'translateY(0px)'
      navListRef.value.style.transition = 'all 0.5s linear'
    }
  }
})
</script>

<style lang="scss" scoped>
.MobileNavContainer {
  padding-bottom: 30px;
  display: flex;
  flex-direction: column;

  .NavList {
    height: v-bind(containerHeightCss);
    padding-top: 10px;
    display: flex;
    justify-content: space-around;
    border-top: 1px solid var(--b3-theme-background-light);

    .NavItem {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      box-sizing: border-box;
      height: v-bind(containerHeightCss);
      padding: 0px 12px;
      gap: 4px;

      .NavItemIcon {
        display: flex;
        justify-content: center;
        align-items: center;
        flex: 2;
      }

      .NavItemLabel {
        font-size: 18px;
        flex: 1;
      }
    }
  }
}
</style>
