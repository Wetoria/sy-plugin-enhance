<template>
  <div
    v-show="visible"
    class="EnWhiteBoardContextMenu"
    :style="{
      left: `${position.x}px`,
      top: `${position.y}px`,
    }"
  >
    <div class="MenuGroup">
      <div
        class="MenuItem"
        @click="handleCreateNode"
      >
        <icon-plus />
        <span>新建节点</span>
      </div>
      <div
        class="MenuItem"
        @click="handleCreateFrame"
      >
        <icon-apps />
        <span>新建分组</span>
      </div>
      <div
        class="MenuItem"
        @click="handleCreateMindmap"
      >
        <icon-mind-mapping />
        <span>新建思维导图</span>
      </div>
    </div>
    <div class="MenuGroup">
      <div
        class="MenuItem"
        @click="handlePaste"
      >
        <icon-paste />
        <span>粘贴</span>
      </div>
    </div>
    <div class="MenuGroup">
      <div
        class="MenuItem"
        @click="handleFitView"
      >
        <icon-fullscreen />
        <span>适应视图</span>
      </div>
      <div
        class="MenuItem"
        @click="handleCenterView"
      >
        <icon-focus />
        <span>居中视图</span>
      </div>
    </div>
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
  pointToRendererPoint,
  useVueFlow,
} from '@vue-flow/core'



const props = defineProps<{
  visible: boolean
  position: {
    x: number
    y: number
  }
}>()

const emit = defineEmits<{
  close: []
}>()

const {
  addNodes,
  viewport,
  fitView,
  setCenter,
  setEdges,
  edges,
} = useVueFlow()

const {
  moduleOptions: moduleWhiteBoardOptions,
} = useWhiteBoardModule()

// 创建新节点
const handleCreateNode = async () => {
  const rendererPoint = pointToRendererPoint({
    x: props.position.x,
    y: props.position.y,
  }, viewport.value)

  const blockId = await getNewDailyNoteBlockId()
  const newNode = {
    id: generateWhiteBoardNodeId(),
    type: EN_CONSTANTS.EN_WHITE_BOARD_NODE_TYPE_PROTYLE,
    data: {
      blockId,
    },
    position: rendererPoint,
    width: moduleWhiteBoardOptions.value.cardWidthDefault,
    height: moduleWhiteBoardOptions.value.cardHeightDefault,
    connectable: true,
    draggable: true,
    selectable: true,
  }

  addNodes([newNode])
  emit('close')
}

// 创建新分组
const handleCreateFrame = () => {
  const rendererPoint = pointToRendererPoint({
    x: props.position.x,
    y: props.position.y,
  }, viewport.value)

  const newFrame = {
    id: generateWhiteBoardNodeId(),
    type: EN_CONSTANTS.EN_WHITE_BOARD_NODE_TYPE_FRAME,
    data: {
      label: '新分组',
    },
    position: rendererPoint,
    width: 400,
    height: 300,
    connectable: true,
    draggable: true,
    selectable: true,
  }

  addNodes([newFrame])
  emit('close')
}

// 创建思维导图节点
const handleCreateMindmap = async () => {
  const rendererPoint = pointToRendererPoint({
    x: props.position.x,
    y: props.position.y,
  }, viewport.value)

  // 创建中心节点(思维导图节点)
  const blockId = await getNewDailyNoteBlockId()
  const mindmapNodeId = generateWhiteBoardNodeId()

  const mindmapNode = {
    id: mindmapNodeId,
    type: EN_CONSTANTS.EN_WHITE_BOARD_NODE_TYPE_PROTYLE,
    data: {
      blockId,
      mindmap: true, // 标记为思维导图节点
      label: '新思维导图',
    },
    position: rendererPoint,
    width: 300,
    height: 150,
    connectable: true,
    draggable: true,
    selectable: true,
  }

  // 创建三个初始子节点
  const childNodes = await Promise.all([1, 2, 3].map(async (index) => {
    const childBlockId = await getNewDailyNoteBlockId()
    const childNodeId = generateWhiteBoardNodeId()
    return {
      id: childNodeId,
      type: EN_CONSTANTS.EN_WHITE_BOARD_NODE_TYPE_PROTYLE,
      data: {
        blockId: childBlockId,
        parentId: mindmapNodeId,
        mindmap: true, // 子节点也标记为思维导图节点
      },
      position: {
        x: rendererPoint.x + 200,
        y: rendererPoint.y + (index - 1) * 150,
      },
      width: 300,
      height: 150,
      connectable: true,
      draggable: true,
      selectable: true,
    }
  }))

  // 创建连接边
  const newEdges = childNodes.map((childNode) => ({
    id: generateWhiteBoardEdgeId(),
    source: mindmapNodeId,
    target: childNode.id,
    sourceHandle: 'right',
    targetHandle: 'left',
    type: EN_CONSTANTS.EN_WHITE_BOARD_EDGE_TYPE_BASE,
    data: {
      label: '',
      edgeType: 'smoothstep',
      style: 'solid',
      width: 2,
      color: 'var(--b3-theme-on-surface)',
      markerEnd: 'arrow',
    },
  }))

  // 添加所有节点和边
  addNodes([mindmapNode, ...childNodes])
  setEdges([...edges.value, ...newEdges])

  emit('close')
}

// 粘贴
const handlePaste = () => {
  // TODO: 实现粘贴功能
  emit('close')
}

// 适应视图
const handleFitView = () => {
  fitView({ duration: 800 })
  emit('close')
}

// 居中视图
const handleCenterView = () => {
  setCenter(0, 0, { duration: 800 })
  emit('close')
}
</script>

<style lang="scss" scoped>
.EnWhiteBoardContextMenu {
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

    .MenuItem {
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
}
</style>
