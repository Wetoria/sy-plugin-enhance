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
    draggable="true"
    @dragstart="handleDragStart"
    @dragend="handleDragEnd"
    @dragover="handleDragOver"
    @drop="handleDrop"
    @dragleave="handleDragLeave"
    @contextmenu="handleContextMenu"
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
      <div class="operations">
        <a-button-group size="mini">
          <a-button @click="handleEditLabel">
            <template #icon>
              <icon-edit />
            </template>
          </a-button>
        </a-button-group>
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
import {
  generateWhiteBoardNodeId,
} from '@/modules/EnWhiteBoard/EnWhiteBoard'
import { Modal } from '@arco-design/web-vue'
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
  ref,
  onMounted,
  onBeforeUnmount,
  nextTick,
  watch,
} from 'vue'
import EnWhiteBoardToolBar from './EnWhiteBoardToolBar.vue'
import { getNewDailyNoteBlockId } from '@/modules/DailyNote/DailyNote'
import { EN_CONSTANTS } from '@/utils/Constants'
import { useWhiteBoardModule } from '@/modules/EnWhiteBoard/EnWhiteBoard'


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
  return getNodes.value.filter(node => node.data?.parentId === flowNode.id)
})

// 检查节点是否在 Frame 内部
const isNodeInside = (nodeRect: DOMRect, frameRect: DOMRect) => {
  // 获取 Frame 的左上角和右下角坐标
  const frameTopLeft = {
    x: frameRect.left,
    y: frameRect.top,
  }
  const frameBottomRight = {
    x: frameRect.right,
    y: frameRect.bottom,
  }

  // 获取节点的左上角和右下角坐标
  const nodeTopLeft = {
    x: nodeRect.left,
    y: nodeRect.top,
  }
  const nodeBottomRight = {
    x: nodeRect.right,
    y: nodeRect.bottom,
  }

  // 节点必须完全在 Frame 内部
  return (
    nodeTopLeft.x >= frameTopLeft.x &&      // 节点左边在 Frame 内
    nodeBottomRight.x <= frameBottomRight.x && // 节点右边在 Frame 内
    nodeTopLeft.y >= frameTopLeft.y &&      // 节点上边在 Frame 内
    nodeBottomRight.y <= frameBottomRight.y    // 节点下边在 Frame 内
  )
}

