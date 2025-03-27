<template>
  <div class="EnWhiteBoardNodeFit">
    <!-- 组件不渲染任何UI元素，只提供自动高度适配逻辑 -->
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onBeforeUnmount, computed, nextTick } from 'vue'
import { useVueFlow, type Node } from '@vue-flow/core'
import { debounce } from 'lodash-es'
import { EN_CONSTANTS } from '@/utils/Constants'

const props = defineProps<{
  nodeId: string
  whiteBoardConfigData?: any
}>()

const emit = defineEmits<{
  (e: 'height-changed', height: number): void
}>()

// VueFlow实例
const { findNode, getNodes, setNodes } = useVueFlow()

// 状态管理
const _isAutoHeightEnabled = ref(false)
const nodeOriginalHeights = ref(new Map())
let contentObserver: MutationObserver | null = null

// 高度缓存，减少重复计算
const layoutHeightCache = new Map()

// 计算当前节点
const currentNode = computed(() => {
  if (!props.nodeId) return null
  return findNode(props.nodeId)
})

// 断开自动高度观察器
const disconnectAutoHeightObserver = () => {
  if (contentObserver) {
    contentObserver.disconnect()
    contentObserver = null
  }
}

// 调整节点高度的核心函数
const adjustNodeHeight = () => {
  if (!props.nodeId) return
  
  const nodeElement = document.querySelector(`[data-en-flow-node-id='${props.nodeId}']`)
  if (!nodeElement) return
  
  const wysiwygElement = nodeElement.querySelector('.protyle-wysiwyg.protyle-wysiwyg--attr')
  if (!wysiwygElement) return
  
  // 获取当前节点
  const nodes = getNodes.value
  const currentNode = nodes.find(node => node.id === props.nodeId)
  if (!currentNode) return
  
  // 检查节点是否正在调整大小
  const isNodeResizing = currentNode.resizing
  
  // 保存原始高度（如果还没保存）
  if (!nodeOriginalHeights.value.has(props.nodeId)) {
    nodeOriginalHeights.value.set(props.nodeId, (currentNode as any).height || currentNode.dimensions?.height || 200)
  }
  
  // 检查节点是否折叠
  const isCollapsed = currentNode.data?.isCollapsed || false
  
  // 计算总高度
  const toolbarHeight = isCollapsed ? 30 : 0 // 仅在折叠状态下添加ProtyleToolbarArea高度
  const borderWidth = 4 // 上下边框宽度总和
  
  // 使用缓存的内容高度或计算新高度
  let contentHeight = layoutHeightCache.get(props.nodeId)
  if (contentHeight === undefined) {
    contentHeight = wysiwygElement.scrollHeight // 内容实际高度
    layoutHeightCache.set(props.nodeId, contentHeight)
  }

  // 计算节点需要的总高度
  const newHeight = toolbarHeight + contentHeight + borderWidth

  // 获取当前样式中的高度（如果有）
  const nodeStyle = currentNode.style as Record<string, any> | undefined
  const currentStyleHeight = nodeStyle?.height
  
  const currentHeightValue = currentStyleHeight 
    ? parseInt(currentStyleHeight.toString().replace('px', '')) 
    : 0

  // 只有当高度真的发生变化时才更新
  if (!currentStyleHeight || currentHeightValue !== newHeight) {
    // 首先直接更新DOM元素样式以实现即时反馈
    if (nodeElement) {
      // 添加过渡效果并设置高度，但在手动调整大小时禁用过渡
      const htmlElement = nodeElement as HTMLElement
      if (htmlElement) {
        // 只在自动高度模式且不是手动调整大小时使用过渡
        if (_isAutoHeightEnabled.value && !isNodeResizing) {
          htmlElement.style.transition = 'height 0.1s ease-out' // 缩短过渡时间为0.1s
        } else {
          htmlElement.style.transition = 'none' // 手动调整时无过渡
        }
        htmlElement.style.height = `${newHeight}px`
      }
    }
    
    // 直接更新Vue Flow节点数据
    const newNodes = nodes.map((node) => {
      if (node.id === props.nodeId) {
        // 构建新的样式对象 - 仅在自动高度模式且不是手动调整大小时添加transition
        const newStyle: Record<string, any> = typeof node.style === 'object' 
          ? { 
              ...(node.style as Record<string, any>), 
              height: `${newHeight}px`, 
              // 只在自动高度模式且不是手动调整大小时添加过渡
              ...(_isAutoHeightEnabled.value && !isNodeResizing) ? { transition: 'height 0.1s ease-out' } : {}
            } 
          : { 
              height: `${newHeight}px`, 
              ...(_isAutoHeightEnabled.value && !isNodeResizing) ? { transition: 'height 0.1s ease-out' } : {}
            }
        
        // 确保同步更新dimensions属性
        const updatedDimensions = {
          ...(node.dimensions || {}),
          height: newHeight
        }
          
        return {
          ...node,
          data: {
            ...node.data,
            // 保持当前的自动高度状态，单次调整不改变这个标志
            isAutoHeight: _isAutoHeightEnabled.value,
            // 添加原始高度到数据中，便于后续恢复
            originalHeight: _isAutoHeightEnabled.value ? nodeOriginalHeights.value.get(props.nodeId) : undefined
          },
          style: newStyle,
          // 直接更新节点高度属性，确保Vue Flow内部状态同步
          height: newHeight,
          // 更新dimensions属性
          dimensions: updatedDimensions
        }
      }
      return node
    })
    
    // 立即更新节点数据
    setNodes(newNodes)
    if (props.whiteBoardConfigData) {
      props.whiteBoardConfigData.boardOptions.nodes = newNodes
    }
    
    // 发送高度变化事件
    emit('height-changed', newHeight)
  }
}

