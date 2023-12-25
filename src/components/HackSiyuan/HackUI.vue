<template>
  <Teleport
    to=".enhance-hack-ui"
  >
    <div class="main">
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
          pointerEvents: showToolBar ? undefined : 'none'
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

const protyleContainerRef = ref(null)

onMounted(() => {
  const editorDom = document.body.querySelector('#editor') as HTMLElement
  if (editorDom) {

    const editor = document.querySelector('#editor')
    let registered = false;
    const handler = () => {
      if (registered) {
        return
      }
      const wysiwyg = editorDom.querySelector('.protyle-wysiwyg')
      console.log('wysiwyg is ', wysiwyg)
      if (wysiwyg) {
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
})

const lastScrollTop = ref(0);
const showToolBar = ref(true)
const onScroll = (event) => {
  let currentScrollTop = (event.target as HTMLElement).scrollTop

  if (currentScrollTop > lastScrollTop.value) {
    console.log('向下滚动');
    showToolBar.value = false
  } else if (currentScrollTop < lastScrollTop.value) {
    console.log('向上滚动');
    showToolBar.value = true
  }

  lastScrollTop.value = currentScrollTop;
}
</script>

<style lang="scss">
html {
  background-color: red;
}

.enhance-hack-ui {

  // --hack-theme-color: #1e1e1e;
  --hack-theme-color: #000000;

  width: 100%;
  height: 96%;
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
  height: 100%;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  position: relative;
  // border: 1px solid white;

  .contantSection {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
  }

  .toolbar {
    position: absolute;
    width: 80%;
    bottom: 80px;
    left: calc(10%);
    border-radius: 30px;
    background-color: #1A1A1A;
    z-index: 1;
    transition: all 0.3s linear;
  }
  .MobileNavContainer {
  }
}
</style>
