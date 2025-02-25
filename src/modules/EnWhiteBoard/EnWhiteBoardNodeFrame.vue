<template>
  <NodeToolbar
    :position="Position.Top"
    :is-visible="isSelected && !isMultipleSelected"
    :node-id="flowNode.id"
    class="EnWhiteBoardNodeToolbar"
    :style="{
      transform: 'translateY(-8px)',
    }"
  >
    <EnWhiteBoardToolBar
      :is-node-toolbar="true"
      :node-id="flowNode.id"
      :style="{ transform: 'translateY(-8px)' }"
      @remove-node="handleRemoveNode"
      @duplicate-node="handleDuplicateNode"
      @collapse="handleCollapse"
    />
  </NodeToolbar>

  <div
    ref="containerRef"
    class="EnWhiteBoardNodeFrameContainer"
    :class="{
      'is-collapsed': isCollapsed,
      'is-selected': isSelected,
      'is-dragging': isDragging,
      'can-drop': canDrop,
    }"
    :data-en-flow-node-id="flowNode.id"
    :style="{
      '--en-frame-width': `${flowNode.dimensions.width}px`,
      '--en-frame-height': isCollapsed ? '30px' : `${flowNode.dimensions.height}px`,
      'backgroundColor': nodeData.style?.backgroundColor || 'var(--b3-theme-surface-light)',
    }"
    @mousedown="handleMouseDown"
    @mouseup="handleMouseUp"
    @contextmenu="handleContextMenu"
    @click="handleFrameClick"
  >
    <div
      class="FrameToolbarArea"
      :style="{
        transform: `translate(0, calc(-100% - 4px)) scale(${1 / (viewport?.zoom || 1)})`,
        transformOrigin: 'left bottom',
      }"
    >
      <div class="infos">
        <span class="frame-title">{{ nodeData.label || '未命名分组' }}</span>
        <span class="child-count">{{ childNodes.length }}</span>
      </div>
    </div>

    <div
      v-show="!isCollapsed"
      class="frame-content"
    >
      <slot />
    </div>

    <NodeResizer
      v-if="!isCollapsed"
      :min-width="200"
      :min-height="100"
      color="transparent"
      @resize="onResize"
    />

    <Handle
      v-for="position in ['top', 'right', 'bottom', 'left']"
      :id="position"
      :key="position"
      class="Handle"
      :class="[position]"
      type="source"
      :position="Position[position.charAt(0).toUpperCase() + position.slice(1)]"
    >
      <div class="HandleIcon">
        <component :is="handleIcons[position]" />
      </div>
    </Handle>
  </div>

  <Teleport to="body">
    <div
      v-if="contextMenuVisible"
      class="EnWhiteBoardFrameContextMenu"
      :style="{
        left: `${contextMenuPosition.x}px`,
        top: `${contextMenuPosition.y}px`,
      }"
    >
      <div class="MenuGroup">
        <div
          class="ContextMenuItem"
          @click="createNodeInFrame"
        >
          <IconPlus />
          <span>创建新节点</span>
        </div>
      </div>

      <div class="MenuGroup">
        <div
          v-if="getSelectedNodes.length > 0"
          class="ContextMenuItem"
          @click="addSelectedNodesToFrame"
        >
          <IconPlus />
          <span>添加选中节点到分组</span>
        </div>
        <div
          v-if="childNodes.length > 0"
          class="ContextMenuItem"
          @click="removeNodesFromFrame"
        >
          <IconPlus />
          <span>从分组中移除选中节点</span>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { getNewDailyNoteBlockId } from '@/modules/DailyNote/DailyNote'
import {
  generateWhiteBoardNodeId,
  useWhiteBoardModule,
} from '@/modules/EnWhiteBoard/EnWhiteBoard'

import { EN_CONSTANTS } from '@/utils/Constants'
import {
  IconArrowDown,
  IconArrowLeft,
  IconArrowRight,
  IconArrowUp,
  IconPlus,
} from '@arco-design/web-vue/es/icon'
import {
  Handle,
  Position,
  useNode,
  useVueFlow,
  Node as VueFlowNode,
} from '@vue-flow/core'
import {
  NodeResizer,
  OnResize,
} from '@vue-flow/node-resizer'
import { NodeToolbar } from '@vue-flow/node-toolbar'
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from 'vue'
import EnWhiteBoardToolBar from './EnWhiteBoardToolBar.vue'


