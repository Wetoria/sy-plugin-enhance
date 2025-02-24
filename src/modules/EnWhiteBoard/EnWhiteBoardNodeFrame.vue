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
}

const handleDragStart = (event: DragEvent) => {
  isDragging.value = true
  const frameEl = event.currentTarget as HTMLElement
  const frameRect = frameEl.getBoundingClientRect()
  dragStartPos.value = {
    x: event.clientX - frameRect.left,
    y: event.clientY - frameRect.top,
  }

  // 设置拖拽效果
  event.dataTransfer.effectAllowed = 'move'
  frameEl.style.opacity = '0.7'

  // 记录当前 Frame 内的所有节点
  const nodes = getNodes.value
  containedNodes.value = nodes.filter((node) => {
    if (node.id === flowNode.id) return false

    const nodeEl = document.querySelector(`[data-node-id="${node.id}"]`)
    if (!nodeEl) return false

    const nodeRect = nodeEl.getBoundingClientRect()
    return (
      nodeRect.left >= frameRect.left
      && nodeRect.right <= frameRect.right
      && nodeRect.top >= frameRect.top
      && nodeRect.bottom <= frameRect.bottom
    )
  })
}

const handleDragEnd = (event: DragEvent) => {
  if (!isDragging.value) return

  const frameEl = event.currentTarget as HTMLElement
  frameEl.style.opacity = '1'

  const frameRect = frameEl.getBoundingClientRect()

  // 计算拖拽偏移量
  const dx = event.clientX - dragStartPos.value.x - frameRect.left
  const dy = event.clientY - dragStartPos.value.y - frameRect.top

  // 更新节点位置
  const updatedNodes = getNodes.value.map((node) => {
    if (containedNodes.value.find((n) => n.id === node.id)) {
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
}

const handleDragOver = (event: DragEvent) => {
  event.preventDefault()
  event.dataTransfer.dropEffect = 'move'
}

const handleDrop = (event: DragEvent) => {
  event.preventDefault()

  // 获取被拖拽的节点ID
  const draggedNodeId = event.dataTransfer.getData('application/vueflow/nodeId')
  if (!draggedNodeId) return

  const draggedNode = getNodes.value.find(node => node.id === draggedNodeId)
  if (!draggedNode || draggedNode.id === flowNode.id) return

  // 计算相对位置
  const frameRect = containerRef.value.getBoundingClientRect()
  const relativeX = event.clientX - frameRect.left
  const relativeY = event.clientY - frameRect.top

  // 更新节点位置
  const updatedNodes = getNodes.value.map(node => {
    if (node.id === draggedNodeId) {
      return {
        ...node,
        position: {
          x: flowNode.position.x + relativeX,
          y: flowNode.position.y + relativeY,
        },
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
  }

  &.is-selected {
    border-style: solid;
    border-color: var(--b3-theme-primary);
    box-shadow: 0 0 0 2px var(--b3-theme-primary-light);
  }

  &.is-dragging {
    opacity: 0.7;
    cursor: grabbing;
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
</style>
