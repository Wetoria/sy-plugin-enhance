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
  generateWhiteBoardNodeId,
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

  const newFrame = {
    id: generateWhiteBoardNodeId(),
    type: EN_CONSTANTS.EN_WHITE_BOARD_NODE_TYPE_FRAME,
    data: {
      label: '新分组',
    },
    position,
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
  const position = project({
    x: props.clickPosition.x,
    y: props.clickPosition.y,
  })

  // 创建中心节点
  const blockId = await getNewDailyNoteBlockId()
  const mindmapNodeId = generateWhiteBoardNodeId()

  const mindmapNode = {
    id: mindmapNodeId,
    type: EN_CONSTANTS.EN_WHITE_BOARD_NODE_TYPE_PROTYLE,
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