// 更新节点的父子关系
const updateNodeParent = (nodeId: string, parentId: string | null) => {
  const nodes = getNodes.value
  const frameRect = containerRef.value?.getBoundingClientRect()

  const newNodes = nodes.map(node => {
    if (node.id === nodeId) {
      const nodeEl = document.querySelector(`[data-en-flow-node-id="${node.id}"]`)
      const nodeRect = nodeEl?.getBoundingClientRect()

      // 如果是添加到 Frame,需要调整位置
      if (parentId === flowNode.id && frameRect && nodeRect) {
        const relativePos = getRelativePosition(nodeRect, frameRect)
        return {
          ...node,
          data: {
            ...node.data,
            parentId,
          },
          position: {
            x: flowNode.position.x + relativePos.x,
            y: flowNode.position.y + relativePos.y,
          },
        }
      }

      // 如果是移出 Frame,保持当前位置
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

// 获取节点的相对位置
const getRelativePosition = (nodeRect: DOMRect, frameRect: DOMRect) => {
  return {
    x: nodeRect.left - frameRect.left,
    y: nodeRect.top - frameRect.top
  }
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

const handleEditLabel = () => {
  const label = nodeData.value.label || ''
  Modal.confirm({
    title: '编辑分组名称',
    content: '请输入新的分组名称',
    okText: '确定',
    cancelText: '取消',
    onOk: () => {
      const nodes = getNodes.value
      const newNodes = nodes.map((node) => {
        if (node.id === flowNode.id) {
          return {
            ...node,
            data: {
              ...node.data,
              label,
            },
          }
        }
        return node
      })
      setNodes(newNodes)
    },
  })
}

const isMultipleSelected = computed(() => {
  return getSelectedNodes.value.length > 1
})

const isSelected = computed(() => {
  const selectedNodes = getSelectedNodes.value
  return selectedNodes.some((node) => node.id === flowNode.id)
})

const onResize = (event: OnResize) => {
  console.log('onResize', event)
  // 等待 DOM 更新
  nextTick(() => {
    detectNodesInFrame()
    highlightPotentialNodes()
  })
}

const handleDragStart = (event: DragEvent) => {
  isDragging.value = true
  const frameEl = event.currentTarget as HTMLElement
  const frameRect = frameEl.getBoundingClientRect()
  dragStartPos.value = {
    x: event.clientX - frameRect.left,
    y: event.clientY - frameRect.top,
  }

  // 设置拖拽效果和数据
  event.dataTransfer.effectAllowed = 'move'
  event.dataTransfer.setData('application/vueflow/nodeId', flowNode.id)
  frameEl.style.opacity = '0.7'

  // 记录当前 Frame 内的所有节点
  containedNodes.value = childNodes.value
}

const handleDragEnd = (event: DragEvent) => {
  if (!isDragging.value) return

  const frameEl = event.currentTarget as HTMLElement
  frameEl.style.opacity = '1'

  const frameRect = frameEl.getBoundingClientRect()

  // 计算拖拽偏移量
  const dx = event.clientX - dragStartPos.value.x - frameRect.left
  const dy = event.clientY - dragStartPos.value.y - frameRect.top

  // 更新 Frame 和其子节点的位置
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
  isDragging.value = false
  containedNodes.value = []

  // 检测新的子节点
  nextTick(() => {
    detectNodesInFrame()
    highlightPotentialNodes()
  })
}

const handleDragOver = (event: DragEvent) => {
  event.preventDefault()
  canDrop.value = true
  event.dataTransfer.dropEffect = 'move'
}

const handleDrop = (event: DragEvent) => {
  event.preventDefault()
  canDrop.value = false

  // 获取被拖拽的节点ID
  const draggedNodeId = event.dataTransfer.getData('application/vueflow/nodeId')
  if (!draggedNodeId) return

  const draggedNode = getNodes.value.find(node => node.id === draggedNodeId)
  if (!draggedNode || draggedNode.id === flowNode.id) return

  // 计算相对位置
  const frameRect = containerRef.value.getBoundingClientRect()
  const draggedNodeEl = document.querySelector(`[data-en-flow-node-id="${draggedNodeId}"]`)
  const draggedNodeRect = draggedNodeEl?.getBoundingClientRect()

  if (!draggedNodeRect) return

  // 检查是否在 Frame 内部
  if (isNodeInside(draggedNodeRect, frameRect)) {
    // 更新节点位置和父子关系
    const relativePos = getRelativePosition(draggedNodeRect, frameRect)
    const updatedNodes = getNodes.value.map(node => {
      if (node.id === draggedNodeId) {
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
      return node
    })
    setNodes(updatedNodes)
  }
}

// 添加拖拽离开处理
const handleDragLeave = (event: DragEvent) => {
  event.preventDefault()
  canDrop.value = false
}

// 添加右键菜单状态
const contextMenuVisible = ref(false)
const contextMenuPosition = ref({ x: 0, y: 0 })
const clickPosition = ref({ x: 0, y: 0 })

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

// 在 mounted 时添加全局点击事件监听
onMounted(() => {
  document.addEventListener('click', handleGlobalClick)
  // 初始检测
  nextTick(() => {
    detectNodesInFrame()
    highlightPotentialNodes()
  })
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleGlobalClick)
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
  const updatedNodes = getNodes.value.map(node => {
    if (selectedNodes.find(n => n.id === node.id)) {
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

  const updatedNodes = getNodes.value.map(node => {
    if (selectedNodes.find(n => n.id === node.id) && node.data?.parentId === flowNode.id) {
      const { parentId, ...restData } = node.data
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
  const frameRect = containerRef.value?.getBoundingClientRect()
  const nodes = getNodes.value

  // 找出所有在 Frame 范围内的节点
  const nodesInFrame = nodes.filter(node => {
    // 跳过自身和已经属于其他 Frame 的节点
    if (node.id === flowNode.id || node.data?.parentId) return false

    const nodeEl = document.querySelector(`[data-en-flow-node-id="${node.id}"]`)
    if (!nodeEl) return false

    const nodeRect = nodeEl.getBoundingClientRect()
    return isNodeInside(nodeRect, frameRect)
  })

  // 更新这些节点的父子关系
  if (nodesInFrame.length > 0) {
    const updatedNodes = nodes.map(node => {
      if (nodesInFrame.find(n => n.id === node.id)) {
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

// 监听其他节点的移动
watch(() => getNodes.value, (newNodes, oldNodes) => {
  if (!oldNodes) return

  // 如果有节点位置发生变化
  const hasPositionChange = newNodes.some((node, index) => {
    const oldNode = oldNodes[index]
    return (
      oldNode &&
      (node.position.x !== oldNode.position.x ||
       node.position.y !== oldNode.position.y)
    )
  })

  if (hasPositionChange) {
    const frameRect = containerRef.value?.getBoundingClientRect()
    if (frameRect) {
      // 检查是否有节点移入 Frame
      newNodes.forEach(node => {
        // 跳过自身和已经属于其他 Frame 的节点
        if (node.id === flowNode.id || node.data?.parentId) return

        const nodeEl = document.querySelector(`[data-en-flow-node-id="${node.id}"]`)
        if (!nodeEl) return

        const nodeRect = nodeEl.getBoundingClientRect()
        if (isNodeInside(nodeRect, frameRect)) {
          // 自动添加到 Frame
          updateNodeParent(node.id, flowNode.id)
        }
      })

      // 检查是否有子节点移出 Frame
      childNodes.value.forEach(node => {
        const nodeEl = document.querySelector(`[data-en-flow-node-id="${node.id}"]`)
        if (nodeEl) {
          const nodeRect = nodeEl.getBoundingClientRect()
          if (!isNodeInside(nodeRect, frameRect)) {
            // 移除父子关系
            updateNodeParent(node.id, null)
          }
        }
      })
    }

    // 更新视觉提示
    highlightPotentialNodes()
  }
}, { deep: true })

// 添加一个计算属性来显示可能成为子节点的节点
const potentialChildNodes = computed(() => {
  const frameRect = containerRef.value?.getBoundingClientRect()
  if (!frameRect) return []

  return getNodes.value.filter(node => {
    if (node.id === flowNode.id || node.data?.parentId) return false

    const nodeEl = document.querySelector(`[data-en-flow-node-id="${node.id}"]`)
    if (!nodeEl) return false

    const nodeRect = nodeEl.getBoundingClientRect()
    return isNodeInside(nodeRect, frameRect)
  })
})

// 在样式中添加视觉提示
const highlightPotentialNodes = () => {
  potentialChildNodes.value.forEach(node => {
    const nodeEl = document.querySelector(`[data-en-flow-node-id="${node.id}"]`)
    if (nodeEl) {
      nodeEl.classList.add('potential-frame-child')
    }
  })
}

const clearPotentialNodesHighlight = () => {
  document.querySelectorAll('.potential-frame-child').forEach(el => {
    el.classList.remove('potential-frame-child')
  })
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

  &:hover {
    border-style: solid;
    border-color: var(--b3-theme-primary-light);
    box-shadow: 0 0 0 1px var(--b3-theme-primary-light);

    .frame-content {
      background-color: var(--b3-theme-surface-light);
      opacity: 0.1;
    }
  }

  &.is-selected {
    border-style: solid;
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
    top: 0;
    left: 0;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    box-sizing: border-box;
    padding: 4px 8px;
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
      gap: 8px;

      .frame-title {
        font-size: 13px;
        font-weight: 500;
        color: var(--b3-theme-on-surface);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        display: block;
        line-height: 1.2;
        padding: 2px 4px;
        border-radius: 4px;
        transition: background-color 0.2s ease;
        cursor: text;
        min-width: 60px;

        &:hover {
          background-color: var(--b3-theme-surface-light);
        }
      }

      .child-count {
        font-size: 12px;
        color: var(--b3-theme-on-surface);
        opacity: 0.6;
        padding: 2px 6px;
        background: var(--b3-theme-surface-light);
        border-radius: 10px;
        min-width: 16px;
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
    z-index: -1;
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
</style>
