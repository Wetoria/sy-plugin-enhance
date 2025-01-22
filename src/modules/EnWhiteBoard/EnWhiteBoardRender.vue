<template>
  <div
    ref="EnWhiteBoardRenderContainerRef"
    class="EnWhiteBoardRenderContainer"
  >
    <EnWhiteBoardSider
      :needSider="needSider"
      :embedBlockOptions="embedBlockOptions"
      pos="Left"
    >
      <template #SiderTopButtonGroupBefore>
        <slot name="SiderLeftTopButtonGroupBefore" />
      </template>
      <template #SiderTopButtonGroupAfter>
        <slot name="SiderLeftTopButtonGroupAfter" />
      </template>

      <div>Sider Left</div>

      <template #SiderBottomButtonGroupBefore>
        <slot name="SiderLeftBottomButtonGroupBefore" />
      </template>
      <template #SiderBottomButtonGroupAfter>
        <slot name="SiderLeftBottomButtonGroupAfter" />
      </template>
    </EnWhiteBoardSider>

    <div class="EnWhiteBoardContentContainer">
      <!-- {{ data.whiteBoardId }} - {{ data.nodeId }} -->
      <div class="EnWhiteBoardControlArea EnWhiteBoardControlArea__Top">
        <a-button-group
          class="FullScreenButtonGroup"
        >
          <slot name="topButtonGroup" />
        </a-button-group>
      </div>
      <div class="EnWhiteBoardControlArea EnWhiteBoardControlArea__Bottom">
        <div>

        </div>
        <div>

        </div>
        <div>

        </div>
      </div>
      <div class="EnWhiteBoardControlArea EnWhiteBoardControlArea__Left">
      </div>
      <div class="EnWhiteBoardControlArea EnWhiteBoardControlArea__Right">
      </div>
      <VueFlow
        v-if="embedWhiteBoardConfigData.loaded"
        v-model:nodes="nodes"
        v-model:edges="edges"
        :defaultViewport="embedWhiteBoardConfigData.boardOptions.viewport"
        :zoom-on-scroll="false"
        :snap-to-grid="isCtrlPressed"
        :snapGrid="[48, 48]"
        :zoom-on-double-click="false"
        :minZoom="0.075"
        :translateExtent="[[-Infinity, -Infinity], [Infinity, Infinity]]"
        :edge-updater-radius="24"
        :connectionRadius="100"
        :fitView="false"
        :panOnDrag="true"
        @nodeDragStart="onMoveStart"
        @nodeDrag="onMove"
        @nodeDragStop="onMoveEnd"
        @nodeClick="onNodeClick"
        @paneClick="onPaneClick"
        @connect="onConnect"
        @connectStart="onConnectStart"
        @connectEnd="onConnectEnd"
      >
        <template #node-EnWhiteBoardNodeProtyle="node">
          <EnWhiteBoardNodeProtyle
            :nodeProps="node"
            :enWhiteBoardProtyleUtilAreaRef="EnWhiteBoardProtyleUtilAreaRef"
          />
        </template>
        <template #edge-EnWhiteBoardEdgeBase="edge">
          <EnWhiteBoardEdgeBase
            v-bind="edge"
          />
        </template>
        <template #connection-line="connectionLineProps">
          <EnWhiteBoardEdgeBase
            v-bind="connectionLineProps"
          />
        </template>
        <Background
          variant="dots"
          pattern-color="var(--b3-border-color)"
          :gap="48"
          :size="2.5"
          :offset="{
            x: 0, y: 0,
          }"
        />
        <MiniMap />
      </VueFlow>
      <div
        ref="EnWhiteBoardProtyleUtilAreaRef"
        class="EnWhiteBoardProtyleUtilArea"
        :class="{
          dragging,
        }"
        style="height: 0px;"
      >

      </div>
    </div>


    <EnWhiteBoardSider
      :needSider="needSider"
      :embedBlockOptions="embedBlockOptions"
      pos="Right"
    >
      <template #SiderTopButtonGroupBefore>
        <slot name="SiderRightTopButtonGroupBefore" />
      </template>
      <template #SiderTopButtonGroupAfter>
        <slot name="SiderRightTopButtonGroupAfter" />
      </template>

      <div>Sider Right</div>

      <template #SiderBottomButtonGroupBefore>
        <slot name="SiderRightBottomButtonGroupBefore" />
      </template>
      <template #SiderBottomButtonGroupAfter>
        <slot name="SiderRightBottomButtonGroupAfter" />
      </template>
    </EnWhiteBoardSider>
  </div>
