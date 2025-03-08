import { Plugin } from 'siyuan'
import { createApp } from 'vue'
import EnLeafPanel from './EnLeafPanel.vue'
import { openTab } from 'siyuan'

const DOCK_TYPE = 'sy_plugin_enhance_dock'
const TAB_TYPE = 'sy_plugin_enhance_tab'

// 存储MutationObserver实例
const observers: MutationObserver[] = []

// 设置顶层DOM的高度
function setupDOMHeight(element: HTMLElement) {
  try {
    // 查找data-v-app元素
    const appElement = element.querySelector('[data-v-app]')
    if (appElement instanceof HTMLElement) {
      // 设置data-v-app元素的高度为100%
      appElement.style.height = '100%'
      console.log('已设置data-v-app元素的高度为100%')
    }
    
    // 查找所有需要设置高度的顶层元素
    const topElements = element.querySelectorAll('.fn__flex-1.fn__flex-column')
    topElements.forEach(el => {
      if (el instanceof HTMLElement) {
        el.style.height = '100%'
        console.log('已设置顶层元素的高度为100%')
      }
    })
    
    // 设置其他可能需要高度的元素
    const userMemoElements = element.querySelectorAll('.en-user-memo')
    userMemoElements.forEach(el => {
      if (el instanceof HTMLElement) {
        el.style.height = '100%'
        console.log('已设置en-user-memo元素的高度为100%')
      }
    })
    
    // 创建MutationObserver监听DOM变化
    const observer = new MutationObserver((mutations) => {
      let needsUpdate = false
      
      // 检查是否有新增的节点需要设置高度
      mutations.forEach(mutation => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          needsUpdate = true
        }
      })
      
      if (needsUpdate) {
        // 重新设置高度
        setupDOMHeightWithoutObserver(element)
      }
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
  // 注册叶子图标
  plugin.addIcons(`
    <symbol id="iconEnLeaf2" viewBox="0 0 1024 1024">
      <path d="M265.344 790.016s291.2 22.016 392.896-101.632c101.632-123.648 68.672-258.24 112.64-392.896 43.968-134.592 156.608-214.272 167.616-214.272 10.944 0-439.616-43.968-629.12 90.624-82.496 57.728-148.416 115.392-164.864 255.552-16.512 140.096 52.16 296.704 27.456 409.344C147.2 949.376 128 971.328 128 971.328l54.976 11.008s43.904-68.672 43.904-156.608c0-87.872 11.008-258.24 167.616-414.848s269.248-178.56 269.248-178.56-145.6 54.912-258.24 203.264c-112.64 148.416-140.16 354.432-140.16 354.432z"></path>
    </symbol>
  `)

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
      console.log(`${DOCK_TYPE} resize`)
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
      
      // 设置DOM高度，使用多个延迟确保在不同时间点都能正确设置高度
      if (this.element instanceof HTMLElement) {
        setTimeout(() => {
          setupDOMHeight(this.element as HTMLElement)
        }, 100)
        
        setTimeout(() => {
          setupDOMHeightWithoutObserver(this.element as HTMLElement)
        }, 500)
        
        setTimeout(() => {
          setupDOMHeightWithoutObserver(this.element as HTMLElement)
        }, 1000)
      }
    },
    destroy() {
      console.log("destroy dock:", DOCK_TYPE)
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
      
      // 设置DOM高度，使用多个延迟确保在不同时间点都能正确设置高度
      if (this.element instanceof HTMLElement) {
        setTimeout(() => {
          setupDOMHeight(this.element as HTMLElement)
        }, 100)
        
        setTimeout(() => {
          setupDOMHeightWithoutObserver(this.element as HTMLElement)
        }, 500)
        
        setTimeout(() => {
          setupDOMHeightWithoutObserver(this.element as HTMLElement)
        }, 1000)
      }
    },
    beforeDestroy() {
      console.log("before destroy tab:", TAB_TYPE)
    },
    destroy() {
      console.log("destroy tab:", TAB_TYPE)
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
