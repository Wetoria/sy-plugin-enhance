<template>
  <div>
    <Teleport
      to=".enhanceHackUi"
    >
      <div class="main">
        <div ref="statusAreaRef"></div>
        <div
          class="stickyTitleLine"
          ref="titleContainerRef"
        ></div>
        <div
          class="contentSection"
          @scroll="onScroll"
        >
          <div
            ref="protyleContainerRef"
          >
          </div>
        </div>
      </div>
    </Teleport>
  </div>
  <div
    class="enToolbar"
    :style="{
      // visibility: showToolBar ? 'visible' : 'hidden'
      // opacity: showToolBar ? 1 : 0,
      pointerEvents: showToolBar ? undefined : 'none',
      transition: keyboardShown ? 'all 0.1s linear' : 'all 0.3s linear',
    }"
  >
    <HackMobileNav />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import HackMobileNav from './HackMobileNav.vue';
import { debounce } from '@/utils';
import { usePlugin } from '@/main';

const protyleContainerRef = ref(null)

const statusAreaRef = ref(null)

const titleContainerRef = ref(null)

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
  const plugin = usePlugin()

  if (!plugin.isMobile) {
    return
  }

  disableSiyuanTouchMove()
  const dom = document.createElement('div')
  // dom.classList.toggle('enhanceHackUi', true)
  document.body.append(dom)
}

const hintDomRef = ref<HTMLElement>(null)
const hintDomTop = ref(0)
const hintDomTopCss = computed(() => `${hintDomTop.value}px !important`)
onMounted(() => {
  hackSiyuanMobile()
  return
  const editorDom = document.body.querySelector('#editor') as HTMLElement
  if (editorDom) {
    // protyleContainerRef.value.appendChild(editorDom)
    // return
    const editor = document.querySelector('#editor')
    let registeredW = false;
    let regHint = false
    let toolbarAppended = false
    const handler = () => {
      const toolbarNameDom = document.querySelector('#toolbarName')
      if (toolbarNameDom && !toolbarAppended) {
        titleContainerRef.value.appendChild(toolbarNameDom)
        toolbarAppended = true
      }
      const wysiwyg = editorDom.querySelector('.protyle-wysiwyg') as HTMLElement
      if (wysiwyg && !registeredW) {
        // wysiwyg.style.padding = '16px 0px 200px 0px'
        wysiwyg.style.paddingTop = '16px'
        wysiwyg.style.paddingLeft = '0px'
        wysiwyg.style.paddingRight = '0px'


        protyleContainerRef.value.appendChild(wysiwyg)
        registeredW = true
      }
      const hintDom = editorDom.querySelector('.protyle-hint') as HTMLElement
      if (hintDom && !regHint) {

        hintDomRef.value = hintDom
        protyleContainerRef.value.appendChild(hintDom)
        regHint = true
      }

    }
    const run = debounce(handler, 500)
    handler()
    const observer = new MutationObserver(() => {
      run()
      // const selection = window.getSelection()
      // if (selection.anchorNode?.parentElement) {
      //   const rect = selection.anchorNode?.parentElement.getBoundingClientRect()
      //   let pos = rect.top
      //   console.log('pos is ', pos)
      //   const diff = document.body.clientHeight - window.visualViewport.height
      //   pos = pos + (diff / 2)
      //   hintDomRef.value.style.bottom = `${document.body.clientHeight - pos + 0}px`;
      //   hintDomTop.value = pos
      // }
    });
    if (editor) {
      observer.observe(editor, {
        childList: true, // 观察目标子节点的变化，是否有添加或者删除
        subtree: true, // 观察后代节点，默认为 false
        attributes: true,
      })
    }

  }

  if (!statusAreaRef.value) {
    return
  }

  const statusDom = document.body.querySelector('#status') as HTMLElement
  if (statusDom) {
    statusDom.style.position = 'static'
    statusAreaRef.value.appendChild(statusDom)
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
  --hack-theme-color: black;
  --hack-tool-bar-bg-color: #1A1A1A;
  --b3-theme-background: black;
}
html[data-theme-mode="light"] {
  --hack-theme-color: white;
  --b3-theme-background: white;
  --hack-tool-bar-bg-color: rgb(221,221,221);
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
  // background-color: #1A1A1A;
  background-color: var(--hack-tool-bar-bg-color);
  z-index: 1;
}
.EnhanceSettingsContainer {
  max-height: 70vh !important;
}
</style>