</template>

<script setup lang="ts">
import { getNewDailyNoteBlockId } from '@/modules/DailyNote/DailyNote'


import {
  EnWhiteBoardBlockDomTarget,
  generateWhiteBoardEdgeId,
  generateWhiteBoardNodeId,
  getWhiteBoardCardMainByWhiteBoardNodeId,
  getWhiteBoardConfigRefById,
  useWhiteBoardModule,
} from '@/modules/EnWhiteBoard/EnWhiteBoard'

import EnWhiteBoardEdgeBase from '@/modules/EnWhiteBoard/EnWhiteBoardEdgeBase.vue'
import EnWhiteBoardSider from '@/modules/EnWhiteBoard/EnWhiteBoardSider.vue'
import { EN_CONSTANTS } from '@/utils/Constants'
import {
  handleWith,
  onCountClick,
} from '@/utils/DOM'
import {
  hideHelperByTarget,
  SyDomNodeTypes,
} from '@/utils/Siyuan'
import { Background } from '@vue-flow/background'
import {
  Edge,
  EdgeAddChange,
  EdgeChange,
  MarkerType,
  NodeAddChange,
  NodeChange,
  pointToRendererPoint,
  useVueFlow,
  VueFlow,
} from '@vue-flow/core'
import { MiniMap } from '@vue-flow/minimap'
import { cloneDeep } from 'lodash-es'
import {
  computed,
  onMounted,
  onUnmounted,
  ref,
  watch,
  watchEffect,
} from 'vue'
import EnWhiteBoardNodeProtyle from './EnWhiteBoardNodeProtyle.vue'
import '@vue-flow/minimap/dist/style.css'

const props = defineProps<{
  data: EnWhiteBoardBlockDomTarget
  needSider?: boolean
}>()

const {
  moduleOptions: moduleWhiteBoardOptions,
} = useWhiteBoardModule()

const {
  embedWhiteBoardConfigData,
  embedBlockOptions,
} = getWhiteBoardConfigRefById(props.data.whiteBoardId, props.data.nodeId)

watch(() => embedBlockOptions.value.SiderLeftWidth, () => {
  embedBlockOptions.value.SiderLeftShow = embedBlockOptions.value.SiderLeftWidth > 0
})
watch(() => embedBlockOptions.value.SiderRightWidth, () => {
  embedBlockOptions.value.SiderRightShow = embedBlockOptions.value.SiderRightWidth > 0
})


const {
  onNodesChange,
  findNode,
  addSelectedNodes,
  removeSelectedNodes,

  onEdgesChange,
  onEdgeUpdate,

  viewport,
  onViewportChange,
} = useVueFlow({
  connectOnClick: true,
})


const nodes = computed(() => embedWhiteBoardConfigData.value?.boardOptions.nodes)
const edges = computed(() => embedWhiteBoardConfigData.value?.boardOptions.edges)

const EnWhiteBoardProtyleUtilAreaRef = ref<HTMLElement | null>(null)

const EnWhiteBoardRenderContainerRef = ref<HTMLElement | null>(null)

const hideAllHelper = () => {
  hideHelperByTarget(EnWhiteBoardProtyleUtilAreaRef.value)
}

const dragging = ref(false)
const isCtrlPressed = ref(false)

// 添加键盘事件监听
const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Control') {
    isCtrlPressed.value = true
  }
}

const handleKeyUp = (event: KeyboardEvent) => {
  if (event.key === 'Control') {
    isCtrlPressed.value = false
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
  window.addEventListener('keyup', handleKeyUp)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
  window.removeEventListener('keyup', handleKeyUp)
})

const onMoveStart = (event) => {
  if (event.target.classList.contains('nodrag')) {
    return
  }
  dragging.value = true
}
const onMove = (event) => {
  if (event.target.classList.contains('nodrag')) {

  }
}
const onMoveEnd = (event) => {
  if (event.target.classList.contains('nodrag')) {
    return
  }
  dragging.value = false
}

const lastEditProtyleCardElementRef = ref<HTMLElement | null>(null)