const handleIcons = {
  top: IconArrowUp,
  right: IconArrowRight,
  bottom: IconArrowDown,
  left: IconArrowLeft,
}

const {
  node: flowNode,
} = useNode()

const {
  addNodes,
  getSelectedNodes,
  getNodes,
  setNodes,
  removeNodes,
  viewport,
  addSelectedNodes,
  removeSelectedNodes,
} = useVueFlow()

const nodeData = computed(() => flowNode.data)
const containerRef = ref<HTMLDivElement | null>(null)

const isCollapsed = ref(false)

const dragStartPos = ref({
  x: 0,
  y: 0,
})
const isDragging = ref(false)
const containedNodes = ref<VueFlowNode[]>([])
const canDrop = ref(false)

// 添加子节点管理
const childNodes = computed(() => {
  return getNodes.value.filter((node) => node.data?.parentId === flowNode.id)
})

// 检查节点是否在 Frame 内部
const isNodeInside = (node: VueFlowNode) => {
  // Frame的范围
  const frameLeft = flowNode.position.x
  const frameTop = flowNode.position.y
  const frameRight = frameLeft + flowNode.dimensions.width
  const frameBottom = frameTop + flowNode.dimensions.height

  // 节点的范围
  const nodeLeft = node.position.x
  const nodeTop = node.position.y
  const nodeRight = nodeLeft + (node.dimensions?.width || 0)
  const nodeBottom = nodeTop + (node.dimensions?.height || 0)

  // 节点必须完全在 Frame 内部
  return (
    nodeLeft >= frameLeft // 节点左边在 Frame 内
    && nodeRight <= frameRight // 节点右边在 Frame 内
    && nodeTop >= frameTop // 节点上边在 Frame 内
    && nodeBottom <= frameBottom // 节点下边在 Frame 内
  )
}

// 更新节点的父子关系
const updateNodeParent = (nodeId: string, parentId: string | null) => {
  const nodes = getNodes.value
  const targetNode = nodes.find((node) => node.id === nodeId)
  if (!targetNode) return

  const newNodes = nodes.map((node) => {
    if (node.id === nodeId) {
      // 如果是添加到 Frame
      if (parentId === flowNode.id) {
        // 计算相对于 Frame 的位置
        const relativeX = node.position.x - flowNode.position.x
        const relativeY = node.position.y - flowNode.position.y

        return {
          ...node,
          data: {
            ...node.data,
            parentId,
          },
          position: {
            x: flowNode.position.x + relativeX,
            y: flowNode.position.y + relativeY,
          },
        }
      }

      // 如果是移出 Frame，保持当前位置
      return {
        ...node,
        data: {
          ...node.data,
          parentId,
        },
      }
    }
    return node
  })
  setNodes(newNodes)
}

const handleCollapse = () => {
  isCollapsed.value = !isCollapsed.value

  // 更新节点数据
  const nodes = getNodes.value
  const newNodes = nodes.map((node) => {
    if (node.id === flowNode.id) {
      return {
        ...node,
        data: {
          ...node.data,
          isCollapsed: isCollapsed.value,
        },
      }
    }
    return node
  })
  setNodes(newNodes)
}

const handleRemoveNode = () => {
  removeNodes([flowNode])
}

const handleDuplicateNode = () => {
  const nodes = getNodes.value
  const sourceNode = nodes.find((node) => node.id === flowNode.id)
  if (!sourceNode) return

  const newNode = {
    ...sourceNode,
    id: generateWhiteBoardNodeId(),
    position: {
      x: sourceNode.position.x + 50,
      y: sourceNode.position.y + 50,
    },
    data: {
      ...sourceNode.data,
    },
    selected: true,
    dragging: false,
    resizing: false,
  }

  const updatedNodes = nodes.map((node) => ({
    ...node,
    selected: node.id === sourceNode.id ? false : node.selected,
  }))
  setNodes(updatedNodes)
  addNodes([newNode])
}

const isMultipleSelected = computed(() => {
  return getSelectedNodes.value.length > 1
})

const isSelected = computed(() => {
  const selectedNodes = getSelectedNodes.value
  return selectedNodes.some((node) => node.id === flowNode.id)
})

