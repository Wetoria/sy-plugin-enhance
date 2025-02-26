<template>
  <div
    class="EnWhiteBoardNodeMindmapContainer"
    :class="{
      'is-collapsed': isCollapsed,
      ...nodeTypeClass,
    }"
  >
    <!-- 思维导图模式下的添加子节点按钮 -->
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
            @click="toggleMindmap"
          >
            <template #icon>
              <IconMindMapping />
            </template>
          </a-button>
        </a-button-group>
      </div>
    </div>

    <div class="main">
      <slot></slot>
    </div>

    <!-- 思维导图节点只显示特定连接点 -->
    <Handle
      id="right"
      class="Handle right"
      type="source"
      :position="Position.Right"
    >
      <div class="HandleIcon">
        <IconArrowRight />
      </div>
    </Handle>
    <Handle
      id="left"
      class="Handle left"
      type="target"
      :position="Position.Left"
    >
      <div class="HandleIcon">
        <IconArrowLeft />
      </div>
    </Handle>
  </div>
</template>

<script setup lang="ts">
import { getNewDailyNoteBlockId } from '@/modules/DailyNote/DailyNote'
import {
  generateWhiteBoardEdgeId,
  generateWhiteBoardNodeId,
  useWhiteBoardModule,
} from '@/modules/EnWhiteBoard/EnWhiteBoard'
import { EN_CONSTANTS } from '@/utils/Constants'
import {
  IconArrowLeft,
  IconArrowRight,
  IconMindMapping,
} from '@arco-design/web-vue/es/icon'
import {
  Handle,
  Position,
  useVueFlow,
} from '@vue-flow/core'
import {
  computed,
  nextTick,
  watch,
} from 'vue'

const props = defineProps<{
  nodeId: string
  isCollapsed: boolean
  displayText: string
  isMergingToSuperBlock: boolean
  nodeData: any
  whiteBoardConfigData?: any
}>()