// 设置自动高度观察器
const setupAutoHeightObserver = () => {
  // 先移除可能存在的观察器
  disconnectAutoHeightObserver()
  
  if (!props.nodeId) return
  
  const nodeElement = document.querySelector(`[data-en-flow-node-id='${props.nodeId}']`)
  if (!nodeElement) return
  
  const wysiwygElement = nodeElement.querySelector('.protyle-wysiwyg.protyle-wysiwyg--attr')
  if (!wysiwygElement) return
  
  // 只在非调整状态下添加平滑过渡效果
  const htmlElement = nodeElement as HTMLElement
  if (htmlElement) {
    const node = getNodes.value.find(n => n.id === props.nodeId)
    if (!node?.resizing) {
      htmlElement.style.transition = 'height 0.1s ease-out' // 缩短过渡时间
    }
  }
  
  // 创建一个新的MutationObserver，使用更短的防抖时间
  contentObserver = new MutationObserver(debounce(() => {
    // 在调整前清除缓存，确保获取最新高度
    layoutHeightCache.delete(props.nodeId)
    adjustNodeHeight()
  }, 16)) // 减少到16ms（一帧的时间），提高响应速度
  
  // 配置观察选项
  const config = { 
    childList: true, 
    subtree: true, 
    characterData: true,
    attributes: true 
  }
  
  // 开始观察
  contentObserver.observe(wysiwygElement, config)
  
  // 清除缓存并立即执行一次高度调整
  layoutHeightCache.delete(props.nodeId)
  adjustNodeHeight()
}

