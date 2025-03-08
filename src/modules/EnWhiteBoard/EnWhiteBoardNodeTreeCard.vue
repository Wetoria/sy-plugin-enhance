<template>
  <div
    class="EnWhiteBoardNodeTreeCardContainer"
    :class="{
      'is-collapsed': isCollapsed,
      ...nodeTypeClass,
    }"
    :data-depth="nodeDepth"
    @click="handleNodeClick"
  >
    <!-- 树形卡片模式下的添加子节点按钮 -->
    <div class="add-child-button">
      <a-button
        size="mini"
        type="primary"
        shape="circle"
        @click.stop="handleAddChildNode"
      >
        <template #icon>
          <icon-plus />
        </template>
      </a-button>
    </div>

    <div class="ProtyleToolbarArea">
      <div class="infos">
        <span
          class="block-title"
          :title="displayText"
        >{{ displayText }}</span>
      </div>

      <div class="operations">
        <a-spin v-if="isMergingToSuperBlock">
          <template #icon>
            <icon-sync />
          </template>
        </a-spin>
        <a-button-group size="mini">
          <a-button
            class="active"
            @click="toggleTreeCard"
          >
            <template #icon>
              <IconApps />
            </template>
          </a-button>
        </a-button-group>
      </div>
    </div>

    <div class="main">
      <slot></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { getNewDailyNoteBlockId } from '@/modules/DailyNote/DailyNote'
import {
  generateWhiteBoardNodeId,
  useWhiteBoardModule,
} from '@/modules/EnWhiteBoard/EnWhiteBoard'
import { EN_CONSTANTS } from '@/utils/Constants'
import {
  IconApps,
  IconPlus,
  IconSync,
} from '@arco-design/web-vue/es/icon'
import {
  useVueFlow,
} from '@vue-flow/core'
import {
  computed,
  nextTick,
  watch,
  onMounted,
  onUnmounted,
} from 'vue'

const props = defineProps<{
  nodeId: string
  isCollapsed: boolean
  displayText: string
  isMergingToSuperBlock: boolean
  nodeData: { nodeType: string, parentId?: string, treecard?: boolean } // 更具体的类型
  whiteBoardConfigData?: any
}>()

// 添加emit定义
const emit = defineEmits<{
  toggleTreeCard: []
  showError: [message: string]
}>()

const {
  moduleOptions: moduleWhiteBoardOptions,
} = useWhiteBoardModule()

const {
  getNodes,
  addNodes,
  setNodes,
  edges,
  setEdges,
} = useVueFlow()

// 获取子节点函数
const getChildNodes = () => {
  const nodes = getNodes.value || []
  return nodes.filter((node) => node.data?.parentId === props.nodeId)
}

// 添加类型定义
interface NodePosition {
  x: number
  y: number
}

interface BatchCreateOptions {
  blockId: string
  position: NodePosition
  edgeColor: string
}

interface NodePositionResult {
  newPosition: NodePosition
  siblingPositions: Map<string, NodePosition>
}

