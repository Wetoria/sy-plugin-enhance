<template>
  <div
    class="MobileNavContainer"
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
            v-if="item.icon != 'iconMore'"
            :name="item.icon"
            :disabled="item.disabled"
            size="18"
          />
          <a-dropdown v-else position="tr">
            <icon-apps size="18" />
            <template #content>
              <a-doption>Option 1</a-doption>
              <a-doption disabled>Option 2</a-doption>
              <a-doption :value="{ value: 'Option3' }">Option 3</a-doption>
            </template>
          </a-dropdown>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watchEffect } from 'vue';
import SyIcon from '@/components/SiyuanTheme/SyIcon.vue'
import { computed } from 'vue';
import { useDocHistory } from '@/utils/History'
import { openSettings, useSettings } from '@/modules/Settings/EnSettings.vue';
import { createTodayDailyNote, jumpToNextDailyNote, jumpToPrevDailyNote } from '@/modules/DailyNote/DailyNote.vue';
import { openSetting } from '@/utils';

const settings = useSettings()
const isJumpDoc = computed(() => settings.value.mobileSwitchDocMode === 'doc')


const containerHeight = computed(() => {
  return 24
})
const containerHeightCss = computed(() => `${containerHeight.value}px`)

const {
  goBack,
  goForward,
  isNewset,
  isOldest,
} = useDocHistory()

const navListRef = ref(null)
let clickNum = ref(0)
let timeoutFlag = ref(null)
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
      if (timeoutFlag.value) {
        clearTimeout(timeoutFlag.value)
      }
      clickNum.value += 1
      timeoutFlag.value = setTimeout(() => {
        if (clickNum.value == 1) {
          goBack()
        } else {
          jumpToPrevDailyNote()
        }
        clickNum.value = 0
      }, 500)
    },
  },
  {
    icon: 'iconForward',
    label: '后一篇',
    disabled: isJumpDoc.value ? isNewset.value : false,
    onClick: () => {
      if (timeoutFlag.value) {
        clearTimeout(timeoutFlag.value)
      }
      clickNum.value += 1
      timeoutFlag.value = setTimeout(() => {
        if (clickNum.value == 1) {
          goForward()
        } else {
          jumpToNextDailyNote()
        }
        clickNum.value = 0
      }, 500)
    },
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
      // openSettings()
    }
  },
  {
    icon: 'iconSuper',
    label: '插件设置',
    onClick: () => {
      // openSetting()
      openSettings()
    }
  },
  {
    icon: 'iconSiYuan',
    label: '思源设置',
    onClick: () => {
      const toolbarMore = document.body.querySelector('#toolbarMore')
      if (toolbarMore) {
        toolbarMore.dispatchEvent(new MouseEvent('click'))
      }
    }
  },
  {
    icon: 'iconMore',
    label: '新建日记',
  },
])


watchEffect(() => {
  navList.value[0].disabled = isJumpDoc.value ? isOldest.value : false
  navList.value[1].disabled = isJumpDoc.value ? isNewset.value : false
})
</script>

<style lang="scss" scoped>
.MobileNavContainer {
  padding: 8px 8px;
  // padding-bottom: v-bind(containerPaddingBottomHeightCss);
  display: flex;
  height: fit-content;
  flex-direction: column;
  overflow: hidden;
  box-sizing: border-box;
  width: 100%;
  z-index: 1;
  // border: 1px solid red;

  .NavList {
    height: v-bind(containerHeightCss);
    // padding-top: 10px;
    display: flex;
    justify-content: space-between;

    .NavItem {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      box-sizing: border-box;
      min-width: 40px;
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
