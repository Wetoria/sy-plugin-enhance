<template>
  <DefineTemplate
    v-slot="{ mode }"
  >
    <div
      ref="containerRef"
      class="fn__flex-1 fn__flex-column"
      :class="{
        'en-leaf-panel--dock': mode === 'dock', 'en-leaf-panel--tab': mode === 'tab',
      }"
    >
      <div class="block__icons">
        <div class="block__logo">
          <EnIconLeaf2 />
          叶归
        </div>
        <span class="fn__flex-1"></span>
        <div class="block__icons-group">
          <template v-if="mode === 'dock'">
            <span
              class="block__icon b3-tooltips b3-tooltips__sw"
              aria-label="打开页签"
              @click="openLeafTab"
            >
              <svg><use xlink:href="#iconFile"></use></svg>
            </span>
          </template>
          <span
            class="block__icon b3-tooltips b3-tooltips__sw"
            aria-label="设置"
            @click="openSettings"
          >
            <svg><use xlink:href="#iconSettings"></use></svg>
          </span>
          <template v-if="mode === 'dock'">
            <span
              data-type="min"
              class="block__icon b3-tooltips b3-tooltips__sw"
              aria-label="最小化"
            >
              <svg><use xlink:href="#iconMin"></use></svg>
            </span>
          </template>
        </div>
      </div>
      <div class="fn__flex-1 en-dock">
        <EnUserMemo
          :mode="mode"
          :plugin="plugin"
        />
      </div>
    </div>
  </DefineTemplate>
  <EnDock
    v-model:open="dockedOpened"
    type="Common"
    icon="iconEnLeaf2"
    hideTitle
    @resize="onDockResize"
  >
    <ReuseTemplate
      mode="dock"
    ></ReuseTemplate>
  </EnDock>

  <EnSyTab
    v-model:visible="tabVisible"
    name="EnLeafPanel"
    title="叶归"
    @init="onTabInit"
  >
    <ReuseTemplate
      mode="tab"
    ></ReuseTemplate>
  </EnSyTab>
</template>

<script setup lang="ts">
import EnIconLeaf2 from '@/components/EnIconLeaf2.vue'
import { usePlugin } from '@/main'
import EnUserMemo from '@/modules/EnLeafPanel/panels/EnUserMemo.vue'
import { createReusableTemplate } from '@vueuse/core'
import {
  onBeforeUnmount,
  onMounted,
  ref,
  useTemplateRef,
} from 'vue'


const [DefineTemplate, ReuseTemplate] = createReusableTemplate()

const dockedOpened = ref(false)

const plugin = usePlugin()


const containerRef = useTemplateRef('containerRef')


const openSettings = () => {
  plugin.openSetting()
}


const tabVisible = ref(false)
// 打开叶归页签
const openLeafTab = () => {
  tabVisible.value = true
}

// 不创建新观察者的设置高度函数
function setupDOMHeightWithoutObserver(element: HTMLElement) {
  try {
    // 查找data-v-app元素
    const appElement = element.querySelector('[data-v-app]')
    if (appElement instanceof HTMLElement) {
      appElement.style.height = '100%'
    }

    // 查找所有需要设置高度的顶层元素
    const topElements = element.querySelectorAll('.fn__flex-1.fn__flex-column')
    topElements.forEach((el) => {
      if (el instanceof HTMLElement) {
        el.style.height = '100%'
      }
    })

    // 设置其他可能需要高度的元素
    const userMemoElements = element.querySelectorAll('.en-user-memo')
    userMemoElements.forEach((el) => {
      if (el instanceof HTMLElement) {
        el.style.height = '100%'
      }
    })
  } catch (error) {
    console.error('设置DOM高度时出错:', error)
  }
}

const onDockResize = () => {
  if (containerRef.value) {
    setupDOMHeightWithoutObserver(containerRef.value)
  }
}


// 存储MutationObserver实例
const observers: MutationObserver[] = []


// 清理所有观察者
function cleanupObservers() {
  observers.forEach((observer) => {
    observer.disconnect()
  })
  observers.length = 0
}

onBeforeUnmount(() => {
  cleanupObservers()
})

// 设置顶层DOM的高度 - 简化版本
function setupDOMHeight(element: HTMLElement) {
  try {
    // 查找data-v-app元素
    const appElement = element.querySelector('[data-v-app]')
    if (appElement instanceof HTMLElement) {
      appElement.style.height = '100%'
    }

    // 查找所有需要设置高度的顶层元素
    const topElements = element.querySelectorAll('.fn__flex-1.fn__flex-column')
    topElements.forEach((el) => {
      if (el instanceof HTMLElement) {
        el.style.height = '100%'
      }
    })

    // 设置其他可能需要高度的元素
    const userMemoElements = element.querySelectorAll('.en-user-memo')
    userMemoElements.forEach((el) => {
      if (el instanceof HTMLElement) {
        el.style.height = '100%'
      }
    })

    // 创建MutationObserver监听DOM变化
    const observer = new MutationObserver(() => {
      // 简化为直接调用高度设置函数
      setupDOMHeightWithoutObserver(element)
    })

    // 配置观察选项
    const config = {
      childList: true,
      subtree: true,
    }

    // 开始观察
    observer.observe(element, config)

    // 存储观察者实例以便后续清理
    observers.push(observer)

    return observer
  } catch (error) {
    console.error('设置DOM高度时出错:', error)
    return null
  }
}

onMounted(() => {
  // 简化高度设置逻辑，只使用一次延时
  if (containerRef.value) {
    // 短延时确保DOM渲染完成
    setTimeout(() => {
      setupDOMHeight(containerRef.value)
    }, 200)
  }
})

const onTabInit = () => {
  // 简化高度设置逻辑，只使用一次延时
  if (containerRef.value) {
    // 短延时确保DOM渲染完成
    setTimeout(() => {
      setupDOMHeight(containerRef.value)
    }, 200)
  }
}
</script>

<style lang="scss">
.en-dock {
  padding: 8px;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: auto;
  box-sizing: border-box;

  .en-leaf-panel--tab & {
    padding: 8px;
  }
}

.block__icons {
  display: flex;
  align-items: center;
  padding: 0 8px;
  height: 32px;
  box-sizing: border-box;
  border-bottom: 1px solid var(--b3-border-color);
  flex-shrink: 0;

  .block__logo {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 14px;

    svg {
      height: 14px;
      width: 14px;
      fill: currentColor;
    }
  }

  .block__icons-group {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .block__icon {
    padding: 4px;
    cursor: pointer;

    svg {
      height: 14px;
      width: 14px;
      fill: currentColor;
    }

    &:hover {
      background-color: var(--b3-theme-background-light);
      border-radius: var(--b3-border-radius);
    }
  }
}

.en-leaf-panel {
  &--dock {
    width: 100%;
    min-width: 240px;
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  &--tab {
    width: 100%;
    margin: 0 auto;
    padding: 0;
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow-x: hidden;
  }
}

:deep(.timeline-content) {
  padding: 0 16px 16px;

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background-color: var(--b3-scroll-color);
    border-radius: 4px;
  }

  &::-webkit-scrollbar-track {
    background-color: var(--b3-scroll-track-color);
  }
}

:deep(.calendar-area),
:deep(.input-area) {
  overflow: hidden;
}
</style>