// 修改布局工具函数
const layoutUtils = {
  // 缓存对象
  cache: {
    heights: new Map(),
    widths: new Map(),
    positions: new Map(),
  },

  // 清除缓存
  clearCache() {
    this.cache.heights.clear()
    this.cache.widths.clear()
    this.cache.positions.clear()
  },

  // 获取节点默认尺寸
  getDefaultDimensions() {
    return {
      width: moduleWhiteBoardOptions.value.cardWidthDefault,
      height: moduleWhiteBoardOptions.value.cardHeightDefault,
    }
  },

  // 计算节点高度（带缓存）
  calculateNodeHeight(node, nodes) {
    const cacheKey = `${node.id}-${node.dimensions?.height}`
    if (this.cache.heights.has(cacheKey)) {
      return this.cache.heights.get(cacheKey)
    }

    const nodeHeight = node.dimensions?.height || this.getDefaultDimensions().height
    this.cache.heights.set(cacheKey, nodeHeight)
    return nodeHeight
  },

  // 计算节点宽度（带缓存）
  calculateNodeWidth(node, nodes) {
    const cacheKey = `${node.id}-${node.dimensions?.width}`
    if (this.cache.widths.has(cacheKey)) {
      return this.cache.widths.get(cacheKey)
    }

    const nodeWidth = node.dimensions?.width || this.getDefaultDimensions().width
    this.cache.widths.set(cacheKey, nodeWidth)
    return nodeWidth
  },

  // 计算树形卡片布局的节点位置 - 不使用连线，纯列式布局
  calculateTreeCardPositions(node, nodes, parentX = 0, parentY = 0) {
    const positions = new Map()
    const horizontalSpacing = 20 // 列之间的间距
    const verticalSpacing = 10 // 同列卡片之间的间距

    const childNodes = nodes.filter((n) => n.data?.parentId === node.id)
    if (childNodes.length === 0) return positions

    const nodeWidth = this.calculateNodeWidth(node, nodes)
    
    // 固定列宽，每列的X坐标是固定的
    const columnWidth = 280 // 固定列宽
    const startX = parentX + columnWidth + horizontalSpacing
    
    // 计算子节点的Y坐标，从上到下依次排列
    let startY = 0 // 起始Y坐标
    
    // 计算子节点位置
    childNodes.forEach((child, index) => {
      const childHeight = this.calculateNodeHeight(child, nodes)
      
      // 设置当前节点位置
      positions.set(child.id, { x: startX, y: startY + (childHeight / 2) })
      
      // 递归计算子节点的子节点位置
      const childPositions = this.calculateTreeCardPositions(
        child,
        nodes,
        startX,
        startY + (childHeight / 2)
      )
      childPositions.forEach((pos, id) => positions.set(id, pos))
      
      // 更新下一个节点的Y坐标
      startY += childHeight + verticalSpacing
    })

    return positions
  },

  // 批量更新节点位置
  async batchUpdateNodePositions(positions, nodes) {
    const updatedNodes = nodes.map((node) => {
      const newPosition = positions.get(node.id)
      if (newPosition) {
        return {
          ...node,
          position: newPosition,
          // 添加过渡动画类
          class: 'treecard-node-transition',
        }
      }
      return node
    })
    return updatedNodes
  },

  // 创建新节点 - 不创建边
  async batchCreateNodeWithoutEdge(parentNode, nodes, options) {
    const {
      blockId,
      position,
    } = options

    const newNodeId = generateWhiteBoardNodeId()
    const newNode = {
      id: newNodeId,
      type: EN_CONSTANTS.EN_WHITE_BOARD_NODE_TYPE_PROTYLE,
      data: {
        blockId,
        parentId: parentNode.id,
        treecard: true,
        nodeType: 'gingko',
      },
      position,
      width: this.getDefaultDimensions().width,
      height: this.getDefaultDimensions().height,
      connectable: false, // 禁用连接
      draggable: true,
      selectable: true,
      class: 'treecard-node-transition column-layout',
    }

    return {
      nodes: [...nodes, newNode],
      newNode,
    }
  },

  // 计算新节点位置
  calculateNewNodePosition(parentNode, siblings, nodes) {
    const columnWidth = 280 // 固定列宽
    const horizontalSpacing = 20 // 列之间的间距
    const verticalSpacing = 10 // 同列卡片之间的间距
    
    const parentWidth = parentNode.dimensions?.width || this.getDefaultDimensions().width
    
    // 计算X坐标 - 固定在父节点右侧的下一列
    const startX = parentNode.position.x + columnWidth + horizontalSpacing
    
    // 如果没有兄弟节点，直接放在列的顶部
    if (siblings.length === 0) {
      return {
        newPosition: {
          x: startX,
          y: 0
        },
        siblingPositions: new Map()
      }
    }
    
    // 找到最后一个兄弟节点的位置和高度
    const lastSibling = siblings[siblings.length - 1]
    const lastSiblingHeight = lastSibling.dimensions?.height || this.getDefaultDimensions().height
    const lastSiblingY = lastSibling.position.y
    
    // 新节点放在最后一个兄弟节点的下方
    const newPosition = {
      x: startX,
      y: lastSiblingY + lastSiblingHeight/2 + verticalSpacing + this.getDefaultDimensions().height/2
    }
    
    return {
      newPosition,
      siblingPositions: new Map() // 不需要更新兄弟节点位置
    }
  }
}

