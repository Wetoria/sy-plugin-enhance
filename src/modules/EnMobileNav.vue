<template>
  <div
    class="enToolbar"
    :style="{
      // visibility: showToolBar ? 'visible' : 'hidden'
      opacity: showToolBar ? 1 : 0,
      pointerEvents: showToolBar ? undefined : 'none',
      transition: keyboardShown ? 'all 0.1s linear' : 'all 0.3s linear',
    }"
  >
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
  </div>
</template>

<script setup lang="ts">
import { debounce } from '@/utils';
import { usePlugin } from '@/main';
import { querySelectorByBody } from '@/utils/DOM';
import { hideDom } from '@/utils/Siyuan';
import { ref, watchEffect, onMounted } from 'vue';
import SyIcon from '@/components/SiyuanTheme/SyIcon.vue'
import { computed } from 'vue';
import { useDocHistory } from '@/utils/History'
import { openSettings, useSettings } from '@/modules/Settings/EnSettings.vue';
import { createTodayDailyNote, jumpToNextDailyNote, jumpToPrevDailyNote } from '@/modules/DailyNote/DailyNote.vue';
import { openSetting } from '@/utils';

const touchmoveDisableFunc = (event) => {
    event.stopPropagation()
  }

function disableSiyuanTouchMove() {
  document.documentElement.addEventListener('touchmove', touchmoveDisableFunc, true)
}
function enableSiyuanTouchMove() {
  document.documentElement.removeEventListener('touchmove', touchmoveDisableFunc)
}

function hackSiyuanMobile() {
  // disableSiyuanTouchMove()

  // const statusDom = querySelectorByBody('#status')
  // if (statusDom) {
  //   hideDom(statusDom)
  // }
}

onMounted(() => {
  if (!plugin.isMobile) {
    return
  }
  hackSiyuanMobile()
  const editorDom = document.body.querySelector('#editor') as HTMLElement
  if (editorDom) {
    const handler = () => {
      const contentDom = editorDom.querySelector('.protyle-content')
      if (contentDom) {
        contentDom.addEventListener('scroll', onScroll)
      }
    }
    const run = debounce(handler, 500)
    handler()
    const observer = new MutationObserver(() => {
      run()
    });
    if (editorDom) {
      observer.observe(editorDom, {
        childList: true, // 观察目标子节点的变化，是否有添加或者删除
        subtree: true, // 观察后代节点，默认为 false
        attributes: true,
      })
    }

  }
})

const lastScrollTop = ref(0);
const showToolBar = ref(true)
const onScroll = (event) => {
  let currentScrollTop = (event.target as HTMLElement).scrollTop

  if (currentScrollTop + 60 <= lastScrollTop.value) {
    console.log('向上滚动');
    showToolBar.value = true
    lastScrollTop.value = currentScrollTop;
  } else if (currentScrollTop - 10 >= lastScrollTop.value) {
    console.log('向下滚动');
    showToolBar.value = false
    lastScrollTop.value = currentScrollTop;
  }

  if (currentScrollTop <= 0) {
    showToolBar.value = true
  }

}

const plugin = usePlugin()
const keyboardShown = ref(false)
plugin.eventBus.on('mobile-keyboard-show', () => {
  showToolBar.value = false
  keyboardShown.value = true
})
plugin.eventBus.on('mobile-keyboard-hide', () => {
  showToolBar.value = false
  showToolBar.value = true
})

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

<style lang="scss">
html[data-theme-mode="dark"] {
  // --hack-theme-color: black;
  // --b3-theme-background: black;
  --hack-tool-bar-bg-color: #1A1A1A;
}
html[data-theme-mode="light"] {
  // --hack-theme-color: white;
  // --b3-theme-background: white;
  --hack-tool-bar-bg-color: rgb(221,221,221);
}
#enApp {
  z-index: 2;
}

.enToolbar {
  position: absolute;
  pointer-events: auto;
  width: 80%;
  bottom: 50px;
  height: max-content;
  left: calc(10%);
  border-radius: 30px;
  box-shadow: 0px 0px 2px #c1c1c17f;
  // background-color: #1A1A1A;
  background-color: var(--hack-tool-bar-bg-color);
  z-index: 1;
}
</style>

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

