import { getBlockAttrs, setBlockAttrs } from '@/api'
import { usePlugin } from '@/main'

// 卡片属性名称
const CARD_ATTR_NAME = 'custom-en-link-card'

// 注册块菜单处理函数
export function registerBlockLinkCardMenu() {
  const plugin = usePlugin()
  
  // 注册块菜单处理 - 只使用click-blockicon事件
  plugin.eventBus.on('click-blockicon', handleBlockMenu)
  
  // 卸载时清理事件
  return () => {
    plugin.eventBus.off('click-blockicon', handleBlockMenu)
  }
}


// 块菜单处理函数
async function handleBlockMenu({detail}: any) {
  console.log('块菜单触发', detail)
  const { menu, blockElements } = detail
  
  // 如果没有被选中的块，退出
  if (!blockElements || blockElements.length === 0) {
    return
  }
  
  // 简化检测逻辑，不再预先过滤太多
  const validBlocks = blockElements

  // 向菜单添加项
  menu.addItem({
    iconHTML: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><rect x="7" y="7" width="10" height="10" rx="2" ry="2"></rect></svg>',
    label: '设置链接/块引用为卡片',
    click: () => {
      // 对所有块执行切换操作
      Promise.all(validBlocks.map(async (item: HTMLElement) => {
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
        } catch (e) {
          console.error('设置块属性失败:', e)
        }
      }))
    }
  })
}

// 检查有效的可以转换为卡片的块
async function checkValidBlocks(blockElements: HTMLElement[]): Promise<HTMLElement[]> {
  if (!blockElements || blockElements.length === 0) return []
  
  const validBlocks: HTMLElement[] = []
  
  for (const item of blockElements) {
    // 检查是否包含链接或块引用
    const hasLink = !!item.querySelector('span[data-type*="a"]')
    const hasBlockRef = !!item.querySelector('span[data-type*="block-ref"]')
    
    if (hasLink || hasBlockRef) {
      validBlocks.push(item)
    }
  }
  
  return validBlocks
} 