// 添加新的缓存管理器
const layoutCache = {
  nodeHeights: new Map(),
  nodeWidths: new Map(),
  nodePositions: new Map(),
  pendingUpdates: new Set(),
  batchTimeout: null,

  clear() {
    this.nodeHeights.clear()
    this.nodeWidths.clear()
    this.nodePositions.clear()
    this.pendingUpdates.clear()
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout)
      this.batchTimeout = null
    }
  },

  // 批量处理节点更新
  scheduleBatchUpdate() {
    if (this.batchTimeout) return

    this.batchTimeout = setTimeout(() => {
      this.processBatchUpdate()
    }, 16) // 约一帧的时间
  },

  async processBatchUpdate() {
    if (this.pendingUpdates.size === 0) return

    const nodes = getNodes.value
    const updatedNodes = new Map()

    // 按层级排序节点以确保正确的更新顺序
    const sortedNodes = Array.from(this.pendingUpdates)
      .map((id) => nodes.find((n) => n.id === id))
      .filter(Boolean)
      .sort((a, b) => {
        const aDepth = getNodeDepth(a, nodes)
        const bDepth = getNodeDepth(b, nodes)
        return aDepth - bDepth
      })

    // 批量计算所有需要更新的节点位置
    for (const node of sortedNodes) {
      const positions = calculateTreeCardPositionsOptimized(
        node,
        nodes,
        node.position.x,
        node.position.y,
      )
      positions.forEach((pos, id) => updatedNodes.set(id, pos))
    }

    // 一次性更新所有节点位置
    if (updatedNodes.size > 0) {
      const finalNodes = nodes.map((node) => {
        const newPos = updatedNodes.get(node.id)
        return newPos
          ? {
              ...node,
              position: newPos,
            }
          : node
      })
      setNodes(finalNodes)
    }

    this.pendingUpdates.clear()
    this.batchTimeout = null
  },
}

// 获取节点深度
const getNodeDepth = (node, nodes, cache = new Map()) => {
  if (cache.has(node.id)) return cache.get(node.id)

  if (!node.data?.parentId) {
    cache.set(node.id, 0)
    return 0
  }

  const parent = nodes.find((n) => n.id === node.data.parentId)
  if (!parent) {
    cache.set(node.id, 0)
    return 0
  }

  const parentDepth = getNodeDepth(parent, nodes, cache)
  const depth = parentDepth + 1
  cache.set(node.id, depth)
  return depth
}

// 优化后的高度计算函数
const calculateNodeHeightOptimized = (node, nodes) => {
  if (layoutCache.nodeHeights.has(node.id)) {
    return layoutCache.nodeHeights.get(node.id)
  }

  const nodeHeight = node.dimensions?.height || layoutUtils.getDefaultDimensions().height
  layoutCache.nodeHeights.set(node.id, nodeHeight)
  return nodeHeight
}

// 优化后的宽度计算函数
const calculateNodeWidthOptimized = (node, nodes) => {
  if (layoutCache.nodeWidths.has(node.id)) {
    return layoutCache.nodeWidths.get(node.id)
  }

  const nodeWidth = node.dimensions?.width || layoutUtils.getDefaultDimensions().width
  layoutCache.nodeWidths.set(node.id, nodeWidth)
  return nodeWidth
}

// 优化后的树形卡片位置计算函数
const calculateTreeCardPositionsOptimized = (node, nodes, parentX = 0, parentY = 0) => {
  const positions = new Map()
  const horizontalSpacing = 80 // 增加水平间距，更符合Gingko树形卡片的列式布局
  const verticalSpacing = 20 // 减少垂直间距

  const childNodes = nodes.filter((n) => n.data?.parentId === node.id)
  if (childNodes.length === 0) return positions

  const nodeWidth = calculateNodeWidthOptimized(node, nodes)
  const nodeHeight = calculateNodeHeightOptimized(node, nodes)

  // 计算每个子节点的高度
  const childrenHeights = childNodes.map((child) => calculateNodeHeightOptimized(child, nodes))
  
  // 计算总高度（包括间距）
  const totalHeight = childrenHeights.reduce((sum, height, index) => {
    return sum + height + (index < childrenHeights.length - 1 ? verticalSpacing : 0)
  }, 0)

  // 计算起始Y坐标，使整体垂直居中
  let startY = parentY - (totalHeight / 2) + (nodeHeight / 2)
  // 水平位置固定在父节点右侧，增加间距使其更像列式布局
  const startX = parentX + nodeWidth + horizontalSpacing

  // 计算子节点位置
  childNodes.forEach((child, index) => {
    const childHeight = childrenHeights[index]
    
    const childY = startY + (childHeight / 2)
    positions.set(child.id, { x: startX, y: childY })

    // 递归计算子节点的子节点位置
    const childPositions = calculateTreeCardPositionsOptimized(
      child,
      nodes,
      startX,
      childY
    )
    childPositions.forEach((pos, id) => positions.set(id, pos))

    startY += childHeight + verticalSpacing
  })

  return positions
}

