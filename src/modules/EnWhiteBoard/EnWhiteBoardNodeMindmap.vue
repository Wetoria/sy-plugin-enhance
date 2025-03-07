<template>
  <div
    class="EnWhiteBoardNodeMindmapContainer"
    :class="{
      'is-collapsed': isCollapsed,
      ...nodeTypeClass,
    }"
  >
    <!-- 思维导图模式下的添加子节点按钮和折叠按钮 -->
    <div 
      v-if="!hasParent || parentEdgeHandle === 'left'"
      class="button-group left"
    >
      <div
        v-if="hasLeftChildren"
        class="fold-children-button"
        @click.stop="toggleFoldSubtree('left')"
      >
        <a-button
          size="mini"
          shape="circle"
        >
          <template #icon>
            <icon-minus v-if="!isLeftFolded" />
            <icon-plus v-else />
          </template>
        </a-button>
      </div>
      <div 
        class="add-child-button"
        @click.stop="handleAddChildNode('left')"
      >
        <a-button
          size="mini"
          type="primary"
          shape="circle"
        >
          <template #icon>
            <icon-plus />
          </template>
        </a-button>
      </div>
    </div>

    <div 
      v-if="!hasParent || parentEdgeHandle === 'right'"
      class="button-group right"
    >
      <div 
        class="add-child-button"
        @click.stop="handleAddChildNode('right')"
      >
        <a-button
          size="mini"
          type="primary"
          shape="circle"
        >
          <template #icon>
            <icon-plus />
          </template>
        </a-button>
      </div>
      <div
        v-if="hasRightChildren"
        class="fold-children-button"
        @click.stop="toggleFoldSubtree('right')"
      >
        <a-button
          size="mini"
          shape="circle"
        >
          <template #icon>
            <icon-minus v-if="!isRightFolded" />
            <icon-plus v-else />
          </template>
        </a-button>
      </div>
    </div>

    <div class="main">
      <slot></slot>
    </div>

    <!-- 思维导图节点的连接点 -->
    <Handle
      id="right"
      class="Handle right"
      :type="parentEdgeHandle === 'left' ? 'target' : 'source'"
      :position="Position.Right"
    >
      <div class="HandleIcon">
        <IconArrowRight />
      </div>
    </Handle>
    <Handle
      id="left"
      class="Handle left"
      :type="parentEdgeHandle === 'right' ? 'target' : 'source'"
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
  IconMinus,
  IconPlus,
} from '@arco-design/web-vue/es/icon'
import {
  Handle,
  Position,
  useVueFlow,
} from '@vue-flow/core'
import {
  computed,
  nextTick,
  ref,
  watch,
} from 'vue'

const props = defineProps<{
  nodeId: string
  isCollapsed: boolean
  displayText: string
  isMergingToSuperBlock: boolean
  nodeData: { nodeType: string, parentId?: string, mindmap?: boolean, folded?: boolean } // 更新类型，增加folded属性
  whiteBoardConfigData?: any
}>()