const onResize = (event: OnResize) => {
  // 等待 DOM 更新
  nextTick(() => {
    checkNodesInFrameBoundary()
    highlightPotentialNodes()
  })
}

const handleMouseDown = (event: MouseEvent) => {
  // 获取 Frame 范围内的所有节点
  const nodesInFrame = getNodes.value.filter((node) => {
    // 跳过自身和已经是其他 Frame 的子节点
    if (node.id === flowNode.id || (node.data?.parentId && node.data.parentId !== flowNode.id)) return false
    // 使用已有的 isNodeInside 函数检查节点是否在 Frame 范围内
    return isNodeInside(node)
  })

  // 先清除所有选中状态
  const updatedNodes = getNodes.value.map((node) => ({
    ...node,
    selected: false,
    dragging: node.id === flowNode.id || nodesInFrame.some((n) => n.id === node.id),
  }))
  setNodes(updatedNodes)

  // 选中 Frame 和范围内的节点
  const nodesToSelect = [flowNode, ...nodesInFrame]
  addSelectedNodes(nodesToSelect)

  containedNodes.value = nodesInFrame
  isDragging.value = true
}

const handleMouseUp = () => {
  if (!isDragging.value) return
  isDragging.value = false
  containedNodes.value = []

  // 检查其他节点是否需要加入或移出 Frame
  nextTick(() => {
    checkNodesInFrameBoundary()
  })
}

// 添加拖拽离开处理
const handleDragLeave = (event: DragEvent) => {
  event.preventDefault()
  canDrop.value = false
}

// 添加右键菜单状态
const contextMenuVisible = ref(false)
const contextMenuPosition = ref({
  x: 0,
  y: 0,
})
const clickPosition = ref({
  x: 0,
  y: 0,
})

// 处理右键菜单
const handleContextMenu = (event: MouseEvent) => {
  event.preventDefault()
  event.stopPropagation()

  // 记录点击位置(相对于 Frame)
  const frameRect = containerRef.value.getBoundingClientRect()
  clickPosition.value = {
    x: event.clientX - frameRect.left,
    y: event.clientY - frameRect.top,
  }

  // 设置菜单位置(相对于视口)
  contextMenuPosition.value = {
    x: event.clientX,
    y: event.clientY,
  }

  contextMenuVisible.value = true
}

// 关闭右键菜单
const closeContextMenu = () => {
  contextMenuVisible.value = false
}

// 在 Frame 中创建新节点
const createNodeInFrame = async () => {
  const blockId = await getNewDailyNoteBlockId()
  const newNodeId = generateWhiteBoardNodeId()

  // 创建新节点
  const newNode = {
    id: newNodeId,
    type: EN_CONSTANTS.EN_WHITE_BOARD_NODE_TYPE_PROTYLE,
    data: {
      blockId,
      parentId: flowNode.id, // 设置父节点为当前 Frame
    },
    // 使用点击位置作为节点位置
    position: {
      x: flowNode.position.x + clickPosition.value.x,
      y: flowNode.position.y + clickPosition.value.y,
    },
    width: moduleWhiteBoardOptions.value.cardWidthDefault,
    height: moduleWhiteBoardOptions.value.cardHeightDefault,
    connectable: true,
    draggable: true,
    selectable: true,
  }

  addNodes([newNode])
  closeContextMenu()
}

const { moduleOptions: moduleWhiteBoardOptions } = useWhiteBoardModule()

// 检查节点是否在 Frame 边界附近
const checkNodesInFrameBoundary = () => {
  const nodes = getNodes.value
  const margin = 5 // 边界检测的容差值

  nodes.forEach((node) => {
    if (node.id === flowNode.id) return

    // 检查是否是子节点且移出了范围
    if (node.data?.parentId === flowNode.id) {
      if (!isNodeInside(node)) {
        // 移出范围，需要移除父子关系
        updateNodeParent(node.id, null)
      }
    }
    // 检查是否是非子节点但进入了范围
    else if (!node.data?.parentId) {
      if (isNodeInside(node)) {
        // 进入范围，需要建立父子关系
        updateNodeParent(node.id, flowNode.id)
      }
    }
  })
}

// 添加一个计算属性来显示可能成为子节点的节点
const potentialChildNodes = computed(() => {
  return getNodes.value.filter((node) => {
    if (node.id === flowNode.id || node.data?.parentId) return false
    return isNodeInside(node)
  })
})