// 更新节点布局
const updateNodeLayout = (nodeId) => {
  layoutCache.pendingUpdates.add(nodeId)
  layoutCache.scheduleBatchUpdate()
}

// 递归更新树形卡片布局
const updateTreeCardLayoutRecursively = (nodeId) => {
  const nodes = getNodes.value
  const node = nodes.find((n) => n.id === nodeId)
  if (!node || !node.position) return

  // 清除旧的缓存
  layoutCache.clear()

  // 收集需要更新的所有节点
  const nodesToUpdate = new Set()
  const collectNodes = (currentNode) => {
    if (!currentNode) return
    if (currentNode.data?.treecard) {
      nodesToUpdate.add(currentNode.id)
    }
    if (currentNode.data?.parentId) {
      const parentNode = nodes.find((n) => n.id === currentNode.data.parentId)
      collectNodes(parentNode)
    }
  }
  collectNodes(node)

  // 将所有需要更新的节点添加到待更新队列
  nodesToUpdate.forEach((id) => layoutCache.pendingUpdates.add(id))
  layoutCache.scheduleBatchUpdate()
}

// 计算边的颜色
const calculateEdgeColor = (parentEdge, siblings, currentEdges) => {
  let edgeColor = presetColors[0]
  if (parentEdge?.data?.color) {
    edgeColor = parentEdge.data.color
  } else if (siblings.length > 0) {
    const sourceEdges = currentEdges.filter((edge) => edge.source === props.nodeId)
      .sort((a, b) => {
        const nodeA = getNodes.value.find((node) => node.id === a.target)
        const nodeB = getNodes.value.find((node) => node.id === b.target)
        return (nodeB?.position.x || 0) - (nodeA?.position.x || 0)
      })
    if (sourceEdges[0]?.data?.color) {
      const lastColorIndex = presetColors.findIndex((color) => color === sourceEdges[0].data.color)
      if (lastColorIndex !== -1) {
        edgeColor = presetColors[(lastColorIndex + 1) % presetColors.length]
      }
    }
  }
  return edgeColor
}

// 添加子节点函数
const handleAddChildNode = async () => {
  try {
    const nodes = getNodes.value || []
    const parentNode = nodes.find((node) => node.id === props.nodeId)
    if (!parentNode?.position) {
      console.warn('Parent node not found or invalid')
      return
    }

    // 1. 获取所需数据
    const blockId = await getNewDailyNoteBlockId()
    const siblings = nodes.filter((node) => node.data?.parentId === props.nodeId)

    // 2. 计算最终位置
    const {
      newPosition,
    } = layoutUtils.calculateNewNodePosition(
      parentNode,
      siblings,
      nodes,
    )

    // 3. 创建新节点（不创建边）
    const {
      nodes: updatedNodes,
      newNode,
    } = await layoutUtils.batchCreateNodeWithoutEdge(
      parentNode,
      nodes,
      {
        blockId,
        position: newPosition,
      },
    )

    // 4. 批量更新状态
    await nextTick()
    setNodes(updatedNodes)

    // 5. 同步更新配置
    if (props.whiteBoardConfigData) {
      props.whiteBoardConfigData.boardOptions.nodes = updatedNodes
    }

    // 6. 等待节点渲染完成后更新布局
    await waitForNodeDimensions([newNode])
    await updateTreeCardLayoutRecursively(props.nodeId)
    
    // 7. 滚动到新节点
    setTimeout(() => {
      scrollToNode(newNode.id)
    }, 100)
  } catch (error) {
    console.error('Error creating new node:', error)
    // 提示用户发生错误
    emit('showError', '创建新节点时发生错误，请重试。')
  }
}

// 检查节点尺寸是否已准备好
const isNodeDimensionsReady = (node) => {
  return node.dimensions?.width && node.dimensions?.height
}

