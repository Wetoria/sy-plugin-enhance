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
        }
      }
      return node
    })
    return updatedNodes
  },
}

// 优化后的布局更新函数
const updateNodeLayout = async (nodeId) => {
  const nodes = getNodes.value
  const node = nodes.find((n) => n.id === nodeId)
  if (!node || !node.position) return

  layoutUtils.clearCache()
  const positions = layoutUtils.calculateNodePositions(
    node,
    nodes,
    node.position.x,
    node.position.y,
  )

  if (positions.size > 0) {
    const updatedNodes = await layoutUtils.batchUpdateNodePositions(positions, nodes)
    setNodes(updatedNodes)
  }
}

// 使用防抖优化布局更新
const debouncedUpdateLayout = debounce(updateNodeLayout, 100)

// 优化递归布局函数
const updateMindmapLayoutRecursively = async (nodeId) => {
  const nodes = getNodes.value
  const node = nodes.find((n) => n.id === nodeId)
  if (!node || !node.position) return

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

  // 按层级顺序更新布局
  const updatePromises = Array.from(nodesToUpdate).map((id) => debouncedUpdateLayout(id))
  await Promise.all(updatePromises)
}

// 添加防抖函数
function debounce(fn, delay) {
  let timer = null
  return function (...args) {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      fn.apply(this, args)
    }, delay)
  }
}

// 修改handleAddChildNode 函数
const handleAddChildNode = async () => {
  // 1. 先计算新节点的位置
  const nodes = getNodes.value || [] // 添加默认空数组
  const parentNode = nodes.find((node) => node.id === props.nodeId)
  if (!parentNode || !parentNode.position) {
    console.warn('Parent node not found or invalid')
    return
  }

  const siblings = nodes.filter((node) => node.data?.parentId === props.nodeId)
  const horizontalSpacing = 150 // 使用与updateNodeLayout相同的间距

  // 获取父节点的右边界
  const parentRightEdge = parentNode.position.x + (parentNode.dimensions?.width || moduleWhiteBoardOptions.value.cardWidthDefault)

  // 计算新节点的位置
  const newNodePosition = {
    x: parentRightEdge + horizontalSpacing,
    y: parentNode.position.y,
  }

  // 2. 预先计算布局
  if (siblings.length > 0) {
    try {
      // 计算所有现有子节点(包括它们的子树)的总高度
      const siblingHeights = await Promise.all(siblings.map(async (sibling) => {
        return layoutUtils.calculateNodeHeight(sibling, nodes)
      }))

      const totalSiblingHeight = siblingHeights.reduce((sum, height, index) => {
        return sum + height + (index < siblingHeights.length - 1 ? 20 : 0)
      }, 0)

      // 计算新的总高度(包括新节点的默认高度)
      const newNodeHeight = layoutUtils.getDefaultDimensions().height
      const newTotalHeight = totalSiblingHeight + newNodeHeight + 20 // 加上新节点高度和间距

      // 计算所有节点的新位置
      const startY = parentNode.position.y - (newTotalHeight / 2) + (parentNode.dimensions?.height || 0) / 2

      // 先更新现有节点的位置
      let currentY = startY
      const updatedNodes = nodes.map((node) => {
        if (node.data?.parentId === props.nodeId) {
          const nodeHeight = layoutUtils.calculateNodeHeight(node, nodes)
          const newY = currentY + (nodeHeight - (node.dimensions?.height || 0)) / 2
          currentY += nodeHeight + 20 // 加上垂直间距

          return {
            ...node,
            position: {
              x: node.position.x,
              y: newY,
            },
          }
        }
        return node
      })

      if (Array.isArray(updatedNodes)) {
        setNodes(updatedNodes)
      }

      // 计算新节点的Y坐标
      newNodePosition.y = currentY + (newNodeHeight / 2)
    } catch (error) {
      console.error('Error updating sibling positions:', error)
    }
  }

  // 3. 创建新节点
  try {
    const blockId = await getNewDailyNoteBlockId()
    const newNodeId = generateWhiteBoardNodeId()

    const newNode = {
      id: newNodeId,
      type: EN_CONSTANTS.EN_WHITE_BOARD_NODE_TYPE_PROTYLE,
      data: {
        blockId,
        parentId: props.nodeId,
        mindmap: true,
      },
      position: newNodePosition,
      width: layoutUtils.getDefaultDimensions().width,
      height: layoutUtils.getDefaultDimensions().height,
      connectable: true,
      draggable: true,
      selectable: true,
    }

    // 4. 添加新节点
    const currentNodes = getNodes.value || []
    const updatedNodes = Array.isArray(currentNodes) ? [...currentNodes, newNode] : [newNode]
    setNodes(updatedNodes)

    // 5. 创建连接线
    const currentEdges = edges.value || []

    // 获取父节点的连线颜色
    let edgeColor = presetColors[0] // 默认使用第一个颜色
    const parentEdge = currentEdges.find((edge) => edge.target === props.nodeId)
    if (parentEdge?.data?.color) {
      // 如果父节点有连线，继承其颜色
      edgeColor = parentEdge.data.color
    } else if (siblings.length > 0) {
      // 只有在第一层（没有父节点连线）时才使用循环颜色
      const sourceEdges = currentEdges.filter((edge) => edge.source === props.nodeId)
      const sortedEdges = sourceEdges.sort((a, b) => {
        const nodeA = nodes.find((node) => node.id === a.target)
        const nodeB = nodes.find((node) => node.id === b.target)
        return (nodeB?.position.y || 0) - (nodeA?.position.y || 0)
      })

      if (sortedEdges.length > 0) {
        const lastEdge = sortedEdges[0]
        const lastColorIndex = presetColors.findIndex((color) => color === lastEdge.data?.color)
        if (lastColorIndex !== -1) {
          edgeColor = presetColors[(lastColorIndex + 1) % presetColors.length]
        }
      }
    }

    const newEdge = {
      id: generateWhiteBoardEdgeId(),
      type: EN_CONSTANTS.EN_WHITE_BOARD_EDGE_TYPE_BASE,
      source: props.nodeId,
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

    const updatedEdges = Array.isArray(currentEdges) ? [...currentEdges, newEdge] : [newEdge]
    setEdges(updatedEdges)

    // 6. 同步更新配置数据
    if (props.whiteBoardConfigData) {
      props.whiteBoardConfigData.boardOptions.nodes = updatedNodes
      props.whiteBoardConfigData.boardOptions.edges = updatedEdges
    }

    // 7. 等待节点渲染完成
    await waitForNodeDimensions([newNode])
    await new Promise((resolve) => requestAnimationFrame(resolve))

    // 8. 更新布局
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
}
</style>
