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

// 优化高度计算函数，添加缓存
const heightCache = new Map()
const calculateSubtreeHeight = (node, nodes) => {
  // 检查缓存
  const cacheKey = `${node.id}-${node.dimensions?.height}`
  if (heightCache.has(cacheKey)) {
    return heightCache.get(cacheKey)
  }

  const nodeHeight = node.dimensions?.height || moduleWhiteBoardOptions.value.cardHeightDefault
  const childNodes = nodes.filter((n) => n.data?.parentId === node.id)

  if (childNodes.length === 0) {
    heightCache.set(cacheKey, nodeHeight)
    return nodeHeight
  }

  // 递归计算每个子节点的子树高度
  const childrenHeights = childNodes.map((child) => calculateSubtreeHeight(child, nodes))

  // 计算子树的总高度(包含固定间距)
  const verticalSpacing = 20 // 减小垂直间距使布局更紧凑
  const totalChildrenHeight = childrenHeights.reduce((sum, height, index) => {
    return sum + height + (index < childrenHeights.length - 1 ? verticalSpacing : 0)
  }, 0)

  const result = Math.max(nodeHeight, totalChildrenHeight)
  heightCache.set(cacheKey, result)
  return result
}

// 优化布局函数
const updateNodeLayout = async (node, level = 0) => {
  const nodes = getNodes.value
  const childNodes = nodes.filter((n) => n.data?.parentId === node.id)
  if (childNodes.length === 0) return

  // 清除高度缓存
  heightCache.clear()

  // 批量计算所有子节点的高度
  const childrenHeights = childNodes.map((child) => calculateSubtreeHeight(child, nodes))
  const horizontalSpacing = 150
  const verticalSpacing = 20

  // 计算总高度
  const totalHeight = childrenHeights.reduce((sum, height, index) => {
    return sum + height + (index < childrenHeights.length - 1 ? verticalSpacing : 0)
  }, 0)

  // 获取父节点的右边界
  const parentRightEdge = node.position.x + (node.dimensions?.width || moduleWhiteBoardOptions.value.cardWidthDefault)
  const childX = parentRightEdge + horizontalSpacing

  // 计算所有子节点的新位置
  let currentY = node.position.y - (totalHeight / 2) + (node.dimensions?.height || 0) / 2
  const nodeUpdates = []

  // 收集所有需要更新的节点位置
  for (let i = 0; i < childNodes.length; i++) {
    const child = childNodes[i]
    const childHeight = childrenHeights[i]
    const childY = currentY + (childHeight - (child.dimensions?.height || 0)) / 2

    nodeUpdates.push({
      id: child.id,
      position: {
        x: childX,
        y: childY,
      },
    })

    currentY += childHeight + verticalSpacing
  }

  // 批量更新节点位置
  if (nodeUpdates.length > 0) {
    const updatedNodes = nodes.map((node) => {
      const update = nodeUpdates.find((u) => u.id === node.id)
      if (update) {
        return {
          ...node,
          position: update.position,
        }
      }
      return node
    })
    setNodes(updatedNodes)
  }

  // 并行更新所有子节点的布局
  await Promise.all(childNodes.map((child) => updateNodeLayout(child, level + 1)))
}

// 优化递归布局函数
const updateMindmapLayoutRecursively = async (nodeId) => {
  const nodes = getNodes.value
  const node = nodes.find((n) => n.id === nodeId)
  if (!node) return

  // 收集需要更新的所有节点ID
  const nodesToUpdate = []
  const collectNodes = (currentNode) => {
    if (currentNode.data?.parentId) {
      const parentNode = nodes.find((n) => n.id === currentNode.data.parentId)
      if (parentNode) {
        collectNodes(parentNode)
      }
    }
    if (currentNode.data?.mindmap) {
      nodesToUpdate.push(currentNode.id)
    }
  }
  collectNodes(node)

  // 从根节点开始，逐层更新布局
  for (const id of nodesToUpdate) {
    const currentNode = nodes.find((n) => n.id === id)
    if (currentNode) {
      await updateNodeLayout(currentNode)
    }
  }
}

// 优化等待节点尺寸函数
const waitForNodeDimensions = (nodes, maxAttempts = 3) => {
  return new Promise((resolve) => {
    let attempts = 0
    const check = () => {
      attempts++
      const allReady = nodes.every(isNodeDimensionsReady)
      if (allReady || attempts >= maxAttempts) {
        resolve(allReady)
      } else {
        requestAnimationFrame(check) // 使用requestAnimationFrame替代setTimeout
      }
    }
    check()
  })
}