const changeProtyleEditable = (mainElement: HTMLElement, editable: boolean) => {
  if (!mainElement) {
    return
  }

  if (editable) {
    mainElement.classList.add('nodrag')
  } else {
    mainElement.classList.remove('nodrag')
  }

  const elements = mainElement.querySelectorAll(`[data-type="${SyDomNodeTypes.NodeParagraph}"]`)
  elements?.forEach((element) => {
    const contentEditable = element.firstElementChild
    contentEditable?.setAttribute('contenteditable', `${editable}`)
  })
}
const disableLastProtyleEditable = () => {
  if (lastEditProtyleCardElementRef.value) {
    const enFlowNodeId = lastEditProtyleCardElementRef.value.dataset.enFlowNodeId

    const targetNode = findNode(enFlowNodeId)
    if (targetNode) {
      // 取消选中状态
      removeSelectedNodes([targetNode])
    }

    changeProtyleEditable(lastEditProtyleCardElementRef.value, false)
    lastEditProtyleCardElementRef.value = null
  }
}
const editNewProtyleCard = (target: HTMLElement) => {
  // 取消上一个的编辑状态
  disableLastProtyleEditable()
  // 设置当前的编辑状态
  changeProtyleEditable(target, true)
  lastEditProtyleCardElementRef.value = target
}

const onNodeClick = ({ event }) => {
  console.log('onNodeClick', event)
  const mainElement = event.target.closest('.EnWhiteBoardNodeProtyleMain')
  if (!mainElement) {
    return
  }
  if (mainElement === lastEditProtyleCardElementRef.value) {
    return
  }

  editNewProtyleCard(mainElement)
}


const onConnectStart = (event) => {
  console.log('onConnectStart', event)
}
const onConnectEnd = (event) => {
  console.log('onConnectEnd', event)
}



onViewportChange((viewport) => {
  embedWhiteBoardConfigData.value.boardOptions.viewport = viewport
  disableLastProtyleEditable()
  hideAllHelper()
})

watchEffect(() => {
  viewport.value = embedWhiteBoardConfigData.value.boardOptions.viewport
})

const onPaneClick = onCountClick((count, event) => {
  console.log('onPaneClick', count, event)
  hideAllHelper()
  if (count === 1) {
    disableLastProtyleEditable()
  } else if (count === 2) {
    const rendererPoint = pointToRendererPoint({
      x: event.offsetX,
      y: event.offsetY,
    }, viewport.value)
    getNewDailyNoteBlockId().then((blockId) => {
      const newEnFlowNodeId = generateWhiteBoardNodeId()
      nodes.value.push({
        id: newEnFlowNodeId,
        type: EN_CONSTANTS.EN_WHITE_BOARD_NODE_TYPE_PROTYLE,
        data: {
          blockId,
        },
        connectable: true,
        position: {
          x: rendererPoint.x,
          y: rendererPoint.y,
        },
        width: moduleWhiteBoardOptions.value.cardWidthDefault,
        height: moduleWhiteBoardOptions.value.cardHeightDefault,
      })
      handleWith(
        () => {
          const targetNode = getWhiteBoardCardMainByWhiteBoardNodeId(EnWhiteBoardRenderContainerRef.value, newEnFlowNodeId)
          return !!targetNode
        },
        () => {
          const targetMainElement = getWhiteBoardCardMainByWhiteBoardNodeId(EnWhiteBoardRenderContainerRef.value, newEnFlowNodeId)

          const targetNode = findNode(newEnFlowNodeId)
          addSelectedNodes([targetNode])
          if (targetMainElement) {
            editNewProtyleCard(targetMainElement)
          }
        },
      )
    },
    )
  }
})

onNodesChange((changes) => {
  // changes are arrays of type `NodeChange`
  console.log('onNodesChange', changes)
  hideAllHelper()

  changes.forEach((change) => {

    if (change.type !== 'add') {
      const targetNode = nodes.value.find((node) => node.id === (change as Exclude<NodeChange, NodeAddChange>).id)
      if (!targetNode) {
        return
      }
      if (change.type === 'dimensions') {
        if (change.dimensions) {
          targetNode.width = change.dimensions.width
          targetNode.height = change.dimensions.height
        }
      }
      if (change.type === 'position') {
        if (change.position) {
          targetNode.position.x = change.position.x
          targetNode.position.y = change.position.y
        }
      }
      if (change.type === 'remove') {
        embedWhiteBoardConfigData.value.boardOptions.nodes = nodes.value.filter((node) => node.id !== change.id)
      }
    }
  })
})

