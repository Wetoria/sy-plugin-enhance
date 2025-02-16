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
    class="EnWhiteBoardNodeMindmapContainer"
    :class="{
      'is-collapsed': isCollapsed,
    }"
    :data-en-flow-node-id="flowNode.id"
    :style="{
      '--en-mindmap-width': `${flowNode.dimensions.width}px`,
      '--en-mindmap-height': isCollapsed ? '30px' : `${flowNode.dimensions.height}px`,
      'backgroundColor': nodeData.style?.backgroundColor || 'var(--b3-theme-surface-light)',
    }"
  >
    <!-- 添加子节点按钮 -->
    <div class="add-child-button">
      <a-button
        size="mini"
        type="primary"
        shape="circle"
        @click="handleAddChildNode"
      >
        <template #icon>
          <icon-plus />
        </template>
      </a-button>
    </div>

    <div class="mindmap-content">
      <!-- 中心节点 -->
      <div class="center-node">
        <div class="mindmap-title">
          {{ nodeData.label || '思维导图' }}
        </div>
        <div class="operations">
          <a-button-group size="mini">
            <a-button @click="handleEditLabel">
              <template #icon>
                <icon-edit />
              </template>
            </a-button>
            <a-button @click="handleAddChildNode">
              <template #icon>
                <icon-plus />
              </template>
            </a-button>
            <a-button @click="handleCollapse">
              <template #icon>
                <icon-caret-right v-if="isCollapsed" />
                <icon-caret-down v-else />
              </template>
            </a-button>
          </a-button-group>
        </div>
      </div>

      <!-- 子节点容器 -->
      <div
        v-show="!isCollapsed"
        class="children-container"
      >
        <div
          v-for="childNode in childNodes"
          :key="childNode.id"
          class="mindmap-node"
        >
          <div class="node-wrapper">
            <EnWhiteBoardNodeProtyle
              :nodeProps="childNode"
              :enWhiteBoardProtyleUtilAreaRef="enWhiteBoardProtyleUtilAreaRef"
            />
            <div class="add-child-button">
              <a-button
                size="mini"
                type="primary"
                shape="circle"
                @click.stop="() => handleAddChildNodeFor(childNode)"
              >
                <template #icon>
                  <icon-plus />
                </template>
              </a-button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <NodeResizer
      :min-width="300"
      :min-height="200"
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
import { getNewDailyNoteBlockId } from '@/modules/DailyNote/DailyNote'
import {
  generateWhiteBoardNodeId,
} from '@/modules/EnWhiteBoard/EnWhiteBoard'
import { EN_CONSTANTS } from '@/utils/Constants'
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
  watch,
} from 'vue'
import EnWhiteBoardNodeProtyle from './EnWhiteBoardNodeProtyle.vue'
import EnWhiteBoardToolBar from './EnWhiteBoardToolBar.vue'

const props = defineProps<{
  enWhiteBoardProtyleUtilAreaRef: HTMLElement
}>()

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
  onConnect,
} = useVueFlow()

const nodeData = computed(() => flowNode.data)
const containerRef = ref<HTMLDivElement | null>(null)

const isCollapsed = ref(false)

const handleCollapse = () => {
  isCollapsed.value = !isCollapsed.value

  // 更新节点数据
  const nodes = getNodes.value || []
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
  const nodes = getNodes.value || []

  // 删除所有子节点
  const childrenToRemove = nodes.filter((node) => node.data?.parentId === flowNode.id)
  removeNodes([flowNode, ...childrenToRemove])

  // 更新父节点的数据
  if (flowNode.data?.parentId) {
    const parentNode = nodes.find((node) => node.id === flowNode.data.parentId)
    if (parentNode) {
      const updatedParentData = {
        ...parentNode.data,
        children: (parentNode.data.children || []).filter((child) => child.id !== flowNode.id),
      }

      const updatedNodes = nodes.map((node) => {
        if (node.id === parentNode.id) {
          return {
            ...node,
            data: updatedParentData,
          }
        }
        return node
      })

      setNodes(updatedNodes)
    }
  }
}