// 修改 handleAddChildNode 函数
const handleAddChildNode = async () => {
  // 1. 先计算新节点的位置
  const nodes = getNodes.value
  const siblings = nodes.filter((node) => node.data?.parentId === props.nodeId)
  const horizontalSpacing = 150 // 使用与updateNodeLayout相同的间距

  // 获取父节点的右边界
  const parentNode = nodes.find((node) => node.id === props.nodeId)
  const parentRightEdge = parentNode.position.x + (parentNode.dimensions?.width || moduleWhiteBoardOptions.value.cardWidthDefault)

  // 计算新节点的位置
  const newNodePosition = {
    x: parentRightEdge + horizontalSpacing,
    y: parentNode.position.y,
  }

  // 2. 预先计算布局
  if (siblings.length > 0) {
    // 计算所有现有子节点(包括它们的子树)的总高度
    const siblingHeights = await Promise.all(siblings.map(async (sibling) => {
      return calculateSubtreeHeight(sibling, nodes)
    }))

    const totalSiblingHeight = siblingHeights.reduce((sum, height, index) => {
      return sum + height + (index < siblingHeights.length - 1 ? 20 : 0)
    }, 0)

    // 计算新的总高度(包括新节点的默认高度)
    const newNodeHeight = moduleWhiteBoardOptions.value.cardHeightDefault
    const newTotalHeight = totalSiblingHeight + newNodeHeight + 20 // 加上新节点高度和间距

    // 计算所有节点的新位置
    const startY = parentNode.position.y - (newTotalHeight / 2) + (parentNode.dimensions?.height || 0) / 2

    // 先更新现有节点的位置
    let currentY = startY
    const updatedNodes = nodes.map((node) => {
      if (node.data?.parentId === props.nodeId) {
        const nodeHeight = calculateSubtreeHeight(node, nodes)
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
    setNodes(updatedNodes)

    // 计算新节点的Y坐标
    newNodePosition.y = currentY + (newNodeHeight / 2)
  }

  // 3. 创建新节点
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
    width: moduleWhiteBoardOptions.value.cardWidthDefault,
    height: moduleWhiteBoardOptions.value.cardHeightDefault,
    connectable: true,
    draggable: true,
    selectable: true,
  }

  // 4. 添加新节点
  const updatedNodes = [...getNodes.value, newNode]
  setNodes(updatedNodes)

  // 5. 创建连接线
  let edgeColor = presetColors[0] // 默认使用第一个颜色
  if (siblings.length > 0) {
    const currentEdges = edges.value.filter((edge) => edge.source === props.nodeId)
    const sortedEdges = currentEdges.sort((a, b) => {
      const nodeA = getNodes.value.find((node) => node.id === a.target)
      const nodeB = getNodes.value.find((node) => node.id === b.target)
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

  const currentEdges = edges.value || []
  const updatedEdges = [...currentEdges, newEdge]
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

// 添加watch监听子节点数量和父节点变化
watch([
  () => getChildNodes().length,
  () => props.nodeData?.parentId,
], () => {
  updateNodeLayout(props.nodeId)
})

// 添加getChildNodes函数
const getChildNodes = () => {
  const nodes = getNodes.value || []
  return nodes.filter((node) => node.data?.parentId === props.nodeId)
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
</script>

<style lang="scss" scoped>
.EnWhiteBoardNodeMindmapContainer {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  border-color: var(--b3-theme-primary-light);
  background-color: var(--b3-theme-background-light);
  border-radius: var(--en-whiteboard-card-radius);
  border: 2px solid;
  position: relative;

  .add-child-button {
    position: absolute;
    right: -16px;
    top: 50%;
    transform: translateY(-50%);
    z-index: 10;
    opacity: 0;
    transition: opacity 0.2s ease;

    .arco-btn {
      width: 24px;
      height: 24px;
      padding: 0;
      font-size: 14px;
      background-color: var(--b3-theme-primary);
      border-color: var(--b3-theme-primary);
      color: var(--b3-theme-on-primary);

      &:hover {
        background-color: var(--b3-theme-primary-hover);
        border-color: var(--b3-theme-primary-hover);
      }
    }
  }

  &:hover .add-child-button {
    opacity: 1;
  }

  .ProtyleToolbarArea {
    width: 100%;
    height: 30px;
    flex-shrink: 0;
    background-color: color-mix(in srgb, var(--b3-theme-surface) 65%, transparent);
    display: flex;
    align-items: center;
    justify-content: space-between;
    box-sizing: border-box;
    padding: var(--en-gap);

    .infos {
      flex: 1;
      overflow: hidden;
      margin-right: var(--en-gap);

      .block-title {
        font-size: 12px;
        color: var(--b3-theme-on-surface);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        display: block;
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
  }

  .Handle {
    width: 21px;
    height: 21px;
    z-index: -1;
    opacity: 0;
    border-color: var(--b3-theme-primary-light);
    background-color: var(--b3-theme-background);
    color: var(--b3-theme-primary-light);
    position: absolute;

    &:hover {
      background-color: var(--b3-border-color);
      opacity: 1;
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
    height: 30px !important;
    min-height: 30px !important;
    transition: height 0.3s ease-in-out;

    .main {
      display: none;
    }

    .ProtyleToolbarArea {
      border-bottom: none;
      border-radius: var(--b3-border-radius);
      background-color: var(--b3-theme-surface);
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
