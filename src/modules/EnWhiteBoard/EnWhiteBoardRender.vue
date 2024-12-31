<template>
  <div
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
        snap-to-grid
        :zoom-on-double-click="false"
        :minZoom="0.2"
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
      </VueFlow>
      <div
        ref="EnWhiteBoardProtyleUtilAreaRef"
        class="EnWhiteBoardProtyleUtilArea"
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
import { getNewDailyNoteBlockId } from '@/modules/DailyNote/DailyNote.vue'


import {
  EnWhiteBoardBlockDomTarget,
  generateWhiteBoardEdgeId,
  generateWhiteBoardNodeId,
  getWhiteBoardConfigRefById,
  useWhiteBoardModule,
} from '@/modules/EnWhiteBoard/EnWhiteBoard'

import EnWhiteBoardSider from '@/modules/EnWhiteBoard/EnWhiteBoardSider.vue'
import { EN_CONSTANTS } from '@/utils/Constants'
import { onCountClick } from '@/utils/DOM'
import { SyDomNodeTypes } from '@/utils/Siyuan'
import {
  EdgeAddChange,
  EdgeChange,
  NodeAddChange,
  NodeChange,
  pointToRendererPoint,
  useVueFlow,
  VueFlow,
} from '@vue-flow/core'
import lodash from 'lodash'
import {
  computed,
  ref,
  watch,
  watchEffect,
} from 'vue'
import EnWhiteBoardNodeProtyle from './EnWhiteBoardNodeProtyle.vue'

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
// TODO 移动时，需要隐藏所有的 gutter/toolbar/hint

const onMoveStart = (event) => {
  console.log('onMoveStart', event)
}
const onMove = (event) => {
  console.log('onMove', event)
}
const onMoveEnd = (event) => {
  console.log('onMoveEnd', event)
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

const onNodeClick = ({ event }) => {
  console.log('onNodeClick', event)
  const mainElement = event.target.closest('.EnWhiteBoardNodeProtyleMain')
  if (!mainElement) {
    return
  }
  if (mainElement === lastEditProtyleCardElementRef.value) {
    return
  }

  // 取消上一个的编辑状态
  disableLastProtyleEditable()
  // 设置当前的编辑状态
  changeProtyleEditable(mainElement, true)

  lastEditProtyleCardElementRef.value = mainElement
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
})

watchEffect(() => {
  viewport.value = embedWhiteBoardConfigData.value.boardOptions.viewport
})

const onPaneClick = onCountClick((count, event) => {
  console.log('onPaneClick', count, event)
  if (count === 1) {
    disableLastProtyleEditable()
  } else if (count === 2) {
    const rendererPoint = pointToRendererPoint({
      x: event.offsetX,
      y: event.offsetY,
    }, viewport.value)
    getNewDailyNoteBlockId('\n{: style=\"\" }\n{: style=\"\" }').then((blockId) => {
      nodes.value.push({
        id: generateWhiteBoardNodeId(),
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
    })
  }
})

onNodesChange((changes) => {
  // changes are arrays of type `NodeChange`
  console.log('onNodesChange', changes)

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
  edges.value.push({
    id: generateWhiteBoardEdgeId(),
    source: event.source,
    target: event.target,
    updatable: true,
    deletable: true,
    focusable: true,
    selectable: true,
  })
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

  embedWhiteBoardConfigData.value.boardOptions.edges = lodash.cloneDeep(edges.value)
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

  :deep(.arco-btn-secondary[type="button"]) {
    background-color: var(--b3-theme-background);

    &:hover {
      background-color: var(--b3-theme-surface);
    }
  }
}
</style>