// 添加预设颜色数组
const presetColors = [
  'var(--b3-font-background1)',
  'var(--b3-font-background2)',
  'var(--b3-font-background3)',
  'var(--b3-font-background4)',
  'var(--b3-font-background5)',
  'var(--b3-font-background6)',
  'var(--b3-font-background7)',
  'var(--b3-font-background8)',
  'var(--b3-font-background9)',
  'var(--b3-font-background10)',
  'var(--b3-font-background11)',
  'var(--b3-font-background12)',
  'var(--b3-font-background13)',
]

// 添加节点类型相关的计算属性
const nodeType = computed(() => props.nodeData?.nodeType || 'protyle')
const isTextNode = computed(() => nodeType.value === 'text')
const isGingkoNode = computed(() => nodeType.value === 'gingko')

// 根据节点类型更新样式
const nodeTypeClass = computed(() => ({
  'is-text': isTextNode.value,
  'is-gingko': isGingkoNode.value,
}))

// 计算节点深度
const nodeDepth = computed(() => {
  let depth = 0
  let currentNodeId = props.nodeId
  let parentId = props.nodeData?.parentId
  
  const nodes = getNodes.value || []
  
  // 向上遍历父节点计算深度
  while (parentId) {
    depth++
    const parentNode = nodes.find(node => node.id === parentId)
    if (!parentNode) break
    
    parentId = parentNode.data?.parentId
  }
  
  return depth
})

// 切换树形卡片模式
const toggleTreeCard = () => {
  emit('toggleTreeCard')
}

// 监听节点变化，处理删除等操作
watch(() => getNodes.value, (newNodes, oldNodes) => {
  if (!oldNodes) return

  // 检查是否有节点被删除
  const deletedNodes = oldNodes.filter((oldNode) =>
    !newNodes.some((newNode) => newNode.id === oldNode.id),
  )

  // 如果有节点被删除，检查是否需要更新相关树形卡片布局
  if (deletedNodes.length > 0) {
    deletedNodes.forEach((deletedNode) => {
      if (deletedNode.data?.parentId) {
        const parentNode = newNodes.find((node) => node.id === deletedNode.data.parentId)
        if (parentNode?.data?.treecard) {
          updateTreeCardLayoutRecursively(parentNode.id)
        }
      }
    })
  }
}, { deep: true })

// 添加子节点数量变化的监听器
watch(() => getChildNodes(), async (newChildNodes, oldChildNodes) => {
  if (!oldChildNodes) return

  // 如果子节点数量发生变化，触发重新布局
  if (newChildNodes.length !== oldChildNodes.length) {
    await updateTreeCardLayoutRecursively(props.nodeId)
  }
}, { deep: true })

// 等待节点尺寸函数
const waitForNodeDimensions = (nodes, maxAttempts = 3) => {
  return new Promise((resolve) => {
    let attempts = 0
    const check = () => {
      attempts++
      const allReady = nodes.every((node) =>
        node && node.dimensions?.width && node.dimensions?.height,
      )
      if (allReady || attempts >= maxAttempts) {
        resolve(allReady)
      } else {
        requestAnimationFrame(check)
      }
    }
    check()
  })
}

// 添加滚动到节点的函数
const scrollToNode = (nodeId) => {
  const nodes = getNodes.value
  const targetNode = nodes.find(n => n.id === nodeId)
  if (!targetNode) return
  
  // 找到所有相关节点（父节点链和子节点）
  const relatedNodes = {
    parents: [],
    current: targetNode,
    children: []
  }
  
  // 向上查找所有父节点
  let currentId = targetNode.data?.parentId
  while (currentId) {
    const parent = nodes.find(n => n.id === currentId)
    if (!parent) break
    
    relatedNodes.parents.unshift(parent) // 添加到父节点链的开头
    currentId = parent.data?.parentId
  }
  
  // 向下查找直接子节点
  const findDirectChildren = (parentId) => {
    return nodes.filter(n => n.data?.parentId === parentId)
  }
  relatedNodes.children = findDirectChildren(nodeId)
  
  // 触发自定义滚动事件
  const event = new CustomEvent('scroll-to-treecard-node', { 
    detail: { 
      nodeId,
      relatedNodes
    } 
  })
  document.dispatchEvent(event)
}