onEdgesChange((changes) => {
  // changes are arrays of type `EdgeChange`
  console.log('onEdgesChange', changes)
  changes.forEach((change) => {
    const targetEdge = edges.value.find((e) => e.id === (change as Exclude<EdgeChange, EdgeAddChange>).id)
    if (!targetEdge) {
      return
    }

    if (change.type === 'remove') {
      embedWhiteBoardConfigData.value.boardOptions.edges = edges.value.filter((e) => e.id !== change.id)
    }
  })
})


const onConnect = (event) => {
  // TODO 需要去重一下
  const newEdge: Edge = {
    id: generateWhiteBoardEdgeId(),
    type: EN_CONSTANTS.EN_WHITE_BOARD_EDGE_TYPE_BASE,
    source: event.source,
    target: event.target,
    sourceHandle: event.sourceHandle,
    targetHandle: event.targetHandle,
    updatable: true,
    deletable: true,
    focusable: true,
    selectable: true,
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 20,
      height: 20,
    },
  }
  console.log('newEdge', newEdge)
  edges.value.push(newEdge)
}

onEdgeUpdate(({
  edge,
  connection,
}) => {

  const targetEdge = edges.value.find((e) => e.id === edge.id)
  if (!targetEdge) {
    return
  }
  targetEdge.targetHandle = connection.targetHandle
  targetEdge.sourceHandle = connection.sourceHandle
  targetEdge.target = connection.target
  targetEdge.source = connection.source

  // edge.source = connection.source
  // edge.target = connection.target
  // edge.targetHandle = connection.targetHandle
  // edge.sourceHandle = connection.sourceHandle

  embedWhiteBoardConfigData.value.boardOptions.edges = cloneDeep(edges.value)
})

watchEffect(() => {
  console.log('nodes is ', nodes.value)
  console.log('edges is ', edges.value)
})
</script>

<style lang="scss" scoped>
.EnWhiteBoardRenderContainer {
  width: 100%;
  height: 100%;
  position: relative;
  display: flex;
  z-index: 0;

  :deep(.vue-flow__minimap) {
    transform: scale(0.8);
    transform-origin: bottom right;
    margin: 16px;
    border-radius: var(--b3-border-radius);
    background-color: var(--b3-theme-surface);
  }

  :deep(.vue-flow__background) {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;
    will-change: transform;
    transform: none !important;
    backface-visibility: hidden;
    perspective: 1000;
    z-index: 0;
  }

  :deep(.vue-flow__pane) {
    z-index: 1;
    transform-style: preserve-3d;
  }

  .EnWhiteBoardContentContainer {
    flex: 1;

    position: relative;

    .FullScreenButtonGroup {
      opacity: 0;
    }
    &:hover .FullScreenButtonGroup {
      opacity: 1;
    }
  }

  .EnWhiteBoardControlArea {
    position: absolute;
    z-index: 2;
    --en-white-board-control-vertical-height: 30px;
    --en-white-board-control-horizontal-width: 30px;
    box-sizing: border-box;

    display: flex;

    padding: var(--b3-border-radius);
    pointer-events: none;
  }

  .EnWhiteBoardControlArea__Top {
    top: 0;
    left: 0;
    width: 100%;
    height: var(--en-white-board-control-vertical-height);

    justify-content: flex-end;
    align-items: center;

  }
  .EnWhiteBoardControlArea__Bottom {
    bottom: 0;
    left: 0;
    width: 100%;
    height: var(--en-white-board-control-vertical-height);

    justify-content: space-between;
  }
  .EnWhiteBoardControlArea__Left {
    left: 0;
    top: var(--en-white-board-control-vertical-height);
    width: var(--en-white-board-control-horizontal-width);
    height: calc(100% - var(--en-white-board-control-vertical-height) * 2);

    flex-direction: column;
  }
  .EnWhiteBoardControlArea__Right {
    right: 0;
    top: var(--en-white-board-control-vertical-height);
    width: var(--en-white-board-control-horizontal-width);
    height: calc(100% - var(--en-white-board-control-vertical-height) * 2);

    flex-direction: column;
  }

  .EnWhiteBoardProtyleUtilArea {
    &.dragging {
      opacity: 0;
    }
  }

  :deep(.arco-btn-secondary[type="button"]) {
    background-color: var(--b3-theme-background);

    &:hover {
      background-color: var(--b3-theme-surface);
    }
  }
}
</style>