// 添加emit定义
const emit = defineEmits<{
  toggleMindmap: []
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

// 添加getChildNodes函数 - 移到前面
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

// 添加工具函数和缓存
const layoutUtils = {
  // 缓存对象
  cache: {
    heights: new Map(),
    positions: new Map(),
  },

  // 清除缓存
  clearCache() {
    this.cache.heights.clear()
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
    const childNodes = nodes.filter((n) => n.data?.parentId === node.id)

    if (childNodes.length === 0) {
      this.cache.heights.set(cacheKey, nodeHeight)
      return nodeHeight
    }

    const childrenHeights = childNodes.map((child) => this.calculateNodeHeight(child, nodes))
    const verticalSpacing = 20
    const totalChildrenHeight = childrenHeights.reduce((sum, height, index) => {
      return sum + height + (index < childrenHeights.length - 1 ? verticalSpacing : 0)
    }, 0)

    const result = Math.max(nodeHeight, totalChildrenHeight)
    this.cache.heights.set(cacheKey, result)
    return result
  },

  // 计算节点位置
  calculateNodePositions(node, nodes, parentX = 0, startY = 0) {
    const positions = new Map()
    const horizontalSpacing = 150
    const verticalSpacing = 20

    const childNodes = nodes.filter((n) => n.data?.parentId === node.id)
    if (childNodes.length === 0) return positions

    const childrenHeights = childNodes.map((child) => this.calculateNodeHeight(child, nodes))
    const totalHeight = childrenHeights.reduce((sum, height, index) => {
      return sum + height + (index < childrenHeights.length - 1 ? verticalSpacing : 0)
    }, 0)

    const nodeWidth = node.dimensions?.width || this.getDefaultDimensions().width
    const childX = parentX + nodeWidth + horizontalSpacing
    let currentY = startY - (totalHeight / 2) + (node.dimensions?.height || 0) / 2

    childNodes.forEach((child, index) => {
      const childHeight = childrenHeights[index]
      const childY = currentY + (childHeight - (child.dimensions?.height || 0)) / 2

      positions.set(child.id, {
        x: childX,
        y: childY,
      })
      currentY += childHeight + verticalSpacing

      // 递归计算子节点的位置
      const childPositions = this.calculateNodePositions(child, nodes, childX, childY)
      childPositions.forEach((pos, id) => positions.set(id, pos))
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
          class: 'mindmap-node-transition',
        }
      }
      return node
    })
    return updatedNodes
  },

  // 修改方法签名
  async batchCreateNodeWithEdge(parentNode: any, nodes: any[], edges: any[], options: BatchCreateOptions) {
    const {
      blockId,
      position,
      edgeColor,
    } = options

    const newNodeId = generateWhiteBoardNodeId()
    const newNode = {
      id: newNodeId,
      type: EN_CONSTANTS.EN_WHITE_BOARD_NODE_TYPE_PROTYLE,
      data: {
        blockId,
        parentId: parentNode.id,
        mindmap: true,
      },
      position,
      width: this.getDefaultDimensions().width,
      height: this.getDefaultDimensions().height,
      connectable: true,
      draggable: true,
      selectable: true,
    }

    const newEdge = {
      id: generateWhiteBoardEdgeId(),
      type: EN_CONSTANTS.EN_WHITE_BOARD_EDGE_TYPE_BASE,
      source: parentNode.id,
      target: newNodeId,
      sourceHandle: 'right',
      targetHandle: 'left',
      data: {
        label: '',
        edgeType: 'bezier',
        width: 2,
        style: 'solid',
        color: edgeColor,
        markerEnd: 'arrow',
        markerStart: undefined,
      },
    }

    return {
      nodes: [...nodes, newNode],
      edges: [...edges, newEdge],
      newNode,
    }
  },

  // 修改方法签名
  calculateNewNodePosition(parentNode: any, siblings: any[], nodes: any[]): NodePositionResult {
    const horizontalSpacing = 150
    const verticalSpacing = 20
    const parentRightEdge = parentNode.position.x + (parentNode.dimensions?.width || this.getDefaultDimensions().width)

    // 计算新节点的基础位置
    const basePosition = {
      x: parentRightEdge + horizontalSpacing,
      y: parentNode.position.y,
    }

    if (siblings.length === 0) {
      return {
        newPosition: basePosition,
        siblingPositions: new Map(),
      }
    }

    // 预先计算所有节点（包括新节点）的高度和位置
    const siblingHeights = siblings.map((sibling) => this.calculateNodeHeight(sibling, nodes))
    const newNodeHeight = this.getDefaultDimensions().height
    const allHeights = [...siblingHeights, newNodeHeight]

    // 计算总高度（包括间距）
    const totalHeight = allHeights.reduce((sum, height) => sum + height, 0)
      + (allHeights.length - 1) * verticalSpacing

    // 计算起始Y坐标，使整体垂直居中
    const startY = parentNode.position.y - totalHeight / 2
      + (parentNode.dimensions?.height || this.getDefaultDimensions().height) / 2

    // 更新所有节点位置
    const updatedPositions = new Map()
    let currentY = startY

    // 更新现有兄弟节点位置
    siblings.forEach((sibling, index) => {
      const height = siblingHeights[index]
      updatedPositions.set(sibling.id, {
        x: basePosition.x,
        y: currentY + height / 2,
      })
      currentY += height + verticalSpacing
    })

    // 计算新节点的最终位置
    const newPosition = {
      x: basePosition.x,
      y: currentY + newNodeHeight / 2,
    }

    return {
      newPosition,
      siblingPositions: updatedPositions,
    }
  },
}