// 在样式中添加视觉提示
const highlightPotentialNodes = () => {
  potentialChildNodes.value.forEach((node) => {
    const nodeEl = document.querySelector(`[data-en-flow-node-id="${node.id}"]`)
    if (nodeEl) {
      nodeEl.classList.add('potential-frame-child')
    }
  })
}

const clearPotentialNodesHighlight = () => {
  document.querySelectorAll('.potential-frame-child').forEach((el) => {
    el.classList.remove('potential-frame-child')
  })
}

// 添加实时检测逻辑
let lastCheckTime = 0
const CHECK_INTERVAL = 16 // 约60fps的检测频率

const throttledCheck = () => {
  const now = Date.now()
  if (now - lastCheckTime >= CHECK_INTERVAL) {
    checkNodesInFrameBoundary()
    highlightPotentialNodes()
    lastCheckTime = now
  }
}

// 监听其他节点的移动
watch(() => getNodes.value, (newNodes, oldNodes) => {
  if (!oldNodes) return

  // 检查每个节点的变化
  newNodes.forEach((node, index) => {
    const oldNode = oldNodes[index]
    if (!oldNode) return

    // 如果节点正在拖动或位置/尺寸发生变化
    if (
      node.dragging
      || node.position.x !== oldNode.position.x
      || node.position.y !== oldNode.position.y
      || node.dimensions?.width !== oldNode.dimensions?.width
      || node.dimensions?.height !== oldNode.dimensions?.height
    ) {
      throttledCheck()
    }
  })
}, {
  deep: true,
  immediate: true,
})

// 监听 Frame 自身的变化
watch(() => ({
  x: flowNode.position.x,
  y: flowNode.position.y,
  width: flowNode.dimensions?.width,
  height: flowNode.dimensions?.height,
  dragging: flowNode.dragging,
}), () => {
  throttledCheck()
}, {
  deep: true,
  immediate: true,
})

// 在组件挂载时添加全局鼠标移动监听
onMounted(() => {
  document.addEventListener('click', handleGlobalClick)
  document.addEventListener('mousemove', throttledCheck)
  // 初始检测
  nextTick(() => {
    detectNodesInFrame()
    highlightPotentialNodes()
  })
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleGlobalClick)
  document.removeEventListener('mousemove', throttledCheck)
  clearPotentialNodesHighlight()
})

// 处理全局点击事件
const handleGlobalClick = (event: MouseEvent) => {
  // 如果点击的不是右键菜单内的元素，则关闭菜单
  const menuEl = document.querySelector('.EnWhiteBoardFrameContextMenu')
  if (menuEl && !menuEl.contains(event.target as Node)) {
    closeContextMenu()
  }
}

// 添加批量添加选中节点到 Frame 的功能
const addSelectedNodesToFrame = () => {
  const selectedNodes = getSelectedNodes.value
  if (selectedNodes.length === 0) return

  const frameRect = containerRef.value.getBoundingClientRect()
  const updatedNodes = getNodes.value.map((node) => {
    if (selectedNodes.find((n) => n.id === node.id)) {
      const nodeEl = document.querySelector(`[data-en-flow-node-id="${node.id}"]`)
      const nodeRect = nodeEl?.getBoundingClientRect()

      if (nodeRect) {
        const relativePos = getRelativePosition(nodeRect, frameRect)
        return {
          ...node,
          data: {
            ...node.data,
            parentId: flowNode.id,
          },
          position: {
            x: flowNode.position.x + relativePos.x,
            y: flowNode.position.y + relativePos.y,
          },
        }
      }
    }
    return node
  })

  setNodes(updatedNodes)
  closeContextMenu()
}

// 从 Frame 中移除节点
const removeNodesFromFrame = () => {
  const selectedNodes = getSelectedNodes.value
  if (selectedNodes.length === 0) return

  const updatedNodes = getNodes.value.map((node) => {
    if (selectedNodes.find((n) => n.id === node.id) && node.data?.parentId === flowNode.id) {
      const {
        parentId,
        ...restData
      } = node.data
      return {
        ...node,
        data: restData,
      }
    }
    return node
  })

  setNodes(updatedNodes)
  closeContextMenu()
}

