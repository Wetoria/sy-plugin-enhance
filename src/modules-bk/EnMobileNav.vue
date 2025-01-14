<template>
  <Teleport to="body">
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
          ref="navListRef"
          class="NavList"
        >
          <div
            class="NavItem"
            @click="goBack"
          >
            <div class="NavItemIcon">
              <SyIcon
                name="iconBack"
                :disabled="isOldest"
                size="18"
              />
            </div>
          </div>
          <div
            class="NavItem"
            @click="goForward"
          >
            <div class="NavItemIcon">
              <SyIcon
                name="iconForward"
                :disabled="isNewset"
                size="18"
              />
            </div>
          </div>
          <div
            v-if="isNotFree"
            class="NavItem"
            @click="createTodayDailyNote"
          >
            <div class="NavItemIcon">
              <SyIcon
                name="iconAdd"
                :disabled="isNewset"
                size="18"
              />
            </div>
          </div>
          <div
            class="NavItem"
            @click="entryOpenSettings"
          >
            <div class="NavItemIcon">
              <SyIcon
                :name="['iconHeart', 'iconVIP', 'iconSuper'][settings.v]"
                :disabled="isNewset"
                size="18"
              />
            </div>
          </div>

          <!-- 更多内容 -->
          <a-dropdown position="tr">
            <div class="NavItem">
              <div class="NavItemIcon">
                <icon-menu size="18" />
              </div>
            </div>

            <template #content>
              <div
                ref="EnNavMoreRef"
              >
                <a-doption
                  @click="openSiyuanSettings"
                >
                  <div class="flexAlignCenter enGap">
                    <SyIcon
                      name="iconSiYuan"
                      size="18"
                    />
                    思源设置
                  </div>
                </a-doption>
                <a-doption
                  @click="jumpToPrevDailyNote()"
                >
                  <div class="flexAlignCenter enGap">
                    <icon-backward size="18" />
                    前一篇日记
                  </div>
                </a-doption>
                <a-doption
                  @click="jumpToNextDailyNote()"
                >
                  <div class="flexAlignCenter enGap">
                    <icon-forward size="18" />
                    后一篇日记
                  </div>
                </a-doption>
              </div>
            </template>
          </a-dropdown>
          <div
            v-for="item of navList"
            :key="item.label"
            class="NavItem"
            @click="() => {
              if (item.onClick) {
                item.onClick()
              }
            }"
          >
            <div class="NavItemIcon">
              <SyIcon
                v-if="item.icon !== 'iconMore'"
                :name="item.icon"
                :disabled="item.disabled"
                size="18"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script lang="ts">
import SyIcon from '@/components/SiyuanTheme/SyIcon.vue'
import { usePlugin } from '@/main'
import {
  jumpToNextDailyNote,
  jumpToPrevDailyNote,
} from '@/modules/DailyNote/DailyNote.vue'
import { createTodayDailyNote } from '@/modules/DailyNote/QuickNote/EnQuickNoteMobile.vue'
import {
  entryOpenSettings,
  isNotFree,
  useSettings,
} from '@/modules/Settings/EnSettings.vue'
import { debounce } from '@/utils'
import { watchDomChange } from '@/utils/DOM'
import { useDocHistory } from '@/utils/History'
import {
  computed,
  onMounted,
  ref,
} from 'vue'

export const EnNavMoreRef = ref(null)
</script>

<script setup lang="ts">

const plugin = usePlugin()

const lastScrollTop = ref(0)
const showToolBar = ref(true)
const onScroll = (event) => {
  const currentScrollTop = (event.target as HTMLElement).scrollTop

  if (currentScrollTop + 60 <= lastScrollTop.value) {
    enLog('向上滚动')
    showToolBar.value = true
    lastScrollTop.value = currentScrollTop
  } else if (currentScrollTop - 10 >= lastScrollTop.value) {
    enLog('向下滚动')
    showToolBar.value = false
    lastScrollTop.value = currentScrollTop
  }

  if (currentScrollTop <= 0) {
    showToolBar.value = true
  }
}

const bindedProtyleContent = ref(null)
onMounted(() => {
  if (!plugin.isMobile) {
    return
  }

  watchDomChange(debounce(() => {
    const editorDom = document.body.querySelector('#editor') as HTMLElement
    if (editorDom) {
      const contentDom = editorDom.querySelector('.protyle-content')
      if (contentDom && bindedProtyleContent.value !== contentDom) {
        bindedProtyleContent.value?.removeEventListener('scroll', onScroll)
        contentDom.addEventListener('scroll', onScroll)
        bindedProtyleContent.value = contentDom
      }
    }
  }, 300))
})

const keyboardShown = ref(false)
plugin.eventBus.on('mobile-keyboard-show', () => {
  showToolBar.value = false
  keyboardShown.value = true
})
plugin.eventBus.on('mobile-keyboard-hide', () => {
  showToolBar.value = true
  keyboardShown.value = false
})

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

const settings = useSettings()

const navListRef = ref(null)
const navList = ref<Array<{
  icon: string
  label: string
  disabled?: boolean
  onClick?: () => void
}>>([])

const openSiyuanSettings = () => {
  const toolbarMore = document.body.querySelector('#toolbarMore')
  if (toolbarMore) {
    toolbarMore.dispatchEvent(new MouseEvent('click'))
  }
}
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

.enToolbar {
  position: fixed;
  pointer-events: auto;
  width: 80%;
  bottom: 50px;
  height: max-content;
  left: calc(10%);
  border-radius: 30px;
  box-shadow: 0px 0px 2px #c1c1c17f;
  // background-color: #1A1A1A;
  background-color: var(--hack-tool-bar-bg-color);
  z-index: 3;
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