// 恢复原始高度
const restoreOriginalHeight = () => {
  if (!props.nodeId) return
  
  const nodes = getNodes.value
  const currentNode = nodes.find(node => node.id === props.nodeId)
  if (!currentNode) return
  
  // 如果有保存的原始高度，恢复它
  if (nodeOriginalHeights.value.has(props.nodeId)) {
    const originalHeight = nodeOriginalHeights.value.get(props.nodeId)
    
    // 首先直接更新DOM以立即反馈
    const nodeElement = document.querySelector(`[data-en-flow-node-id='${props.nodeId}']`)
    if (nodeElement) {
      // 添加短暂过渡效果
      const htmlElement = nodeElement as HTMLElement
      if (htmlElement) {
        htmlElement.style.transition = 'height 0.1s ease-out' // 缩短过渡时间
        htmlElement.style.height = `${originalHeight}px`
      }
    }
    
    const newNodes = nodes.map((node) => {
      if (node.id === props.nodeId) {
        // 构建新的样式对象，使用短暂过渡
        const newStyle: Record<string, any> = typeof node.style === 'object' 
          ? { ...(node.style as Record<string, any>), height: `${originalHeight}px`, transition: 'height 0.1s ease-out' } 
          : { height: `${originalHeight}px`, transition: 'height 0.1s ease-out' }
        
        // 确保同步更新dimensions属性
        const updatedDimensions = {
          ...(node.dimensions || {}),
          height: originalHeight
        }
          
        return {
          ...node,
          data: {
            ...node.data,
            isAutoHeight: false, // 关闭自动高度标志
            originalHeight: undefined // 清除原始高度数据
          },
          style: newStyle,
          // 直接更新节点高度属性
          height: originalHeight,
          // 更新dimensions属性
          dimensions: updatedDimensions
        }
      }
      return node
    })
    
    // 立即更新节点数据
    setNodes(newNodes)
    if (props.whiteBoardConfigData) {
      props.whiteBoardConfigData.boardOptions.nodes = newNodes
    }
    
    // 发送高度变化事件
    emit('height-changed', originalHeight)
  }
}

// 切换自动高度状态
const toggleAutoHeight = () => {
  _isAutoHeightEnabled.value = !_isAutoHeightEnabled.value
  
  // 如果启用了自动高度，设置MutationObserver监听内容变化
  if (_isAutoHeightEnabled.value) {
    setupAutoHeightObserver()
  } else {
    disconnectAutoHeightObserver()
    // 恢复为原始高度
    restoreOriginalHeight()
  }
}

// 监听节点是否在手动调整大小
watch(() => {
  // 找到当前节点
  if (!props.nodeId) return false
  const node = getNodes.value.find(n => n.id === props.nodeId)
  return node?.resizing
}, (isResizing) => {
  // 如果节点在手动调整大小
  if (isResizing) {
    // 断开自动高度观察器（如果启用了自动高度）
    if (_isAutoHeightEnabled.value) {
      disconnectAutoHeightObserver()
    }
    
    // 立即移除过渡效果以提供即时拖拽体验
    const nodeElement = document.querySelector(`[data-en-flow-node-id='${props.nodeId}']`)
    if (nodeElement) {
      const htmlElement = nodeElement as HTMLElement
      if (htmlElement) {
        htmlElement.style.transition = 'none'
      }
    }
    
    // 清除高度缓存，确保拖拽后获取正确高度
    layoutHeightCache.delete(props.nodeId)
  } else {
    // 手动调整大小结束后，延迟恢复自动高度以避免抖动
    setTimeout(() => {
      // 当手动调整结束
      if (_isAutoHeightEnabled.value) {
        // 如果自动高度功能开启，重新启用观察器
        setupAutoHeightObserver()
      } else {
        // 如果不是自动高度模式，立即同步DOM高度和节点数据
        const nodes = getNodes.value
        const currentNode = nodes.find(node => node.id === props.nodeId)
        
        if (currentNode) {
          // 获取当前节点的高度
          const currentHeight = (currentNode as any).height
          
          // 立即同步DOM高度，无过渡
          const nodeElement = document.querySelector(`[data-en-flow-node-id='${props.nodeId}']`)
          if (nodeElement) {
            const htmlElement = nodeElement as HTMLElement
            htmlElement.style.transition = 'none'
            htmlElement.style.height = `${currentHeight}px`
          }
          
          // 更新原始高度记录
          nodeOriginalHeights.value.set(props.nodeId, currentHeight)
          
          // 确保节点数据中的style.height与实际高度一致
          const nodeStyle = currentNode.style as Record<string, any> | undefined
          if (nodeStyle?.height !== `${currentHeight}px`) {
            const newNodes = nodes.map((node) => {
              if (node.id === props.nodeId) {
                const newStyle: Record<string, any> = typeof node.style === 'object'
                  ? { ...(node.style as Record<string, any>), height: `${currentHeight}px`, transition: 'none' }
                  : { height: `${currentHeight}px`, transition: 'none' }
                  
                // 确保同步更新dimensions属性
                const updatedDimensions = {
                  ...(node.dimensions || {}),
                  height: currentHeight
                }
                  
                return {
                  ...node,
                  style: newStyle,
                  height: currentHeight,
                  dimensions: updatedDimensions,
                  data: {
                    ...node.data,
                    originalHeight: currentHeight // 更新原始高度记录
                  }
                }
              }
              return node
            })
            
            // 立即更新节点数据
            setNodes(newNodes)
            if (props.whiteBoardConfigData) {
              props.whiteBoardConfigData.boardOptions.nodes = newNodes
            }
          }
        }
      }
    }, 100) // 短暂延迟，避免拖拽结束后的抖动
  }
}, { immediate: true })