// 添加emit定义
const emit = defineEmits<{
  toggleMindmap: []
  showError: [message: string]
  updateNodeData: [nodeId: string, data: any] // 添加更新节点数据的emit
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

// 添加getChildNodes函数
const getChildNodes = () => {
  const nodes = getNodes.value || []
  return nodes.filter((node) => node.data?.parentId === props.nodeId)
}

// 预设颜色数组
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

// 添加缓存管理器
const layoutCache = {
  nodeHeights: new Map(),
  nodePositions: new Map(),
  pendingUpdates: new Set(),
  batchTimeout: null,
  isProcessing: false,

  clear() {
    this.nodeHeights.clear()
    this.nodePositions.clear()
    this.pendingUpdates.clear()
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout)
      this.batchTimeout = null
    }
    this.isProcessing = false
  },

  // 优化批量处理调度
  scheduleBatchUpdate() {
    if (this.batchTimeout || this.isProcessing) return

    this.batchTimeout = setTimeout(() => {
      requestAnimationFrame(() => {
        this.processBatchUpdate()
      })
    }, 32)
  },

  async processBatchUpdate() {
    if (this.pendingUpdates.size === 0 || this.isProcessing) return

    this.isProcessing = true
    const nodes = getNodes.value
    const updatedNodes = new Map()

    try {
      // 只处理思维导图节点，且过滤掉隐藏节点
      const mindmapNodes = nodes.filter(n => n.data?.mindmap && !n.hidden)
      const sortedNodes = Array.from(this.pendingUpdates)
        .map(id => mindmapNodes.find(n => n.id === id))
        .filter(Boolean)
        .sort((a, b) => getNodeDepth(a, mindmapNodes) - getNodeDepth(b, mindmapNodes))

      // 首先处理折叠状态节点
      const foldedNodes = sortedNodes.filter(node => node.data?.folded)
      for (const node of foldedNodes) {
        // 直接处理折叠节点，确保它们优先布局
        const positions = calculateNodePositionsOptimized(node, mindmapNodes, node.position.x, node.position.y)
        positions.forEach((pos, id) => updatedNodes.set(id, pos))
      }
      
      // 然后处理其余节点
      const normalNodes = sortedNodes.filter(node => !node.data?.folded)
      for (const node of normalNodes) {
        const positions = calculateNodePositionsOptimized(node, mindmapNodes, node.position.x, node.position.y)
        positions.forEach((pos, id) => updatedNodes.set(id, pos))
      }

      if (updatedNodes.size > 0) {
        const finalNodes = nodes.map(node => {
          const newPos = updatedNodes.get(node.id)
          if (!newPos || !node.data?.mindmap) return node
          return {
            ...node,
            position: newPos,
            class: 'mindmap-node-transition',
          }
        })
        setNodes(finalNodes)
      }
    } finally {
      this.pendingUpdates.clear()
      this.batchTimeout = null
      this.isProcessing = false
    }
  },
}

