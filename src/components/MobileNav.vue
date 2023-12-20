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
import { createTodayDailyNote, jumpToNextDailyNote, jumpToPrevDailyNote } from '@/utils/DailyNoteHelper'
import {openSetting, useMobileKeyBoardShown} from '@/utils'
import { useDocHistory } from '@/utils/History'
import { useSettings } from '@/logic';

const settings = useSettings()
const isJumpDoc = computed(() => settings.value.mobileSwitchDocMode === 'doc')

const showLabel = computed(() => settings.value.showMobileNavLabel)
const containerPaddingBottomHeight = 30;
const containerPaddingBottomHeightCss = computed(() => `${containerPaddingBottomHeight}px`)

const containerHeight = computed(() => {
  if (showLabel.value) {
    return 45
  }
  return 30
})
const containerHeightCss = computed(() => `${containerHeight.value}px`)

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
    label: '前一篇',
    disabled: isJumpDoc.value ? isOldest.value : false,
    onClick: () => {
      const mobileSwitchDocMode = settings.value.mobileSwitchDocMode;
      if (mobileSwitchDocMode == 'doc') {
        goBack()
      } else if (mobileSwitchDocMode == 'dailyNote') {
        jumpToPrevDailyNote()
      }
    }
  },
  {
    icon: 'iconForward',
    label: '后一篇',
    disabled: isJumpDoc.value ? isNewset.value : false,
    onClick: () => {
      const mobileSwitchDocMode = settings.value.mobileSwitchDocMode;
      if (mobileSwitchDocMode == 'doc') {
        goForward()
      } else if (mobileSwitchDocMode == 'dailyNote') {
        jumpToNextDailyNote()
      }
    }
  },
  {
    icon: 'iconAdd',
    label: '新建日记',
    onClick: () => {
      createTodayDailyNote()
    }
  },
  {
    icon: 'iconSuper',
    label: '插件设置',
    onClick: () => {
      openSetting()
    }
  },
  {
    icon: 'iconSettings',
    label: '思源设置',
    onClick: () => {
      const toolbarMore = document.body.querySelector('#toolbarMore')
      if (toolbarMore) {
        toolbarMore.dispatchEvent(new MouseEvent('click'))
      }
    }
  },
])


watchEffect(() => {
  navList.value[0].disabled = isJumpDoc.value ? isOldest.value : false
  navList.value[1].disabled = isJumpDoc.value ? isNewset.value : false
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
  padding: 0px 8px;
  padding-bottom: v-bind(containerPaddingBottomHeightCss);
  display: flex;
  height: fit-content;
  flex-direction: column;
  overflow: hidden;
  box-sizing: border-box;
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
      min-width: 85px;
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
        font-size: 14px;
        flex: 1;
      }
    }
  }
}
</style>