// 根据当前节点状态初始化自动高度状态
watch(() => props.nodeId, (nodeId) => {
  if (nodeId) {
    const node = getNodes.value.find(node => node.id === nodeId)
    _isAutoHeightEnabled.value = node?.data?.isAutoHeight || false
    
    // 如果节点已启用自动高度，启动观察器
    if (_isAutoHeightEnabled.value) {
      nextTick(() => {
        setupAutoHeightObserver()
      })
    }
  } else {
    // 如果节点ID为空，重置状态
    _isAutoHeightEnabled.value = false
    disconnectAutoHeightObserver()
    // 清除缓存
    layoutHeightCache.clear()
  }
}, { immediate: true })

// 组件卸载时清理
onBeforeUnmount(() => {
  disconnectAutoHeightObserver()
  layoutHeightCache.clear()
})

// 监听节点高度变化，确保DOM高度同步
watch(() => {
  if (!props.nodeId) return null
  
  const node = getNodes.value.find(n => n.id === props.nodeId)
  if (!node) return null
  
  return {
    height: node.height,
    dimHeight: node.dimensions?.height,
    styleHeight: (node.style as Record<string, any> | undefined)?.height,
    resizing: node.resizing
  }
}, (newState) => {
  if (!newState || newState.resizing) return
  
  // 如果高度发生变化且不在调整大小状态，就同步DOM高度
  const nodeElement = document.querySelector(`[data-en-flow-node-id='${props.nodeId}']`)
  if (!nodeElement) return
  
  const htmlElement = nodeElement as HTMLElement
  const heightValue = newState.height || newState.dimHeight
  
  if (heightValue && htmlElement) {
    const heightStr = `${heightValue}px`
    if (htmlElement.style.height !== heightStr) {
      // 不添加过渡效果，确保同步即时更新
      htmlElement.style.transition = 'none'
      htmlElement.style.height = heightStr
    }
  }
}, { deep: true })

// 直接监听正在调整大小时的高度变化，实时更新DOM
watch(() => {
  if (!props.nodeId) return null
  
  const node = getNodes.value.find(n => n.id === props.nodeId)
  if (!node || !node.resizing) return null
  
  // 只返回正在调整大小时的高度值
  return node.dimensions?.height || node.height
}, (newHeight) => {
  if (!newHeight) return
  
  // 直接更新DOM高度，无过渡无延迟
  const nodeElement = document.querySelector(`[data-en-flow-node-id='${props.nodeId}']`)
  if (nodeElement) {
    const htmlElement = nodeElement as HTMLElement
    htmlElement.style.transition = 'none'
    htmlElement.style.height = `${newHeight}px`
  }
}, { immediate: true })

// 提供给父组件的方法
defineExpose({
  adjustNodeHeight,
  toggleAutoHeight,
  setupAutoHeightObserver,
  disconnectAutoHeightObserver,
  isAutoHeightEnabled: computed(() => _isAutoHeightEnabled.value)
})
</script>

<style scoped>
.EnWhiteBoardNodeFit {
  display: none;
}
</style>
