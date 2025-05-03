import { openTab, Plugin } from 'siyuan'
import { createApp } from 'vue'
import EnLeafPanel from './EnLeafPanel.vue'

const DOCK_TYPE = 'sy_plugin_enhance_dock'
const TAB_TYPE = 'sy_plugin_enhance_tab'

// 存储MutationObserver实例
const observers: MutationObserver[] = []

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
    topElements.forEach(el => {
      if (el instanceof HTMLElement) {
        el.style.height = '100%'
      }
    })

    // 设置其他可能需要高度的元素
    const userMemoElements = element.querySelectorAll('.en-user-memo')
    userMemoElements.forEach(el => {
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
    const config = { childList: true, subtree: true }

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
    topElements.forEach(el => {
      if (el instanceof HTMLElement) {
        el.style.height = '100%'
      }
    })

    // 设置其他可能需要高度的元素
    const userMemoElements = element.querySelectorAll('.en-user-memo')
    userMemoElements.forEach(el => {
      if (el instanceof HTMLElement) {
        el.style.height = '100%'
      }
    })
  } catch (error) {
    console.error('设置DOM高度时出错:', error)
  }
}

// 清理所有观察者
function cleanupObservers() {
  observers.forEach(observer => {
    observer.disconnect()
  })
  observers.length = 0
}

export function initDock(plugin: Plugin) {

  // 添加叶归侧边栏
  plugin.addDock({
    type: DOCK_TYPE,
    config: {
      position: 'RightTop',
      size: {
        width: 300,
        height: 0,
      },
      icon: 'iconEnLeaf2',
      title: '叶归',
    },
    data: {
      plugin,
    },
    resize() {
      // 在调整大小后重新设置高度
      if (this.element && this.element instanceof HTMLElement) {
        setupDOMHeightWithoutObserver(this.element)
      }
    },
    init() {
      const app = createApp(EnLeafPanel, {
        mode: 'dock',
        plugin,
      })
      const container = document.createElement('div')
      this.element.appendChild(container)
      app.mount(container)

      // 简化高度设置逻辑，只使用一次延时
      if (this.element instanceof HTMLElement) {
        // 短延时确保DOM渲染完成
        setTimeout(() => {
          setupDOMHeight(this.element as HTMLElement)
        }, 200)
      }
    },
    destroy() {
      cleanupObservers()
    },
  })

  // 初始化自定义页签
  initTab(plugin)
}

// 初始化自定义页签
export function initTab(plugin: Plugin) {
  // 注册自定义页签
  plugin.addTab({
    type: TAB_TYPE,
    init() {
      const app = createApp(EnLeafPanel, {
        mode: 'tab',
        plugin,
      })
      const container = document.createElement('div')
      this.element.appendChild(container)
      app.mount(container)

      // 简化高度设置逻辑，只使用一次延时
      if (this.element instanceof HTMLElement) {
        // 短延时确保DOM渲染完成
        setTimeout(() => {
          setupDOMHeight(this.element as HTMLElement)
        }, 200)
      }
    },
    beforeDestroy() {
      // 清理资源
    },
    destroy() {
      cleanupObservers()
    }
  })
}

// 打开叶归页签
export function openLeafTab(plugin: Plugin) {
  openTab({
    app: plugin.app,
    custom: {
      icon: "iconEnLeaf2",
      title: "叶归",
      data: {
        text: "叶归",
        type: TAB_TYPE,
      },
      id: plugin.name + TAB_TYPE,
    },
  })
}