const handleDuplicateNode = () => {
  const nodes = getNodes.value || []
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
    title: '编辑思维导图名称',
    content: '请输入新的思维导图名称',
    okText: '确定',
    cancelText: '取消',
    onOk: () => {
      const nodes = getNodes.value || []
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

// 添加自动连线处理
onConnect((params) => {
  // 当节点之间可以连接时,自动创建连线
  const {
    source,
    target,
  } = params
  const nodes = getNodes.value || []
  const sourceNode = nodes.find((node) => node.id === source)
  const targetNode = nodes.find((node) => node.id === target)

  if (sourceNode && targetNode) {
    targetNode.data = {
      ...targetNode.data,
      parentId: sourceNode.id,
    }
    setNodes([...nodes])
  }
})

// 修改 handleAddChildNode 函数
const handleAddChildNode = async () => {
  const blockId = await getNewDailyNoteBlockId()
  const newNodeId = generateWhiteBoardNodeId()

  // 创建新节点
  const newNode = {
    id: newNodeId,
    type: EN_CONSTANTS.EN_WHITE_BOARD_NODE_TYPE_PROTYLE,
    data: {
      blockId,
      parentId: flowNode.id,
    },
    position: {
      x: flowNode.position.x + 200,
      y: flowNode.position.y,
    },
    width: 240,
    height: 120,
    connectable: true,
    draggable: true,
    selectable: true,
  }

  // 添加节点
  addNodes([newNode])
  updateLayout()
}

const isMultipleSelected = computed(() => {
  const selectedNodes = getSelectedNodes.value || []
  return selectedNodes.length > 1
})

const isSelected = computed(() => {
  const selectedNodes = getSelectedNodes.value || []
  return selectedNodes.some((node) => node.id === flowNode.id)
})

const onResize = (event: OnResize) => {
  console.log('onResize', event)
}

// 获取所有子节点
const childNodes = computed(() => {
  const nodes = getNodes.value || []
  return nodes.filter((node) => node.data?.parentId === flowNode.id)
})

// 监听节点位置变化，自动调整布局
watch(() => childNodes.value.length, () => {
  updateLayout()
})

// 更新布局
const updateLayout = () => {
  const children = childNodes.value
  if (!children?.length) return

  const nodes = getNodes.value || []
  const newNodes = [...nodes]
  const centerX = flowNode.position.x
  const centerY = flowNode.position.y
  const radius = 300 // 与添加节点时保持一致

  children.forEach((child, index) => {
    const totalNodes = children.length
    const angle = (index * (360 / totalNodes)) * (Math.PI / 180)
    const x = centerX + radius * Math.cos(angle)
    const y = centerY + radius * Math.sin(angle)

    const nodeIndex = newNodes.findIndex((n) => n.id === child.id)
    if (nodeIndex !== -1) {
      newNodes[nodeIndex] = {
        ...newNodes[nodeIndex],
        position: {
          x,
          y,
        },
      }
    }
  })

  setNodes(newNodes)
}

// 修改 handleAddChildNodeFor 函数
const handleAddChildNodeFor = async (parentNode) => {
  const blockId = await getNewDailyNoteBlockId()
  const newNodeId = generateWhiteBoardNodeId()

  // 创建新节点
  const newNode = {
    id: newNodeId,
    type: EN_CONSTANTS.EN_WHITE_BOARD_NODE_TYPE_PROTYLE,
    data: {
      blockId,
      parentId: parentNode.id,
    },
    position: {
      x: parentNode.position.x + 200,
      y: parentNode.position.y,
    },
    width: 240,
    height: 120,
    connectable: true,
    draggable: true,
    selectable: true,
  }

  // 添加节点
  addNodes([newNode])
  updateLayout()
}

</script>

<style lang="scss" scoped>
.EnWhiteBoardNodeMindmapContainer {
  position: relative;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  border: none;
  background: transparent;
  padding: 0;

  .mindmap-content {
    position: relative;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;

    .center-node {
      position: relative;
      width: 300px;
      min-width: 300px;
      background: var(--b3-theme-background);
      border: 1px solid var(--b3-border-color);
      border-radius: var(--b3-border-radius);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      z-index: 2;

      .mindmap-title {
        padding: 8px;
        font-size: 14px;
        font-weight: bold;
        color: var(--b3-theme-on-surface);
        border-bottom: 1px solid var(--b3-border-color);
      }

      .operations {
        position: absolute;
        top: 8px;
        right: 8px;
      }
    }

    .children-container {
      position: relative;
      flex: 1;
      height: 100%;
      margin-left: 50px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      gap: 20px;

      .mindmap-node {
        position: relative;
        transition: all 0.3s ease-in-out;

        :deep(.EnWhiteBoardNodeProtyleContainer) {
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          border: 1px solid var(--b3-border-color);
          background: var(--b3-theme-background);

          &:hover {
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          }
        }

        &::before {
          content: '';
          position: absolute;
          top: 50%;
          right: 100%;
          width: 50px;
          height: 2px;
          background: var(--b3-theme-primary);
          transform: translateY(-50%);
        }

        .node-wrapper {
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
        }
      }
    }
  }

  &.is-collapsed {
    .children-container {
      display: none;
    }
  }

  .Handle {
    display: none;
  }

  // 添加子节点按钮样式
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

.mindmap-node {
  position: absolute;
  // 后续需要添加节点定位和连线的样式
}
</style>
