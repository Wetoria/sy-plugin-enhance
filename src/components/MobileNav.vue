<template>
  <div
    class="MobileNavContainer"
    :style="{
      height: keyboardShown ? 0 : 'fit-content',
      padding: keyboardShown ? 'unset' : undefined,
    }"
  >
    <div
      class="NavList"
      ref="navListRef"
    >
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
          <SyIcon
            :name="item.icon"
            :disabled="item.disabled"
            size="18"
          />
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
import {openSetting, useMobileKeyBoardShown} from '@/utils'
import { useDocHistory } from '@/utils/History'

const showLabel = ref(false)
const containerPaddingBottomHeight = 30;
const containerPaddingBottomHeightCss = computed(() => `${containerPaddingBottomHeight}px`)

const containerHeight = computed(() => {
  if (showLabel) {
    return 50
  }
  return 30
})
const containerHeightCss = computed(() => `${containerHeight}px`)

const {
  goBack,
  goForward,
  isNewset,
  isOldest,
} = useDocHistory()

const navListRef = ref(null)
const navList = ref<Array<{
  icon: string;
  label: string;
  disabled?: boolean;
  onClick?: () => void;
}>>([
  {
    icon: 'iconBack',
    label: 'Test',
    disabled: isOldest.value,
    onClick: () => {
      goBack()
    }
  },
  {
    icon: 'iconForward',
    label: 'Test',
    disabled: isNewset.value,
    onClick: () => {
      goForward()
    }
  },
  {
    icon: 'iconAdd',
    label: '日记',
    onClick: () => {
      createTodayDailyNote()
    }
  },
  {
    icon: 'iconSuper',
    label: '插件',
    onClick: () => {
      openSetting()
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


watchEffect(() => {
  navList.value[0].disabled = isOldest.value
  navList.value[1].disabled = isNewset.value
})

const keyboardShown = useMobileKeyBoardShown();
watchEffect(() => {
  if (navListRef.value) {
    if (keyboardShown.value) {
      navListRef.value.style.transform = `translateY(${containerHeight.value + containerPaddingBottomHeight}px)`
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
  padding-bottom: v-bind(containerPaddingBottomHeightCss);
  display: flex;
  height: fit-content;
  flex-direction: column;
  overflow: hidden;
  // border: 1px solid red;

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