// 添加新的缓存管理器
const layoutCache = {
  nodeHeights: new Map(),
  nodePositions: new Map(),
  pendingUpdates: new Set(),
  batchTimeout: null,

  clear() {
    this.nodeHeights.clear()
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
      const positions = calculateNodePositionsOptimized(
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

// 优化后的节点深度计算函数
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
  const childNodes = nodes.filter((n) => n.data?.parentId === node.id)

  if (childNodes.length === 0) {
    layoutCache.nodeHeights.set(node.id, nodeHeight)
    return nodeHeight
  }

  const childrenHeights = childNodes.map((child) => calculateNodeHeightOptimized(child, nodes))
  const verticalSpacing = 20
  const totalChildrenHeight = childrenHeights.reduce((sum, height, index) => {
    return sum + height + (index < childrenHeights.length - 1 ? verticalSpacing : 0)
  }, 0)

  const result = Math.max(nodeHeight, totalChildrenHeight)
  layoutCache.nodeHeights.set(node.id, result)
  return result
}

// 优化后的位置计算函数
const calculateNodePositionsOptimized = (node, nodes, parentX = 0, startY = 0) => {
  const positions = new Map()
  const horizontalSpacing = 150
  const verticalSpacing = 20

  const childNodes = nodes.filter((n) => n.data?.parentId === node.id)
  if (childNodes.length === 0) return positions

  // 使用缓存的高度计算
  const childrenHeights = childNodes.map((child) => calculateNodeHeightOptimized(child, nodes))
  const totalHeight = childrenHeights.reduce((sum, height, index) => {
    return sum + height + (index < childrenHeights.length - 1 ? verticalSpacing : 0)
  }, 0)

  const nodeWidth = node.dimensions?.width || layoutUtils.getDefaultDimensions().width
  const childX = parentX + nodeWidth + horizontalSpacing
  let currentY = startY - (totalHeight / 2) + (node.dimensions?.height || 0) / 2

  childNodes.forEach((child, index) => {
    const childHeight = childrenHeights[index]
    const childY = currentY + (childHeight - (child.dimensions?.height || 0)) / 2

    positions.set(child.id, {
      x: childX,
      y: childY,
    })
    currentY += childHeight + verticalSpacing

    // 递归计算子节点位置
    const childPositions = calculateNodePositionsOptimized(child, nodes, childX, childY)
    childPositions.forEach((pos, id) => positions.set(id, pos))
  })

  return positions
}

// 优化后的布局更新函数
const updateNodeLayout = (nodeId) => {
  layoutCache.pendingUpdates.add(nodeId)
  layoutCache.scheduleBatchUpdate()
}

// 优化后的递归布局函数
const updateMindmapLayoutRecursively = (nodeId) => {
  const nodes = getNodes.value
  const node = nodes.find((n) => n.id === nodeId)
  if (!node || !node.position) return

  // 清除旧的缓存
  layoutCache.clear()

  // 收集需要更新的所有节点
  const nodesToUpdate = new Set()
  const collectNodes = (currentNode) => {
    if (!currentNode) return
    if (currentNode.data?.mindmap) {
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

// 优化后的handleAddChildNode函数
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
    const currentEdges = edges.value || []

    // 2. 计算最终位置
    const {
      newPosition,
      siblingPositions,
    } = layoutUtils.calculateNewNodePosition(
      parentNode,
      siblings,
      nodes,
    )

    // 3. 确定边的颜色
    const parentEdge = currentEdges.find((edge) => edge.target === props.nodeId)
    let edgeColor = presetColors[0]
    if (parentEdge?.data?.color) {
      edgeColor = parentEdge.data.color
    } else if (siblings.length > 0) {
      const sourceEdges = currentEdges.filter((edge) => edge.source === props.nodeId)
        .sort((a, b) => {
          const nodeA = nodes.find((node) => node.id === a.target)
          const nodeB = nodes.find((node) => node.id === b.target)
          return (nodeB?.position.y || 0) - (nodeA?.position.y || 0)
        })
      if (sourceEdges[0]?.data?.color) {
        const lastColorIndex = presetColors.findIndex((color) => color === sourceEdges[0].data.color)
        if (lastColorIndex !== -1) {
          edgeColor = presetColors[(lastColorIndex + 1) % presetColors.length]
        }
      }
    }

    // 4. 创建新节点（使用计算好的最终位置）
    const {
      nodes: updatedNodes,
      edges: updatedEdges,
      newNode,
    } =
      await layoutUtils.batchCreateNodeWithEdge(
        parentNode,
        nodes,
        currentEdges,
        {
          blockId,
          position: newPosition,
          edgeColor,
        },
      )

    // 5. 更新所有节点位置
    const finalNodes = updatedNodes.map((node) => {
      const newPos = siblingPositions.get(node.id)
      return newPos
        ? {
            ...node,
            position: newPos,
          }
        : node
    })

    // 6. 批量更新状态
    await nextTick()
    setNodes(finalNodes)
    setEdges(updatedEdges)

    // 7. 同步更新配置
    if (props.whiteBoardConfigData) {
      props.whiteBoardConfigData.boardOptions.nodes = finalNodes
      props.whiteBoardConfigData.boardOptions.edges = updatedEdges
    }

    // 8. 等待节点渲染完成后更新布局
    await waitForNodeDimensions([newNode])
    await updateMindmapLayoutRecursively(props.nodeId)
  } catch (error) {
    console.error('Error creating new node:', error)
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

// 添加思维导图相关的计算属性
const nodeType = computed(() => props.nodeData?.nodeType || 'protyle')
const isTextNode = computed(() => nodeType.value === 'text')
const isGingkoNode = computed(() => nodeType.value === 'gingko')

// 根据节点类型更新样式
const nodeTypeClass = computed(() => ({
  'is-text': isTextNode.value,
  'is-gingko': isGingkoNode.value,
}))

// 修改toggleMindmap函数
const toggleMindmap = () => {
  emit('toggleMindmap')
}

// 监听节点变化，处理删除等操作
watch(() => getNodes.value, (newNodes, oldNodes) => {
  if (!oldNodes) return

  // 检查是否有节点被删除
  const deletedNodes = oldNodes.filter((oldNode) =>
    !newNodes.some((newNode) => newNode.id === oldNode.id),
  )

  // 如果有节点被删除，检查是否需要更新相关思维导图布局
  if (deletedNodes.length > 0) {
    deletedNodes.forEach((deletedNode) => {
      if (deletedNode.data?.parentId) {
        const parentNode = newNodes.find((node) => node.id === deletedNode.data.parentId)
        if (parentNode?.data?.mindmap) {
          updateMindmapLayoutRecursively(parentNode.id)
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
    await updateMindmapLayoutRecursively(props.nodeId)
  }
}, { deep: true })

// 添加优化后的等待节点尺寸函数
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
</script>

<style lang="scss" scoped>
.EnWhiteBoardNodeMindmapContainer {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  border-color: var(--b3-theme-primary-light);
  background-color: var(--b3-theme-background);
  border-radius: 24px;
  border: 2px solid;
  position: relative;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    border-color: var(--b3-theme-primary);

    .add-child-button {
      opacity: 1;
      transform: translateY(-50%) scale(1);
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

    .arco-btn {
      width: 24px;
      height: 24px;
      padding: 0;
      font-size: 14px;
      background-color: var(--b3-theme-primary);
      border-color: var(--b3-theme-primary);
      color: var(--b3-theme-on-primary);
      box-shadow: 0 2px 6px rgba(var(--primary-6), 0.4);
      transition: all 0.3s ease;

      &:hover {
        background-color: var(--b3-theme-primary-hover);
        border-color: var(--b3-theme-primary-hover);
        transform: scale(1.1);
      }
    }
  }

  .ProtyleToolbarArea {
    width: 100%;
    height: 36px;
    flex-shrink: 0;
    background-color: transparent;
    display: flex;
    align-items: center;
    justify-content: space-between;
    box-sizing: border-box;
    padding: 8px 12px;
    border-bottom: 1px solid var(--b3-border-color);

    .infos {
      flex: 1;
      overflow: hidden;
      margin-right: var(--en-gap);

      .block-title {
        font-size: 14px;
        color: var(--b3-theme-on-background);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        display: block;
        font-weight: 500;
      }
    }

    .operations {
      flex-shrink: 0;

      .active {
        color: var(--b3-theme-primary);
        background: var(--b3-theme-primary-light);
      }
    }
  }

  .main {
    flex: 1;
    position: relative;
    overflow: hidden;
    padding: 12px;
  }

  .Handle {
    width: 21px;
    height: 21px;
    z-index: 1;
    opacity: 0;
    border: 2px solid var(--b3-theme-primary-light);
    background-color: var(--b3-theme-background);
    color: var(--b3-theme-primary-light);
    transition: all 0.3s ease;
    cursor: pointer;

    &:hover {
      opacity: 1;
      background-color: var(--b3-theme-primary-light);
      color: var(--b3-theme-on-primary);
      transform: scale(1.1);
    }

    .HandleIcon {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      pointer-events: none;
    }

    &.left {
      left: -16px;
    }
    &.right {
      right: -16px;
    }
  }

  &.is-collapsed {
    height: 36px !important;
    min-height: 36px !important;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    .main {
      display: none;
    }

    .ProtyleToolbarArea {
      border-bottom: none;
      border-radius: var(--b3-border-radius);
      height: 100%;
    }

    .Handle {
      display: none;
    }
  }

  &.is-text {
    border: none;
    background-color: transparent;
    box-shadow: none;
  }

  &.is-gingko {
    border-color: var(--b3-theme-success);
    background-color: var(--b3-theme-background-light);
  }

  // 添加节点过渡动画
  &.mindmap-node-transition {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
}
</style>