// 添加事件监听器，响应滚动对齐事件
onMounted(() => {
  const handleUpdateLayout = (event) => {
    const { nodeId } = event.detail
    if (nodeId === props.nodeId) {
      updateTreeCardLayoutRecursively(nodeId)
    }
  }
  
  const handleScrollToNode = (event) => {
    const { nodeId, relatedNodes } = event.detail
    
    // 如果当前节点是目标节点，或者是目标节点的父节点或子节点，需要滚动到可见区域
    if (nodeId === props.nodeId || 
        relatedNodes.parents.some(p => p.id === props.nodeId) ||
        relatedNodes.children.some(c => c.id === props.nodeId)) {
      
      // 获取节点DOM元素
      const nodeElement = document.querySelector(`[data-en-flow-node-id='${props.nodeId}']`)
      if (!nodeElement) return
      
      // 计算滚动位置
      let scrollTop = 0
      
      if (nodeId === props.nodeId) {
        // 当前节点是目标节点，居中显示
        scrollTop = nodeElement.offsetTop - (window.innerHeight / 2) + (nodeElement.offsetHeight / 2)
      } else if (relatedNodes.parents.some(p => p.id === props.nodeId)) {
        // 当前节点是目标节点的父节点，与根节点对齐
        const rootNode = relatedNodes.parents[0] || relatedNodes.current
        const rootElement = document.querySelector(`[data-en-flow-node-id='${rootNode.id}']`)
        if (rootElement) {
          scrollTop = nodeElement.offsetTop - rootElement.offsetTop
        }
      } else if (relatedNodes.children.some(c => c.id === props.nodeId)) {
        // 当前节点是目标节点的子节点，与目标节点对齐
        const targetElement = document.querySelector(`[data-en-flow-node-id='${nodeId}']`)
        if (targetElement) {
          scrollTop = nodeElement.offsetTop - targetElement.offsetTop
        }
      }
      
      // 执行滚动
      const container = nodeElement.closest('.vue-flow__transformationpane')
      if (container) {
        container.scrollTop = scrollTop
      }
    }
  }
  
  document.addEventListener('update-treecard-layout', handleUpdateLayout)
  document.addEventListener('scroll-to-treecard-node', handleScrollToNode)
  
  // 组件卸载时移除事件监听器
  onUnmounted(() => {
    document.removeEventListener('update-treecard-layout', handleUpdateLayout)
    document.removeEventListener('scroll-to-treecard-node', handleScrollToNode)
  })
})

// 添加点击事件，实现聚焦功能
const handleNodeClick = () => {
  scrollToNode(props.nodeId)
}
</script>

<style lang="scss" scoped>
.EnWhiteBoardNodeTreeCardContainer {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  border-color: var(--b3-theme-primary-light);
  background-color: var(--b3-theme-background);
  border-radius: 4px;
  border: 1px solid;
  position: relative;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
  width: 260px; // 固定宽度，类似Lineage的列宽

  &:hover {
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
    border-color: var(--b3-theme-primary);

    .add-child-button {
      opacity: 1;
      transform: translateX(50%) scale(1);
    }
  }

  .add-child-button {
    position: absolute;
    right: -16px;
    top: 50%;
    transform: translateY(-50%) scale(0.9);
    z-index: 10;
    opacity: 0;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .ProtyleToolbarArea {
    width: 100%;
    height: 32px;
    flex-shrink: 0;
    background-color: var(--b3-theme-surface-light);
    display: flex;
    align-items: center;
    justify-content: space-between;
    box-sizing: border-box;
    padding: 4px 8px;
    border-bottom: 1px solid var(--b3-border-color);
  }

  .main {
    flex: 1;
    position: relative;
    overflow: hidden;
    padding: 8px;
  }

  &.is-collapsed {
    height: 32px;
    min-height: 32px;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);

    .main {
      display: none;
    }
  }
  
  &.is-gingko {
    border-left: 3px solid var(--b3-theme-primary);
    
    .ProtyleToolbarArea {
      background-color: var(--b3-theme-surface-lighter);
    }
    
    &[data-depth="0"] {
      border-left-color: var(--b3-font-background1);
    }
    
    &[data-depth="1"] {
      border-left-color: var(--b3-font-background2);
    }
    
    &[data-depth="2"] {
      border-left-color: var(--b3-font-background3);
    }
    
    &[data-depth="3"] {
      border-left-color: var(--b3-font-background4);
    }
    
    &[data-depth="4"] {
      border-left-color: var(--b3-font-background5);
    }
    
    &[data-depth="5"] {
      border-left-color: var(--b3-font-background6);
    }
  }
}

:deep(.treecard-node-transition) {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
</style> 