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
    }"
    :data-en-flow-node-id="flowNode.id"
    :style="{
      '--en-frame-width': `${flowNode.dimensions.width}px`,
      '--en-frame-height': isCollapsed ? '30px' : `${flowNode.dimensions.height}px`,
      'backgroundColor': nodeData.style?.backgroundColor || 'var(--b3-theme-surface-light)',
    }"
    @dragstart="handleDragStart"
    @dragend="handleDragEnd"
  >
    <div class="FrameToolbarArea">
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
} = useVueFlow()

const nodeData = computed(() => flowNode.data)
const containerRef = ref<HTMLDivElement | null>(null)

const isCollapsed = ref(false)

const dragStartPos = ref({
  x: 0,
  y: 0,
})
const isDragging = ref(false)

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
}

const handleDragEnd = (event: DragEvent) => {
  if (!isDragging.value) return

  const frameEl = event.currentTarget as HTMLElement
  const frameRect = frameEl.getBoundingClientRect()

  // 获取所有节点
  const nodes = getNodes.value

  // 找出在 Frame 内的节点
  const containedNodes = nodes.filter((node) => {
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

  // 计算拖拽偏移量
  const dx = event.clientX - dragStartPos.value.x - frameRect.left
  const dy = event.clientY - dragStartPos.value.y - frameRect.top

  // 更新节点位置
  const updatedNodes = nodes.map((node) => {
    if (containedNodes.find((n) => n.id === node.id)) {
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
  transition: height 0.3s ease-in-out;

  &:hover {
    border-style: solid;
  }

  .FrameToolbarArea {
    width: 100%;
    height: 30px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    box-sizing: border-box;
    padding: var(--en-gap);

    .infos {
      flex: 1;
      overflow: hidden;
      margin-right: var(--en-gap);

      .frame-title {
        font-size: 12px;
        font-weight: bold;
        color: var(--b3-theme-on-surface);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        display: block;
      }
    }

    .operations {
      flex-shrink: 0;
    }
  }

  .frame-content {
    flex: 1;
    position: relative;
    overflow: visible;
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
  }

  .Handle {
    width: 21px;
    height: 21px;
    z-index: -1;
    opacity: 0;
    border-color: var(--b3-theme-primary-light);
    background-color: var(--b3-theme-background);
    color: var(--b3-theme-primary-light);

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
}

.EnWhiteBoardNodeToolbar {
  :deep(.vue-flow__node-toolbar) {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    padding: 8px;
    border-radius: 8px;
  }
}
</style>
