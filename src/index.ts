import PluginInfoString from '@/../plugin.json'
import '@/utils/GlobalModule'
import '@/utils/Log'
import {
    getFrontend,
    IObject,
    Plugin
} from "siyuan"
import {
    destroy,
    init,
} from './main'

import { initDock } from '@/modules/EnLeafPanel/EnLeafPanel'
import { openSettings } from '@/modules/Settings/Settings'
import { getBlockAttrs, setBlockAttrs } from './api'
import { SyFrontendTypes } from './utils/Siyuan'

const DOCK_TYPE = 'sy_plugin_enhance_dock'
// 卡片属性名称
const CARD_ATTR_NAME = 'custom-en-link-card'

let PluginInfo = {
  version: '',
}
try {
  PluginInfo = PluginInfoString
} catch (err) {
  console.log('err is ', err)
}
const {
  version,
} = PluginInfo

export default class EnhancePlugin extends Plugin {
  public isMobile: boolean
  public isBrowser: boolean
  public isLocal: boolean
  public isElectron: boolean
  public isInWindow: boolean
  public platform: SyFrontendTypes
  public readonly version = version
  // 修正类型声明
  declare readonly i18n: IObject 
  
  // 绑定this的菜单处理函数
  private blockIconEventBindThis = this.blockIconEvent.bind(this) 

  async onload() {
    const frontEnd = getFrontend()
    this.platform = frontEnd as SyFrontendTypes
    this.isMobile = frontEnd === "mobile" || frontEnd === "browser-mobile"
    this.isBrowser = frontEnd.includes('browser')
    this.isLocal =
      location.href.includes('127.0.0.1')
      || location.href.includes('localhost')
    this.isInWindow = location.href.includes('window.html')

    try {
      require("@electron/remote")
        .require("@electron/remote/main")
      this.isElectron = true
    } catch (err) {
      this.isElectron = false
    }

    // 初始化叶归侧边栏
    initDock(this)
    
    // 注册块菜单事件处理
    this.eventBus.on("click-blockicon", this.blockIconEventBindThis)

    init(this)
  }

  onunload() {
    // 卸载块菜单处理函数
    this.eventBus.off("click-blockicon", this.blockIconEventBindThis)
    destroy()
  }

  openSetting() {
    openSettings()
  }
  
  // 块菜单处理函数
  private blockIconEvent({detail}: any) {
    console.log('块菜单事件触发', detail)
    const { menu, blockElements } = detail
    
    // 如果没有被选中的块，退出
    if (!blockElements || blockElements.length === 0) {
      return
    }
    
    // 向菜单添加项
    menu.addItem({
      iconHTML: '',
      label: '设置链接/块引用为卡片',
      click: () => {
        // 对所有块执行切换操作
        Promise.all(blockElements.map(async (item: HTMLElement) => {
          const nodeId = item.dataset.nodeId
          if (!nodeId) return
          
          try {
            // 先尝试检查块是否包含链接或块引用
            const hasLink = !!item.querySelector('span[data-type*="a"]')
            const hasBlockRef = !!item.querySelector('span[data-type*="block-ref"]')
            
            if (!hasLink && !hasBlockRef) {
              console.log('该块不包含链接或块引用，无法设置为卡片')
              return
            }
          
            // 获取当前块属性
            const blockAttrs = await getBlockAttrs(nodeId)
            // 切换属性值
            const isCard = blockAttrs[CARD_ATTR_NAME] === 'true'
            const newStatus = !isCard // 简单切换属性
            
            // 设置属性
            await setBlockAttrs(nodeId, {
              [CARD_ATTR_NAME]: newStatus ? 'true' : 'false'
            })
            
            console.log('已设置块', nodeId, newStatus ? '为卡片' : '取消卡片')
            
            // 刷新卡片状态
            this.refreshCardStatus(nodeId)
          } catch (e) {
            console.error('设置块属性失败:', e)
          }
        }))
      }
    })
  }
  
  // 刷新卡片状态
  private refreshCardStatus(nodeId: string) {
    // 尝试获取EnParagraphLinkCard组件实例并刷新状态
    try {
      // 获取App中的组件实例
      const appElem = document.querySelector('#enApp')
      if (!appElem) return
      
      // 通过窗口查找组件
      const win = window as any
      if (win.SEP_GLOBAL) {
        // 触发DOM变动来刷新视图（使用MutationObserver方式）
        const blockElement = document.querySelector(`[data-node-id="${nodeId}"]`)
        if (blockElement) {
          // 1. 触发一个细微的DOM变化来让Observer捕获
          const tempAttr = blockElement.getAttribute('data-temp-refresh') || '0'
          blockElement.setAttribute('data-temp-refresh', tempAttr === '0' ? '1' : '0')
          
          // 2. 延迟一点时间再移除临时属性
          setTimeout(() => {
            blockElement.removeAttribute('data-temp-refresh')
          }, 10)
        }
      }
    } catch (e) {
      console.error('刷新卡片状态失败:', e)
    }
  }
}