// 检测所有节点,找出在 Frame 范围内的节点
const detectNodesInFrame = () => {
  const nodes = getNodes.value

  // 找出所有在 Frame 范围内的节点
  const nodesInFrame = nodes.filter((node) => {
    // 跳过自身和已经属于其他 Frame 的节点
    if (node.id === flowNode.id || node.data?.parentId) return false
    return isNodeInside(node)
  })

  // 更新这些节点的父子关系
  if (nodesInFrame.length > 0) {
    const updatedNodes = nodes.map((node) => {
      if (nodesInFrame.find((n) => n.id === node.id)) {
        return {
          ...node,
          data: {
            ...node.data,
            parentId: flowNode.id,
          },
        }
      }
      return node
    })
    setNodes(updatedNodes)
  }
}

// Frame 节点移动时的处理
const handleFrameMove = (dx: number, dy: number) => {
  const updatedNodes = getNodes.value.map((node) => {
    if (node.id === flowNode.id) {
      // 更新 Frame 位置
      return {
        ...node,
        position: {
          x: node.position.x + dx,
          y: node.position.y + dy,
        },
      }
    } else if (node.data?.parentId === flowNode.id) {
      // 更新子节点位置
      return {
        ...node,
        position: {
          x: node.position.x + dx,
          y: node.position.y + dy,
        },
      }
    }
    return node
  })

  setNodes(updatedNodes)

  // 检查其他节点是否需要加入或移出 Frame
  nextTick(() => {
    checkNodesInFrameBoundary()
  })
}

const handleFrameClick = (event: MouseEvent) => {
  // 获取 Frame 范围内的所有节点
  const nodesInFrame = getNodes.value.filter((node) => {
    // 跳过自身和已经是其他 Frame 的子节点
    if (node.id === flowNode.id || (node.data?.parentId && node.data.parentId !== flowNode.id)) return false
    // 使用已有的 isNodeInside 函数检查节点是否在 Frame 范围内
    return isNodeInside(node)
  })

  // 先清除所有选中状态
  const updatedNodes = getNodes.value.map((node) => ({
    ...node,
    selected: false,
  }))
  setNodes(updatedNodes)

  // 选中 Frame 和范围内的节点
  const nodesToSelect = [flowNode, ...nodesInFrame]
  addSelectedNodes(nodesToSelect)

  containedNodes.value = nodesInFrame
}
</script>

