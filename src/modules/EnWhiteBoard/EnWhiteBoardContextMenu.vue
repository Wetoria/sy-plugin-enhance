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
      <div
        class="MenuItem"
        @click="handleCreateTreeCard"
      >
        <icon-apps />
        <span>新建树形卡片</span>
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
  generateWhiteBoardNodeId,
  generateWhiteBoardEdgeId,
  useWhiteBoardModule,
} from '@/modules/EnWhiteBoard/EnWhiteBoard'
import { EN_CONSTANTS } from '@/utils/Constants'
import {
  useVueFlow,
} from '@vue-flow/core'



const props = defineProps<{
  visible: boolean
  position: {
    x: number
    y: number
  }
  clickPosition: {
    x: number
    y: number
  }
}>()

const emit = defineEmits<{
  close: []
}>()

const {
  addNodes,
  addEdges,
  viewport,
  fitView,
  setCenter,
  setEdges,
  edges,
  project,
} = useVueFlow()

const {
  moduleOptions: moduleWhiteBoardOptions,
} = useWhiteBoardModule()

// 创建新节点
const handleCreateNode = async () => {
  const position = project({
    x: props.clickPosition.x,
    y: props.clickPosition.y,
  })

  const blockId = await getNewDailyNoteBlockId()
  const newNode = {
    id: generateWhiteBoardNodeId(),
    type: EN_CONSTANTS.EN_WHITE_BOARD_NODE_TYPE_PROTYLE,
    data: {
      blockId,
    },
    position,
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
  const position = project({
    x: props.clickPosition.x,
    y: props.clickPosition.y,
  })

  // 生成唯一ID
  const frameId = generateWhiteBoardNodeId()

  // 定义Frame的尺寸
  const frameWidth = 400;
  const frameHeight = 300;

  const newFrame = {
    id: frameId,
    type: EN_CONSTANTS.EN_WHITE_BOARD_NODE_TYPE_FRAME,
    data: {
      label: '新分组',
      style: {
        backgroundColor: 'var(--b3-theme-surface-light)',
      },
      // 添加一个标记，表示此节点是由handleCreateFrame创建的
      isInitialCreation: true,
    },
    position,
    // 使用dimensions属性设置尺寸
    dimensions: {
      width: frameWidth,
      height: frameHeight,
    },
    // 同时也设置width和height属性以确保Vue Flow正确处理
    width: frameWidth,
    height: frameHeight,
    connectable: true,
    draggable: true,
    selectable: true,
  }

  // 添加节点
  addNodes([newFrame])
  emit('close')
}

// 创建思维导图节点
const handleCreateMindmap = async () => {
  const position = project({
    x: props.clickPosition.x,
    y: props.clickPosition.y,
  })

  // 创建中心节点
  const blockId = await getNewDailyNoteBlockId()
  const mindmapNodeId = generateWhiteBoardNodeId()

  const mindmapNode = {
    id: mindmapNodeId,
    type: 'EnWhiteBoardNodeMindmap',
    data: {
      blockId,
      mindmap: true,
      label: '新思维导图',
    },
    position,
    width: moduleWhiteBoardOptions.value.cardWidthDefault,
    height: moduleWhiteBoardOptions.value.cardHeightDefault,
    connectable: true,
    draggable: true,
    selectable: true,
  }

  // 先添加中心节点
  addNodes([mindmapNode])

  // 创建三个子节点
  const nodeSpacing = 150 // 节点之间的垂直间距
  const horizontalSpacing = 100 // 节点之间的水平间距
  const parentRightEdge = position.x + moduleWhiteBoardOptions.value.cardWidthDefault // 使用父节点实际宽度

  // 计算子节点的总高度和起始位置
  const totalHeight = 2 * nodeSpacing // 两个间距，三个节点
  const startY = position.y - (totalHeight / 2)

  // 创建子节点
  const childNodes = await Promise.all([0, 1, 2].map(async (index) => {
    const childBlockId = await getNewDailyNoteBlockId()
    return {
      id: generateWhiteBoardNodeId(),
      type: EN_CONSTANTS.EN_WHITE_BOARD_NODE_TYPE_PROTYLE,
      data: {
        blockId: childBlockId,
        parentId: mindmapNodeId,
        mindmap: true,
      },
      position: {
        x: parentRightEdge + horizontalSpacing,
        y: startY + (index * nodeSpacing),
      },
      width: moduleWhiteBoardOptions.value.cardWidthDefault,
      height: moduleWhiteBoardOptions.value.cardHeightDefault,
      connectable: true,
      draggable: true,
      selectable: true,
    }
  }))

  // 添加子节点
  addNodes(childNodes)

  emit('close')
}

// 创建树形卡片节点
const handleCreateTreeCard = async () => {
  try {
    const position = project({
      x: props.clickPosition.x,
      y: props.clickPosition.y,
    })
    
    // 创建根节点
    const blockId = await getNewDailyNoteBlockId()
    const treeCardNodeId = generateWhiteBoardNodeId()
    
    const treeCardNode = {
      id: treeCardNodeId,
      type: EN_CONSTANTS.EN_WHITE_BOARD_NODE_TYPE_TREECARD,
      data: {
        blockId,
        treecard: true,
      },
      position,
      width: moduleWhiteBoardOptions.value.cardWidthDefault,
      height: moduleWhiteBoardOptions.value.cardHeightDefault,
      connectable: true,
      draggable: true,
      selectable: true,
    }
    
    addNodes([treeCardNode])
    
    // 创建子节点
    const childBlockId = await getNewDailyNoteBlockId()
    const childNodeId = generateWhiteBoardNodeId()
    
    const childNode = {
      id: childNodeId,
      type: EN_CONSTANTS.EN_WHITE_BOARD_NODE_TYPE_PROTYLE,
      data: {
        blockId: childBlockId,
        parentId: treeCardNodeId,
        treecard: true,
      },
      position: {
        x: position.x,
        y: position.y + moduleWhiteBoardOptions.value.cardHeightDefault + 30,
      },
      width: moduleWhiteBoardOptions.value.cardWidthDefault,
      height: moduleWhiteBoardOptions.value.cardHeightDefault,
      connectable: true,
      draggable: true,
      selectable: true,
    }
    
    const edge = {
      id: generateWhiteBoardEdgeId(),
      type: EN_CONSTANTS.EN_WHITE_BOARD_EDGE_TYPE_BASE,
      source: treeCardNodeId,
      target: childNodeId,
      sourceHandle: 'bottom',
      targetHandle: 'left',
      data: {
        label: '',
        edgeType: 'bezier',
        width: 2,
        style: 'solid',
        color: 'var(--b3-font-background1)',
        markerEnd: undefined,
        markerStart: undefined,
      },
    }
    
    addNodes([childNode])
    addEdges([edge])
  } catch (error) {
    console.error('Error creating TreeCard:', error)
  }
  
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
