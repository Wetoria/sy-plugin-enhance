<template>
  <div
    v-if="plugin.isMobile"
    class="enToolbar"
    :style="{
      // visibility: showToolBar ? 'visible' : 'hidden'
      opacity: showToolBar ? 1 : 0,
      pointerEvents: showToolBar ? undefined : 'none',
      transition: keyboardShown ? 'all 0.1s linear' : 'all 0.3s linear',
    }"
  >
    <HackMobileNav />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import HackMobileNav from './HackMobileNav.vue';
import { debounce } from '@/utils';
import { usePlugin } from '@/main';
import { querySelectorByBody } from '@/utils/DOM';
import { hideDom } from '@/utils/Siyuan';

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
</script>

<style lang="scss">
html[data-theme-mode="dark"] {
  // --hack-theme-color: black;
  // --b3-theme-background: black;
  // --hack-tool-bar-bg-color: #1A1A1A;
}
html[data-theme-mode="light"] {
  // --hack-theme-color: white;
  // --b3-theme-background: white;
  // --hack-tool-bar-bg-color: rgb(221,221,221);
}
#enApp {
  z-index: 2;
}
.enhanceHackUi {

  // --hack-theme-color: #1e1e1e;
  // --hack-theme-color: #000000;

  width: 100%;
  height: 100%;
  background-color: var(--hack-theme-color);

  position: absolute;
  top: 0;
  left: 0;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;

  .main {
    width: 100%;
    height: 99.9%;
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    position: relative;

    .contentSection {
      flex: 1;
      padding: 4px 12px;
      overflow-y: auto;
      overflow-x: hidden;

      .stickyTitleLine {
        position: sticky;
        width: calc(100% + 24px);
        top: -4px;
        transform: translateX(-12px);
        background-color: var(--hack-theme-color);
        z-index: 100;
        border-bottom: 1px solid;
        padding: 4px 12px;
      }

      .protyle-breadcrumb,
      .protyle-background {
        display: none !important;
      }

      .protyle-hint {
        height: fit-content;
        // top: v-bind(hintDomTopCss) !important;
        top: unset !important;
        bottom: 200px;

        & > div {
          display: flex;
          flex-direction: column-reverse;
          flex: unset !important;

          .b3-list-item {
            display: flex;
            flex-direction: column-reverse;
            align-items: flex-start;
            height: 44px;
            line-height: 44px;
            box-sizing: border-box;
            flex-shrink: 0;

            .b3-list-item__first {
              height: 28px;
              line-height: 28px;
              flex-direction: row;
            }
            .b3-list-item__meta {
              overflow: hidden;
              white-space: nowrap;
              text-overflow: ellipsis;
              width: 100%;
            }
          }
        }
      }
    }

    .MobileNavContainer {
    }
  }
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
.EnhanceSettingsContainer {
  max-height: 70vh !important;
}
</style>