<style lang="scss" scoped>
.EnWhiteBoardNodeFrameContainer {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  position: relative;
  border: 2px dashed var(--b3-border-color);
  border-radius: var(--b3-border-radius);
  padding: unset;
  transition: height 0.3s ease-in-out, border-color 0.3s ease-in-out, box-shadow 0.3s ease-in-out, opacity 0.3s ease-in-out;
  background-color: color-mix(in srgb, var(--b3-theme-surface-light) 85%, transparent);
  backdrop-filter: blur(8px);
  cursor: move;
  z-index: -1;

  &:hover,
  &.is-selected {
    border-style: solid;
    border-color: var(--b3-theme-primary-light);
    box-shadow: 0 0 0 1px var(--b3-theme-primary-light);
    z-index: -1; // 确保选中和悬停时也保持在底层

    .frame-content {
      background-color: var(--b3-theme-surface-light);
      opacity: 0.1;
    }
  }

  &.is-selected {
    border-color: var(--b3-theme-primary);
    box-shadow: 0 0 0 2px var(--b3-theme-primary-light);
  }

  &.is-dragging {
    opacity: 0.7;
    cursor: grabbing;

    // 拖动时显示所有子节点
    & ~ .vue-flow__node {
      opacity: 0.7;
      pointer-events: none;
    }
  }

  // 添加拖拽目标样式
  &.can-drop {
    border-style: solid;
    border-color: var(--b3-theme-primary);
    box-shadow: 0 0 0 2px var(--b3-theme-primary-light);
  }

  .FrameToolbarArea {
    position: absolute;
    top: -4px;
    left: 0;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    box-sizing: border-box;
    padding: 2px;
    background: var(--b3-theme-surface);
    border: 1px solid var(--b3-border-color);
    border-radius: var(--b3-border-radius);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    white-space: nowrap;
    z-index: 10;
    pointer-events: all;

    .infos {
      flex: 1;
      overflow: hidden;
      margin-right: var(--en-gap);
      display: flex;
      align-items: center;
      gap: 4px;

      .frame-title {
        font-size: 13px;
        color: var(--b3-theme-on-surface);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        display: block;
        line-height: 1.2;
        padding: 2px 4px;
        border-radius: 4px;
        transition: background-color 0.2s ease;
      }

      .child-count {
        font-size: 12px;
        color: var(--b3-theme-on-surface);
        opacity: 0.6;
        text-align: center;
      }
    }

    .operations {
      flex-shrink: 0;
      opacity: 0.6;
      transition: opacity 0.2s ease;
      cursor: default;

      &:hover {
        opacity: 1;
      }

      .arco-btn {
        color: var(--b3-theme-on-surface);
        transition: all 0.2s ease;
        cursor: pointer;

        &:hover {
          color: var(--b3-theme-primary);
          background-color: var(--b3-theme-primary-light);
        }
      }
    }
  }

  .frame-content {
    flex: 1;
    position: relative;
    overflow: visible;
    padding: var(--en-gap);
    min-height: 100px;
    cursor: default;

    // 添加网格背景
    background-image:
      linear-gradient(to right, var(--b3-border-color) 1px, transparent 1px),
      linear-gradient(to bottom, var(--b3-border-color) 1px, transparent 1px);
    background-size: 20px 20px;
    background-color: transparent;
    opacity: 0.1;
  }

  &.is-collapsed {
    height: 30px !important;
    min-height: 30px !important;

    .frame-content {
      display: none;
    }

    .Handle {
      display: none;
    }

    :deep(.vue-flow__resize-control) {
      display: none;
    }

    .FrameToolbarArea {
      border-bottom: none;
      border-radius: var(--b3-border-radius);
    }
  }

  .Handle {
    width: 21px;
    height: 21px;
    z-index: 10;
    opacity: 0;
    border-color: var(--b3-theme-primary-light);
    background-color: var(--b3-theme-background);
    color: var(--b3-theme-primary-light);
    transition: opacity 0.2s ease, background-color 0.2s ease;
    cursor: crosshair;

    &:hover {
      background-color: var(--b3-theme-primary-light);
      color: var(--b3-theme-on-primary);
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

    &.top {
      top: -16px;
    }
    &.bottom {
      bottom: -16px;
    }
    &.left {
      left: -16px;
    }
    &.right {
      right: -16px;
    }
  }

  :deep(.vue-flow__resize-control) {
    &.handle {
      background-color: var(--b3-theme-primary-light);
      border: 2px solid var(--b3-theme-background);
      box-shadow: 0 0 0 1px var(--b3-theme-primary);
      opacity: 0;
      transition: opacity 0.2s ease;
      cursor: nwse-resize;

      &:hover {
        opacity: 1;
      }
    }

    &.line {
      background-color: var(--b3-theme-primary-light);
      opacity: 0;
      transition: opacity 0.2s ease;

      &:hover {
        opacity: 1;
      }
    }
  }

  :deep(.potential-frame-child) {
    outline: 2px dashed var(--b3-theme-primary-light) !important;
    outline-offset: 2px;
  }
}

.EnWhiteBoardNodeToolbar {
  :deep(.vue-flow__node-toolbar) {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    padding: 8px;
    border-radius: 8px;
    background: var(--b3-theme-surface);
    border: 1px solid var(--b3-border-color);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
}

.EnWhiteBoardFrameContextMenu {
  position: fixed;
  z-index: 1000;
  background: var(--b3-theme-surface);
  border: 1px solid var(--b3-border-color);
  border-radius: var(--b3-border-radius);
  padding: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  min-width: 160px;

  .MenuGroup {
    &:not(:last-child) {
      border-bottom: 1px solid var(--b3-border-color);
      margin-bottom: 4px;
      padding-bottom: 4px;
    }
  }

  .ContextMenuItem {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 8px;
    cursor: pointer;
    border-radius: var(--b3-border-radius);
    color: var(--b3-theme-on-surface);
    font-size: 13px;

    &:hover {
      background: var(--b3-theme-surface-light);
    }

    .arco-icon {
      font-size: 14px;
    }
  }
}

// 修改全局样式，确保其他节点始终在 Frame 上层，包括选中状态
:deep(.vue-flow__node:not(.EnWhiteBoardNodeFrameContainer)) {
  z-index: 2 !important; // 使用 !important 确保优先级
}
</style>