// 获取节点默认尺寸
const getDefaultDimensions = () => {
  return {
    width: moduleWhiteBoardOptions.value.cardWidthDefault,
    height: moduleWhiteBoardOptions.value.cardHeightDefault,
  }
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
  // 如果不是思维导图节点，直接返回节点高度
  if (!node.data?.mindmap) {
    return node.dimensions?.height || getDefaultDimensions().height
  }

  if (layoutCache.nodeHeights.has(node.id)) {
    return layoutCache.nodeHeights.get(node.id)
  }

  const nodeHeight = node.dimensions?.height || getDefaultDimensions().height
  
  // 如果节点被折叠，则不考虑子节点高度
  if (node.data?.folded) {
    layoutCache.nodeHeights.set(node.id, nodeHeight)
    return nodeHeight
  }
  
  // 只获取思维导图子节点
  const childNodes = nodes.filter((n) => n.data?.mindmap && n.data?.parentId === node.id)

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

// 修改位置计算函数
const calculateNodePositionsOptimized = (node, nodes, parentX = 0, startY = 0) => {
  if (!node.data?.mindmap) return new Map()

  const positions = new Map()
  const horizontalSpacing = 150
  const verticalSpacing = 20

  if (node.data?.folded) return positions
  
  // 获取所有可见的子节点
  const childNodes = nodes.filter((n) => 
    n.data?.mindmap && 
    n.data?.parentId === node.id && 
    !n.hidden
  )
  
  if (childNodes.length === 0) return positions

  const nodeWidth = node.dimensions?.width || getDefaultDimensions().width

  // 分离左右两侧的子节点
  const leftNodes = childNodes.filter(child => {
    const edge = edges.value.find(e => e.target === child.id)
    return edge?.sourceHandle === 'left'
  })

  const rightNodes = childNodes.filter(child => {
    const edge = edges.value.find(e => e.target === child.id)
    return edge?.sourceHandle === 'right'
  })

  // 计算左侧节点位置
  if (leftNodes.length > 0) {
    const leftHeights = leftNodes.map(child => calculateNodeHeightOptimized(child, nodes))
    const leftTotalHeight = leftHeights.reduce((sum, height, index) => 
      sum + height + (index < leftHeights.length - 1 ? verticalSpacing : 0), 0
    )
    
    let currentY = startY - (leftTotalHeight / 2) + (node.dimensions?.height || 0) / 2
    const leftX = parentX - horizontalSpacing

    leftNodes.forEach((child, index) => {
      const childHeight = leftHeights[index]
      const childWidth = child.dimensions?.width || getDefaultDimensions().width
      
      positions.set(child.id, {
        x: leftX - childWidth,
        y: currentY + (childHeight - (child.dimensions?.height || 0)) / 2,
      })
      
      currentY += childHeight + verticalSpacing

      // 递归计算子节点位置
      const childPositions = calculateNodePositionsOptimized(
        child,
        nodes,
        leftX - childWidth,
        positions.get(child.id).y
      )
      childPositions.forEach((pos, id) => positions.set(id, pos))
    })
  }

  // 计算右侧节点位置
  if (rightNodes.length > 0) {
    const rightHeights = rightNodes.map(child => calculateNodeHeightOptimized(child, nodes))
    const rightTotalHeight = rightHeights.reduce((sum, height, index) => 
      sum + height + (index < rightHeights.length - 1 ? verticalSpacing : 0), 0
    )
    
    let currentY = startY - (rightTotalHeight / 2) + (node.dimensions?.height || 0) / 2
    const rightX = parentX + nodeWidth + horizontalSpacing

    rightNodes.forEach((child, index) => {
      const childHeight = rightHeights[index]
      
      positions.set(child.id, {
        x: rightX,
        y: currentY + (childHeight - (child.dimensions?.height || 0)) / 2,
      })
      
      currentY += childHeight + verticalSpacing

      // 递归计算子节点位置
      const childPositions = calculateNodePositionsOptimized(
        child,
        nodes,
        rightX,
        positions.get(child.id).y
      )
      childPositions.forEach((pos, id) => positions.set(id, pos))
    })
  }

  return positions
}

// 优化后的布局更新函数
const updateNodeLayout = (nodeId) => {
  layoutCache.pendingUpdates.add(nodeId)
  layoutCache.scheduleBatchUpdate()
}

// 优化后的递归布局函数
const updateMindmapLayoutRecursively = (nodeId) => {
  // 如果当前组件未挂载或已销毁，不执行更新
  if (!props.nodeData?.mindmap) return

  const nodes = getNodes.value
  const node = nodes.find((n) => n.id === nodeId)
  if (!node || !node.position) return

  // 清除旧的缓存
  layoutCache.clear()

  // 只收集思维导图相关的节点
  const nodesToUpdate = new Set()
  const collectNodes = (currentNode) => {
    if (!currentNode) return
    // 只处理思维导图节点
    if (currentNode.data?.mindmap) {
      // 获取当前节点的所有可见子节点（跳过隐藏节点或折叠节点的子节点）
      const childNodes = nodes.filter((n) => {
        return n.data?.mindmap && 
               n.data?.parentId === currentNode.id && 
               !n.hidden // 跳过隐藏节点
      })
      
      // 只有当节点有可见子节点时才添加到更新列表
      if (childNodes.length > 0 || currentNode.data?.folded) {
        nodesToUpdate.add(currentNode.id)
      }
    }
    
    // 向上递归处理父节点
    if (currentNode.data?.parentId) {
      const parentNode = nodes.find((n) => n.id === currentNode.data.parentId)
      if (parentNode?.data?.mindmap) {
        collectNodes(parentNode)
      }
    }
  }
  collectNodes(node)

  // 如果没有需要更新的节点，直接返回
  if (nodesToUpdate.size === 0) return

  // 将需要更新的节点添加到待更新队列
  nodesToUpdate.forEach((id) => layoutCache.pendingUpdates.add(id))
  layoutCache.scheduleBatchUpdate()
  
  // 确保边也被正确处理
  updateEdgesVisibility()
}

// 添加边可见性更新函数
const updateEdgesVisibility = () => {
  const nodes = getNodes.value
  const allEdges = edges.value || []
  
  // 查找所有隐藏的节点
  const hiddenNodeIds = new Set()
  nodes.forEach(node => {
    if (node.hidden) {
      hiddenNodeIds.add(node.id)
    }
  })
  
  // 更新边的可见性
  const updatedEdges = allEdges.map(edge => {
    const isSourceHidden = hiddenNodeIds.has(edge.source)
    const isTargetHidden = hiddenNodeIds.has(edge.target)
    
    if (isSourceHidden || isTargetHidden) {
      return {
        ...edge, 
        hidden: true,
        class: 'mindmap-edge-fold-transition'
      }
    }
    
    return {
      ...edge,
      hidden: false,
      class: 'mindmap-edge-fold-transition'
    }
  })
  
  setEdges(updatedEdges)
}

// 添加hasParent计算属性
const hasParent = computed(() => !!props.nodeData?.parentId)

// 添加parentEdgeHandle计算属性
const parentEdgeHandle = computed(() => {
  if (!hasParent.value) return null
  const edge = edges.value?.find(e => e.target === props.nodeId)
  return edge?.sourceHandle
})

// 修改计算新节点位置的函数
const calculateNewNodePosition = (parentNode, siblings, nodes, handle = 'right') => {
  const horizontalSpacing = 150
  const verticalSpacing = 20
  const parentWidth = parentNode.dimensions?.width || getDefaultDimensions().width
  
  // 根据handle决定x轴位置
  const baseX = handle === 'right' 
    ? parentNode.position.x + parentWidth + horizontalSpacing
    : parentNode.position.x - horizontalSpacing - getDefaultDimensions().width

  // 获取同侧的兄弟节点
  const sameSideSiblings = siblings.filter(sibling => {
    const edge = edges.value.find(e => e.target === sibling.id)
    return edge?.sourceHandle === handle
  })

  if (sameSideSiblings.length === 0) {
    return {
      newPosition: {
        x: baseX,
        y: parentNode.position.y,
      },
      siblingPositions: new Map(),
    }
  }

  // 预先计算所有节点的高度和位置
  const siblingHeights = sameSideSiblings.map((sibling) => calculateNodeHeightOptimized(sibling, nodes))
  const newNodeHeight = getDefaultDimensions().height
  const allHeights = [...siblingHeights, newNodeHeight]

  // 计算总高度
  const totalHeight = allHeights.reduce((sum, height) => sum + height, 0)
    + (allHeights.length - 1) * verticalSpacing

  // 计算起始Y坐标
  const startY = parentNode.position.y - totalHeight / 2
    + (parentNode.dimensions?.height || getDefaultDimensions().height) / 2

  // 更新所有节点位置
  const updatedPositions = new Map()
  let currentY = startY

  // 更新现有兄弟节点位置
  sameSideSiblings.forEach((sibling, index) => {
    const height = siblingHeights[index]
    updatedPositions.set(sibling.id, {
      x: baseX,
      y: currentY + height / 2,
    })
    currentY += height + verticalSpacing
  })

  // 计算新节点的最终位置
  const newPosition = {
    x: baseX,
    y: currentY + newNodeHeight / 2,
  }

  return {
    newPosition,
    siblingPositions: updatedPositions,
  }
}

// 修改handleAddChildNode函数
const handleAddChildNode = async (handle: string = 'right') => {
  try {
    const nodes = getNodes.value || []
    const parentNode = nodes.find((node) => node.id === props.nodeId)
    if (!parentNode?.position) {
      console.warn('Parent node not found or invalid')
      return
    }

    // 如果当前节点是折叠状态，先展开
    if (isFolded.value) {
      await toggleFoldSubtree()
    }

    // 1. 获取所需数据
    const blockId = await getNewDailyNoteBlockId()
    const siblings = nodes.filter((node) => node.data?.parentId === props.nodeId)
    const currentEdges = edges.value || []

    // 2. 计算最终位置，传入handle参数
    const {
      newPosition,
      siblingPositions,
    } = calculateNewNodePosition(
      parentNode,
      siblings,
      nodes,
      handle,
    )

    // 3. 确定边的颜色
    const parentEdge = currentEdges.find((edge) => edge.target === props.nodeId)
    const edgeColor = calculateEdgeColor(parentEdge, siblings, currentEdges)

    // 4. 创建新节点
    const newNodeId = generateWhiteBoardNodeId()
    const newNode = {
      id: newNodeId,
      type: EN_CONSTANTS.EN_WHITE_BOARD_NODE_TYPE_PROTYLE,
      data: {
        blockId,
        parentId: parentNode.id,
        mindmap: true,
        isNew: true,
        folded: false,
      },
      position: newPosition,
      width: getDefaultDimensions().width,
      height: getDefaultDimensions().height,
      connectable: true,
      draggable: true,
      selectable: true,
    }

    // 先只添加新节点
    const tempNodes = [...nodes, newNode]

    // 5. 更新所有节点位置
    const finalNodes = tempNodes.map((node) => {
      const newPos = siblingPositions.get(node.id)
      return newPos
        ? {
            ...node,
            position: newPos,
          }
        : node
    })

    // 6. 批量更新节点状态
    await nextTick()
    setNodes(finalNodes)
    
    // 7. 等待节点渲染完成
    await new Promise(resolve => setTimeout(resolve, 100))
    
    // 8. 创建并添加边
    const newEdge = {
      id: generateWhiteBoardEdgeId(),
      type: EN_CONSTANTS.EN_WHITE_BOARD_EDGE_TYPE_BASE,
      source: parentNode.id,
      target: newNodeId,
      sourceHandle: handle,
      targetHandle: handle === 'right' ? 'left' : 'right',
      data: {
        label: '',
        edgeType: 'bezier',
        width: 2,
        style: 'solid',
        color: edgeColor,
        markerEnd: 'none',
        markerStart: 'none',
      },
    }
    
    const updatedEdges = [...currentEdges, newEdge]
    setEdges(updatedEdges)

    // 9. 同步更新配置
    if (props.whiteBoardConfigData) {
      props.whiteBoardConfigData.boardOptions.nodes = finalNodes
      props.whiteBoardConfigData.boardOptions.edges = updatedEdges
    }

    // 10. 更新布局
    await waitForNodeDimensions([newNode])
    await updateMindmapLayoutRecursively(props.nodeId)
  } catch (error) {
    console.error('Error creating new node:', error)
    emit('showError', '创建新节点时发生错误，请重试。')
  }
}

// 检查节点尺寸是否已准备好
const isNodeDimensionsReady = (node) => {
  return node.dimensions?.width && node.dimensions?.height
}

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

// 优化监听器
const setupMindmapWatchers = () => {
  // 节点变化监听器
  watch(() => getNodes.value, (newNodes, oldNodes) => {
    if (!oldNodes || !props.nodeData?.mindmap) return

    // 获取当前思维导图的所有相关节点ID
    const getMindmapNodeIds = (nodes) => {
      const result = new Set()
      const traverse = (nodeId) => {
        const node = nodes.find(n => n.id === nodeId)
        if (!node?.data?.mindmap) return
        result.add(nodeId)
        
        // 如果节点已折叠，则不遍历其子节点
        if (node.data?.folded) return
        
        nodes
          .filter(n => n.data?.mindmap && n.data?.parentId === nodeId)
          .forEach(child => traverse(child.id))
      }
      traverse(props.nodeId)
      return result
    }

    const oldMindmapIds = getMindmapNodeIds(oldNodes)
    const newMindmapIds = getMindmapNodeIds(newNodes)

    // 检查当前节点是否移动了（作为根节点）
    const currentNodeOld = oldNodes.find(n => n.id === props.nodeId)
    const currentNodeNew = newNodes.find(n => n.id === props.nodeId)
    
    if (currentNodeOld && currentNodeNew && 
        JSON.stringify(currentNodeOld.position) !== JSON.stringify(currentNodeNew.position)) {
      // 计算位置偏移量
      const offsetX = currentNodeNew.position.x - currentNodeOld.position.x
      const offsetY = currentNodeNew.position.y - currentNodeOld.position.y
      
      // 检查是否是单纯的拖动（而非其他操作）
      const isDragOnly = offsetX !== 0 || offsetY !== 0
      
      if (isDragOnly) {
        // 对于根节点拖动，同步移动所有子节点而不是重新计算布局
        const childNodeIds = Array.from(oldMindmapIds).filter(id => id !== props.nodeId)
        if (childNodeIds.length > 0) {
          // 同步移动所有子节点
          syncMoveChildNodes(childNodeIds, offsetX, offsetY)
          return // 跳过后续的布局更新
        }
      }
    }

    // 检查相关节点是否有变化
    const hasChanges = oldMindmapIds.size !== newMindmapIds.size ||
      Array.from(oldMindmapIds).some(id => {
        const oldNode = oldNodes.find(n => n.id === id)
        const newNode = newNodes.find(n => n.id === id)
        return !newNode || 
          JSON.stringify(oldNode.position) !== JSON.stringify(newNode.position) ||
          JSON.stringify(oldNode.dimensions) !== JSON.stringify(newNode.dimensions) ||
          oldNode.data?.folded !== newNode.data?.folded // 添加折叠状态检查
      })

    if (hasChanges) {
      updateMindmapLayoutRecursively(props.nodeId)
    }
  }, { deep: true })

  // 子节点变化监听器
  watch(() => getChildNodes(), async (newChildNodes, oldChildNodes) => {
    if (!oldChildNodes || !props.nodeData?.mindmap) return

    const mindmapOldChildren = oldChildNodes.filter(node => node.data?.mindmap)
    const mindmapNewChildren = newChildNodes.filter(node => node.data?.mindmap)

    if (mindmapOldChildren.length !== mindmapNewChildren.length) {
      await updateMindmapLayoutRecursively(props.nodeId)
    }
  }, { deep: true })
}

// 同步移动所有子节点
const syncMoveChildNodes = (childNodeIds, offsetX, offsetY) => {
  const nodes = getNodes.value
  
  // 过滤出所有需要移动的节点
  const nodesToMove = nodes.filter(node => childNodeIds.includes(node.id))
  
  // 准备更新所有子节点的位置
  const updatedNodes = nodes.map(node => {
    if (childNodeIds.includes(node.id)) {
      return {
        ...node,
        position: {
          x: node.position.x + offsetX,
          y: node.position.y + offsetY
        },
        // 添加过渡动画
        class: 'mindmap-node-sync-move'
      }
    }
    return node
  })
  
  // 更新节点
  setNodes(updatedNodes)
}

// 初始化监听器
setupMindmapWatchers()

// 获取节点的所有祖先节点
const getNodeAncestors = (node, nodes, ancestors = []) => {
  if (!node.data?.parentId) return ancestors
  
  const parent = nodes.find(n => n.id === node.data.parentId)
  if (!parent) return ancestors
  
  ancestors.push(parent)
  return getNodeAncestors(parent, nodes, ancestors)
}

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

// 添加折叠功能的相关逻辑
const isFolded = ref(props.nodeData?.folded || false)
const hasChildren = computed(() => getChildNodes().length > 0)

// 监听props中folded的变化
watch(() => props.nodeData?.folded, (newVal) => {
  if (newVal !== undefined) {
    isFolded.value = newVal
  }
}, { immediate: true })

// 获取所有子孙节点ID
const getDescendantNodeIds = (nodeId, nodes) => {
  const result = new Set()
  
  const collectDescendants = (currentNodeId) => {
    const children = nodes.filter(n => n.data?.parentId === currentNodeId)
    children.forEach(child => {
      result.add(child.id)
      collectDescendants(child.id)
    })
  }
  
  collectDescendants(nodeId)
  return result
}

// 添加左右侧折叠状态
const isLeftFolded = ref(false)
const isRightFolded = ref(false)

// 添加左右侧子节点计算属性
const leftChildNodes = computed(() => {
  const nodes = getNodes.value || []
  return nodes.filter((node) => {
    if (!node.data?.parentId || node.data?.parentId !== props.nodeId) return false
    const edge = edges.value?.find(e => e.target === node.id)
    return edge?.sourceHandle === 'left'
  })
})

const rightChildNodes = computed(() => {
  const nodes = getNodes.value || []
  return nodes.filter((node) => {
    if (!node.data?.parentId || node.data?.parentId !== props.nodeId) return false
    const edge = edges.value?.find(e => e.target === node.id)
    return edge?.sourceHandle === 'right'
  })
})

const hasLeftChildren = computed(() => leftChildNodes.value.length > 0)
const hasRightChildren = computed(() => rightChildNodes.value.length > 0)

// 修改折叠子树功能
const toggleFoldSubtree = async (side: 'left' | 'right') => {
  // 根据侧边更新对应的折叠状态
  if (side === 'left') {
    isLeftFolded.value = !isLeftFolded.value
  } else {
    isRightFolded.value = !isRightFolded.value
  }
  
  // 获取所有节点和边
  const nodes = getNodes.value || []
  const allEdges = edges.value || []
  
  // 获取指定侧边的子孙节点ID
  const descendantIds = new Set()
  const collectDescendants = (nodeId) => {
    const children = nodes.filter(n => {
      if (n.data?.parentId !== nodeId) return false
      const edge = allEdges.find(e => e.target === n.id)
      return edge?.sourceHandle === side
    })
    
    children.forEach(child => {
      descendantIds.add(child.id)
      collectDescendants(child.id)
    })
  }
  
  collectDescendants(props.nodeId)
  
  // 更新节点可见性
  const updatedNodes = nodes.map(node => {
    if (descendantIds.has(node.id)) {
      return {
        ...node,
        hidden: side === 'left' ? isLeftFolded.value : isRightFolded.value,
        class: 'mindmap-node-fold-transition',
      }
    }
    return node
  })
  
  // 更新边的可见性
  const updatedEdges = allEdges.map(edge => {
    if (descendantIds.has(edge.source) || descendantIds.has(edge.target)) {
      return {
        ...edge,
        hidden: side === 'left' ? isLeftFolded.value : isRightFolded.value,
        class: 'mindmap-edge-fold-transition',
      }
    }
    return edge
  })
  
  // 更新节点和边
  setNodes(updatedNodes)
  setEdges(updatedEdges)
  
  // 等待状态更新
  await nextTick()
  
  // 更新布局
  await updateMindmapLayoutRecursively(props.nodeId)
  
  // 更新白板配置
  if (props.whiteBoardConfigData) {
    props.whiteBoardConfigData.boardOptions.nodes = updatedNodes
    props.whiteBoardConfigData.boardOptions.edges = updatedEdges
  }
}

// 修改计算边颜色的函数
const calculateEdgeColor = (parentEdge, siblings, currentEdges) => {
  // 如果有父边的颜色，直接继承
  if (parentEdge?.data?.color) {
    return parentEdge.data.color
  }

  // 获取当前节点的所有子边（包括左右两侧）
  const sourceEdges = currentEdges.filter((edge) => edge.source === props.nodeId)
  
  // 如果已经有子边，则基于最后一个子边的颜色选择下一个颜色
  if (sourceEdges.length > 0) {
    const lastEdge = sourceEdges[sourceEdges.length - 1]
    if (lastEdge?.data?.color) {
      const lastColorIndex = presetColors.findIndex((color) => color === lastEdge.data.color)
      if (lastColorIndex !== -1) {
        return presetColors[(lastColorIndex + 1) % presetColors.length]
      }
    }
  }

  // 如果是新的分支，使用第一个预设颜色
  return presetColors[0]
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

  .button-group {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    z-index: 10;
    display: flex;
    gap: 4px;
    opacity: 0;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    pointer-events: none;

    &.left {
      left: -32px;
      flex-direction: row-reverse;
    }

    &.right {
      right: -32px;
    }

    .add-child-button,
    .fold-children-button {
      transform: scale(0.9);
      transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      pointer-events: auto;
    }
  }

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    border-color: var(--b3-theme-primary);

    .button-group {
      opacity: 1;

      .add-child-button,
      .fold-children-button {
        transform: scale(1);
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
  }

  &.is-collapsed {
    height: 36px;
    min-height: 36px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    .main {
      display: none;
    }
  }
}

// 添加同步移动动画样式
:global(.mindmap-node-sync-move) {
  transition: transform 0.2s ease-out !important;
}

:global(.mindmap-node-transition) {
  transition: all 0.3s ease-out !important;
}

// 添加折叠/展开动画样式
:global(.mindmap-node-fold-transition) {
  transition: opacity 0.3s ease-out, transform 0.3s ease-out !important;
}

:global(.mindmap-edge-fold-transition) {
  transition: opacity 0.3s ease-out !important;
}
</style>

