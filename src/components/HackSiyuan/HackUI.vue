<template>
  <Teleport
    to=".enhance-hack-ui"
  >
    <div class="main">
      <div ref="statusAreaRef"></div>
      <div
        class="contentSection"
        @scroll="onScroll"
      >
        <div
          ref="protyleContainerRef"
        ></div>
      </div>
      <div
        class="toolbar"
        :style="{
          // visibility: showToolBar ? 'visible' : 'hidden'
          opacity: showToolBar ? 1 : 0,
          pointerEvents: showToolBar ? undefined : 'none',
          transition: keyboardShown ? 'all 0.1s linear' : 'all 0.3s linear',
        }"
      >
        <HackMobileNav />
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import HackMobileNav from './HackMobileNav.vue';
import { debounce } from '@/utils';
import { usePlugin } from '@/main';

const protyleContainerRef = ref(null)

const statusAreaRef = ref(null)

const hintDomRef = ref(null)
onMounted(() => {
  const editorDom = document.body.querySelector('#editor') as HTMLElement
  if (editorDom) {

    const editor = document.querySelector('#editor')
    let registeredW = false;
    let regHint = false
    const handler = () => {
      const wysiwyg = editorDom.querySelector('.protyle-wysiwyg') as HTMLElement
      console.log('wysiwyg is ', wysiwyg)
      if (wysiwyg && !registeredW) {
        wysiwyg.style.padding = '16px 0px 200px 0px'
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
      const selection = window.getSelection()
      if (selection.anchorNode?.parentElement) {
        const rect = selection.anchorNode?.parentElement.getBoundingClientRect()
        const pos = rect.top + 50
        if (pos > document.body.clientHeight - 20) {

          hintDomRef.value.style.bottom = `${30}px`;
        } else {
          hintDomRef.value.style.top = `${pos}px`;
        }
      }
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

  if (currentScrollTop == 0) {
    showToolBar.value = true
  }
  if (currentScrollTop - 20 > lastScrollTop.value) {
    console.log('向下滚动');
    showToolBar.value = false
  } else if (currentScrollTop + 10 < lastScrollTop.value) {
    console.log('向上滚动');
    showToolBar.value = true
  }

  lastScrollTop.value = currentScrollTop;
}

const plugin = usePlugin()
const keyboardShown = ref(false)
plugin.eventBus.on('mobile-keyboard-show', () => {
  showToolBar.value = false
  keyboardShown.value = true
})
plugin.eventBus.on('mobile-keyboard-hide', () => {
  showToolBar.value = false
})
</script>

<style lang="scss">
html {
}
.enhance-hack-ui {

  // --hack-theme-color: #1e1e1e;
  // --hack-theme-color: #000000;
  --hack-theme-color: white;

  width: 100%;
  height: 100%;
  background-color: var(--hack-theme-color);

  position: fixed;
  top: 0;
  left: 0;
  z-index: 1;

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

      .protyle-hint {
        // top: v-bind(hintTopCss) !important;
        // bottom: 20px !important;
        height: fit-content;

        & > div {
          display: flex;
          flex-direction: column;
          flex: unset !important;

          .b3-list-item {
            display: flex;
            flex-direction: column;
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

    .toolbar {
      position: absolute;
      width: 80%;
      bottom: 50px;
      left: calc(10%);
      border-radius: 30px;
      // background-color: #1A1A1A;
      background-color: rgb(221,221,221);
      z-index: 1;
    }
    .MobileNavContainer {
    }
  }
}
.EnhanceSettingsContainer {
  max-height: 70vh !important;
}
</style>
