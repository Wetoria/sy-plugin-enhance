<template>
  <Teleport
    to=".enhance-hack-ui"
  >
    <div class="main">
      <div ref="statusAreaRef"></div>
      <div
        class="contantSection"
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

onMounted(() => {
  const editorDom = document.body.querySelector('#editor') as HTMLElement
  if (editorDom) {

    const editor = document.querySelector('#editor')
    let registered = false;
    const handler = () => {
      if (registered) {
        return
      }
      const wysiwyg = editorDom.querySelector('.protyle-wysiwyg') as HTMLElement
      console.log('wysiwyg is ', wysiwyg)
      if (wysiwyg) {
        wysiwyg.style.paddingBottom = '100px'
        protyleContainerRef.value.appendChild(wysiwyg)
        registered = true
      }
    }
    const run = debounce(handler)
    handler()
    const observer = new MutationObserver(() => {
      run()
    });
    if (editor) {
      observer.observe(editor, {
        childList: true, // 观察目标子节点的变化，是否有添加或者删除
        subtree: true, // 观察后代节点，默认为 false
      })
    }

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
}
.EnhanceSettingsContainer {
  max-height: 70vh !important;
}
</style>

<style lang="scss" scoped>
.main {
  width: 100%;
  height: 99.9%;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  position: relative;
  overflow: hidden;

  .contantSection {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
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
</style>
