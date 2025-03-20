<template>
  <div
    ref="EnWhiteBoardRenderContainerRef"
    class="EnWhiteBoardRenderContainer"
  >
    <EnWhiteBoardSider
      :needSider="needSider"
      :embedBlockOptions="embedBlockOptions"
      :embedWhiteBoardConfigData="embedWhiteBoardConfigData"
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
      <div class="EnWhiteBoardControlArea EnWhiteBoardControlArea__Left">
        <EnWhiteBoardToolBar
          class="MainToolBar"
          :show-basic-controls="true"
          :show-extra-controls="true"
          @toggle-background="toggleBackground"
          @fit-view="() => rawFitView({ duration: 800 })"
          @center-view="() => setCenter(0, 0, { duration: 800 })"
        >
          <template #after>
            <slot name="topButtonGroup" />
          </template>
        </EnWhiteBoardToolBar>
      </div>
      <div class="EnWhiteBoardControlArea EnWhiteBoardControlArea__Bottom">
        <div>

        </div>
        <div>

        </div>
        <div>

        </div>
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
        :selectionKeyCode="['Shift']"
        :multiSelectionKeyCode="['Control']"
        :deleteKeyCode="['Delete', 'Backspace']"
        :selectionOnDrag="true"
        @nodeDragStart="onMoveStart"
        @nodeDrag="onMove"
        @nodeDragStop="onMoveEnd"
        @nodeClick="onNodeClick"
        @paneClick="onPaneClick"
        @paneContextMenu="onPaneContextMenu"
        @connect="onConnect"
        @connectStart="onConnectStart"
        @connectEnd="onConnectEnd"
        @edgeDoubleClick="onEdgeDoubleClick"
        @selectionDragStart="onSelectionDragStart"
        @selectionDrag="onSelectionDrag"
        @selectionDragStop="onSelectionDragStop"
        @selectionStart="onSelectionStart"
        @selectionEnd="onSelectionEnd"
        @drop="onDrop"
        @dragover="onDragover"
        @touchstart="onTouchStart"
      >
        <template #node-EnWhiteBoardNodeProtyle="node">
          <EnWhiteBoardNodeProtyle
            :whiteBoardId="props.data.whiteBoardId"
            :nodeId="node.id"
            :enWhiteBoardProtyleUtilAreaRef="EnWhiteBoardProtyleUtilAreaRef"
            @open-in-sidebar="handleOpenInSidebar"
          />
        </template>
        <template #node-EnWhiteBoardNodeMindmap="node">
          <EnWhiteBoardNodeProtyle
            :whiteBoardId="props.data.whiteBoardId"
            :nodeId="node.id"
            :enWhiteBoardProtyleUtilAreaRef="EnWhiteBoardProtyleUtilAreaRef"
            @open-in-sidebar="handleOpenInSidebar"
          />
        </template>
        <template #node-EnWhiteBoardNodeTreeCard="node">
          <EnWhiteBoardNodeTreeCard
            :nodeId="node.id"
            :isCollapsed="node.data?.isCollapsed || false"
            :displayText="getNodeDisplayText(node)"
            :isMergingToSuperBlock="node.data?.isMergingToSuperBlock || false"
            :nodeData="node.data"
            :whiteBoardConfigData="embedWhiteBoardConfigData"
            @toggle-tree-card="handleToggleTreeCard(node)"
            @show-error="showError"
          >
            <EnWhiteBoardNodeProtyle
              :whiteBoardId="props.data.whiteBoardId"
              :nodeId="node.id"
              :enWhiteBoardProtyleUtilAreaRef="EnWhiteBoardProtyleUtilAreaRef"
              @open-in-sidebar="handleOpenInSidebar"
            />
          </EnWhiteBoardNodeTreeCard>
        </template>
        <template #node-EnWhiteBoardNodeFrame="node">
          <EnWhiteBoardNodeFrame
            :whiteBoardId="props.data.whiteBoardId"
            :nodeId="node.id"
          />
        </template>
        <template #edge-EnWhiteBoardEdgeBase="edge">
          <EnWhiteBoardEdgeBase
            v-bind="edge"
            :whiteBoardConfigData="embedWhiteBoardConfigData"
            @remove-edge="handleRemoveEdge"
          />
        </template>
        <template #connection-line="connectionLineProps">
          <EnWhiteBoardEdgeBase
            v-bind="connectionLineProps"
          />
        </template>
        <template #panel>
          <div
            v-if="selectedNodes.length > 1"
            class="EnWhiteBoardMultipleSelectionToolbar"
            :style="{
              position: 'absolute',
              top: `${multipleSelectionToolbarPosition.y}px`,
              left: `${multipleSelectionToolbarPosition.x}px`,
              transform: `translate(-50%, -100%) scale(${1 / (viewport?.zoom || 1)})`,
              transformOrigin: 'center bottom',
              zIndex: 10,
            }"
          >
            <a-button-group>
              <a-button
                size="mini"
                @click="handleMultipleNodesDelete"
              >
                <template #icon>
                  <icon-delete />
                </template>
                删除
              </a-button>
              <a-button
                size="mini"
                @click="handleMultipleNodesDuplicate"
              >
                <template #icon>
                  <icon-copy />
                </template>
                复制
              </a-button>
              <a-button
                size="mini"
                @click="handleMultipleNodesAlignLeft"
              >
                <template #icon>
                  <icon-align-left />
                </template>
                左对齐
              </a-button>
              <a-button
                size="mini"
                @click="handleMultipleNodesAlignRight"
              >
                <template #icon>
                  <icon-align-right />
                </template>
                右对齐
              </a-button>
              <a-button
                size="mini"
                @click="handleMultipleNodesAlignTop"
              >
                <template #icon>
                  <icon-align-top />
                </template>
                上对齐
              </a-button>
              <a-button
                size="mini"
                @click="handleMultipleNodesAlignBottom"
              >
                <template #icon>
                  <icon-align-bottom />
                </template>
                下对齐
              </a-button>
            </a-button-group>
          </div>
        </template>
        <svg>
          <defs>
            <marker
              id="arrow"
              viewBox="0 0 10 10"
              refX="10"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path
                d="M 0 0 L 10 5 L 0 10 z"
                fill="var(--b3-theme-on-surface)"
              />
            </marker>
            <!-- 实心圆点 -->
            <marker
              id="circle-solid"
              viewBox="0 0 10 10"
              refX="5"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto"
            >
              <circle
                cx="5"
                cy="5"
                r="4"
                fill="var(--b3-theme-on-surface)"
              />
            </marker>
            <!-- 横线 -->
            <marker
              id="line"
              viewBox="0 0 10 10"
              refX="5"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto"
            >
              <line
                x1="5"
                y1="0"
                x2="5"
                y2="10"
                stroke="var(--b3-theme-on-surface)"
                stroke-width="2"
              />
            </marker>
            <!-- 空心圆点 -->
            <marker
              id="circle-hollow"
              viewBox="0 0 10 10"
              refX="5"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto"
            >
              <circle
                cx="5"
                cy="5"
                r="4"
                fill="var(--b3-theme-background)"
                stroke="var(--b3-theme-on-surface)"
                stroke-width="1"
              />
            </marker>
            <!-- 起点箭头 -->
            <marker
              id="arrow-start"
              viewBox="0 0 10 10"
              refX="0"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto"
            >
              <path
                d="M 10 0 L 0 5 L 10 10 z"
                fill="var(--b3-theme-on-surface)"
              />
            </marker>
          </defs>
        </svg>
        <template v-if="backgroundVariant !== 'none'">
          <!-- 网格背景 -->
          <Background
            v-if="backgroundVariant === 'lines'"
            variant="lines"
            pattern-color="var(--b3-border-color)"
            :gap="48"
            :size="1"
            :offset="[0, 0]"
          />
          <!-- 点状背景 -->
          <Background
            v-if="backgroundVariant === 'dots'"
            variant="dots"
            pattern-color="var(--b3-border-color)"
            :gap="48"
            :size="2.5"
            :offset="[0, 0]"
          />
        </template>
        <MiniMap
          :zoomable="true"
          :pannable="true"
          maskColor="transparent"
          :nodeColor="(node) => node.data?.style?.backgroundColor || 'var(--color-neutral-4)'"
          :nodeStrokeColor="(node) => node.data?.style?.backgroundColor ? 'transparent' : 'var(--b3-border-color)'"
          @nodeClick="onNodeMinimapClick"
        />
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
      :embedWhiteBoardConfigData="embedWhiteBoardConfigData"
      pos="Right"
    >
      <template #SiderTopButtonGroupBefore>
        <slot name="SiderRightTopButtonGroupBefore" />
      </template>
      <template #SiderTopButtonGroupAfter>
        <slot name="SiderRightTopButtonGroupAfter" />
      </template>

      <template v-if="embedWhiteBoardConfigData.boardOptions.selectedNodeId">
        <div class="sidebar-header">
          <div class="sidebar-title">
            {{ sidebarInfo.title || sidebarInfo.name || sidebarInfo.alias || sidebarInfo.docName || '未命名块' }}
          </div>
          <div
            v-if="sidebarInfo.docName"
            class="sidebar-doc-name"
          >
            {{ sidebarInfo.docName }}
          </div>
        </div>
        <div class="sidebar-content">
          <div class="sidebar-protyle-container">
            <EnProtyle
              :block-id="embedWhiteBoardConfigData.boardOptions.selectedBlockId"
              disableEnhance
              @after="afterSidebarProtyleLoad"
            />
            <div
              ref="sidebarProtyleUtilAreaRef"
              class="sidebar-protyle-util-area"
              :data-whiteboard-node-protyle-util-area="embedWhiteBoardConfigData.boardOptions.selectedNodeId"
            />
          </div>
        </div>
      </template>
      <template v-else>
        <EnWhiteBoardSettings
          :whiteBoardId="props.data.whiteBoardId"
          :nodeId="props.data.nodeId"
        />
      </template>

      <template #SiderBottomButtonGroupBefore>
        <slot name="SiderRightBottomButtonGroupBefore" />
        <a-tooltip content="设置">
          <a-button @click="() => embedWhiteBoardConfigData.boardOptions.selectedNodeId = undefined">
            <template #icon>
              <icon-settings />
            </template>
          </a-button>
        </a-tooltip>
      </template>
      <template #SiderBottomButtonGroupAfter>
        <slot name="SiderRightBottomButtonGroupAfter" />
      </template>
    </EnWhiteBoardSider>

    <!-- 添加上下文菜单 -->
    <Teleport to="body">
      <EnWhiteBoardContextMenu
        :visible="contextMenuVisible"
        :position="contextMenuPosition"
        :click-position="initialClickPosition"
        @close="closeContextMenu"
      />
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { request } from '@/api'
import EnProtyle from '@/components/EnProtyle.vue'
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
import EnWhiteBoardNodeFrame from '@/modules/EnWhiteBoard/EnWhiteBoardNodeFrame.vue'
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
  NodeAddChange,
  NodeChange,
  NodeMouseEvent,
  pointToRendererPoint,
  useVueFlow,
  VueFlow,
} from '@vue-flow/core'
import { MiniMap } from '@vue-flow/minimap'

import { cloneDeep } from 'lodash-es'
import { Protyle } from 'siyuan'
import {
  computed,
  onMounted,
  onUnmounted,
  ref,
  watch,
  watchEffect,
} from 'vue'
import EnWhiteBoardContextMenu from './EnWhiteBoardContextMenu.vue'
import EnWhiteBoardNodeProtyle from './EnWhiteBoardNodeProtyle.vue'
import EnWhiteBoardSettings from './EnWhiteBoardSettings.vue'
import EnWhiteBoardToolBar from './EnWhiteBoardToolBar.vue'
import EnWhiteBoardNodeTreeCard from './EnWhiteBoardNodeTreeCard.vue'
import '@vue-flow/minimap/dist/style.css'
import '@vue-flow/controls/dist/style.css'

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
  getSelectedNodes,
  onEdgesChange,
  onEdgeUpdate,
  setEdges,
  addNodes,
  removeNodes,
  removeEdges,
  setNodes,
  viewport,
  onViewportChange,
  setCenter,
  fitView: rawFitView,
  getNodes,
} = useVueFlow({
  connectOnClick: true,
})

// 计算背景变体
const backgroundVariant = computed(() => {
  // 如果使用独立背景设置，返回白板自己的设置
  if (embedWhiteBoardConfigData.value?.boardOptions.useCustomBackground) {
    return embedWhiteBoardConfigData.value.boardOptions.backgroundVariant
  }
  // 否则返回全局设置
  return moduleWhiteBoardOptions.value.backgroundVariant
})

const nodes = computed(() => embedWhiteBoardConfigData.value?.boardOptions.nodes)
const edges = computed(() => embedWhiteBoardConfigData.value?.boardOptions.edges)

const EnWhiteBoardProtyleUtilAreaRef = ref<HTMLElement | null>(null)

const EnWhiteBoardRenderContainerRef = ref<HTMLElement | null>(null)

// 计算右侧按钮组的宽度
const rightButtonGroupWidth = ref(0)
const updateRightButtonGroupWidth = () => {
  const rightButtonGroup = EnWhiteBoardRenderContainerRef.value?.querySelector('.EnWhiteBoardSider.Right .ButtonGroup')
  const settingsButton = rightButtonGroup?.querySelector('.arco-btn') as HTMLElement
  if (rightButtonGroup) {
    // 减去设置按钮的宽度，因为它在计算偏移时不需要考虑
    rightButtonGroupWidth.value = rightButtonGroup.clientWidth - (settingsButton?.offsetWidth || 0)
  }
}

// 监听右侧按钮组的变化
onMounted(() => {
  updateRightButtonGroupWidth()
  const resizeObserver = new ResizeObserver(updateRightButtonGroupWidth)
  const rightButtonGroup = EnWhiteBoardRenderContainerRef.value?.querySelector('.EnWhiteBoardSider.Right .ButtonGroup')
  if (rightButtonGroup) {
    resizeObserver.observe(rightButtonGroup)
  }
  onUnmounted(() => {
    resizeObserver.disconnect()
  })
})

// 计算是否需要偏移
const needMiniMapOffset = computed(() => {
  return embedBlockOptions.value?.SiderRightWidth < rightButtonGroupWidth.value && props.needSider
})

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
  if (!event?.target?.classList?.contains('nodrag')) {
    dragging.value = true
  }
}
const onMove = (event) => {
  if (event?.target?.classList?.contains('nodrag')) {
    // 暂时为空
  }
}
const onMoveEnd = (event) => {
  if (!event?.target?.classList?.contains('nodrag')) {
    dragging.value = false
  }
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

// 添加触摸相关变量
const lastTouchTime = ref(0)
const lastTouchX = ref(0)
const lastTouchY = ref(0)

// 创建新节点的函数
const createNewNode = (x: number, y: number) => {
  const rendererPoint = pointToRendererPoint({
    x,
    y,
  }, viewport.value)
  getNewDailyNoteBlockId().then((blockId) => {
    const newEnFlowNodeId = generateWhiteBoardNodeId()
    const newNode = {
      id: newEnFlowNodeId,
      type: EN_CONSTANTS.EN_WHITE_BOARD_NODE_TYPE_PROTYLE,
      data: {
        blockId,
      },
      // 使用转换后的坐标
      position: {
        x: rendererPoint.x,
        y: rendererPoint.y,
      },
      width: moduleWhiteBoardOptions.value.cardWidthDefault,
      height: moduleWhiteBoardOptions.value.cardHeightDefault,
      connectable: true,
      draggable: true,
      selectable: true,
    }
    addNodes([newNode])
    // 同步更新配置数据
    if (embedWhiteBoardConfigData.value) {
      embedWhiteBoardConfigData.value.boardOptions.nodes = getNodes.value
    }
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
  })
}

// 添加触摸事件处理函数
const onTouchStart = (event: TouchEvent) => {
  const touch = event.touches[0]
  const now = Date.now()
  const x = touch.clientX
  const y = touch.clientY

  // 检查是否是双击（两次点击间隔小于300ms且位置相近）
  if (now - lastTouchTime.value < 300
    && Math.abs(x - lastTouchX.value) < 30
    && Math.abs(y - lastTouchY.value) < 30) {
    // 是双击，创建新节点
    createNewNode(x, y)
  }

  // 更新最后一次触摸的时间和位置
  lastTouchTime.value = now
  lastTouchX.value = x
  lastTouchY.value = y
}

// 添加上下文菜单相关的状态
const contextMenuVisible = ref(false)
const contextMenuPosition = ref({
  x: 0,
  y: 0,
})
const initialClickPosition = ref({
  x: 0,
  y: 0,
})

// 处理画布右键点击
const onPaneContextMenu = (event: MouseEvent) => {
  event.preventDefault()
  contextMenuPosition.value = {
    x: event.clientX,
    y: event.clientY,
  }
  initialClickPosition.value = {
    x: event.offsetX,
    y: event.offsetY,
  }
  contextMenuVisible.value = true
}

// 关闭上下文菜单
const closeContextMenu = () => {
  contextMenuVisible.value = false
}

// 修改 onPaneClick 添加关闭菜单
const onPaneClick = onCountClick((count, event) => {
  hideAllHelper()
  closeContextMenu()
  if (count === 1) {
    disableLastProtyleEditable()
  } else if (count === 2) {
    createNewNode(event.offsetX, event.offsetY)
  }
})

// 监听全局点击事件关闭菜单
onMounted(() => {
  document.addEventListener('click', closeContextMenu)
})

onUnmounted(() => {
  document.removeEventListener('click', closeContextMenu)
})

onNodesChange((changes) => {
  // changes are arrays of type `NodeChange`
  console.log('onNodesChange', changes)
  hideAllHelper()

  changes.forEach((change) => {
    if (change.type === 'add') {
      // 检查节点是否为Frame且是初始创建
      const isFrameInitialCreation = 
        change.item.type === EN_CONSTANTS.EN_WHITE_BOARD_NODE_TYPE_FRAME && 
        change.item.data?.isInitialCreation === true;
      
      // 如果是初始创建的Frame，移除isInitialCreation标记
      if (isFrameInitialCreation) {
        // 移除标记，防止后续处理重复
        if (change.item.data) {
          delete change.item.data.isInitialCreation;
        }
        
        // 确保节点数组已初始化
        if (!embedWhiteBoardConfigData.value.boardOptions.nodes) {
          embedWhiteBoardConfigData.value.boardOptions.nodes = []
        }
        
        // 检查是否已存在相同ID的节点，防止重复添加
        const existingNodeIndex = embedWhiteBoardConfigData.value.boardOptions.nodes.findIndex(
          node => node.id === change.item.id
        );
        
        if (existingNodeIndex === -1) {
          // 如果不存在才添加
          embedWhiteBoardConfigData.value.boardOptions.nodes.push(change.item);
        }
      } else {
        // 对于非Frame节点或非初始创建的Frame节点，正常处理
        // 确保节点数组已初始化
        if (!embedWhiteBoardConfigData.value.boardOptions.nodes) {
          embedWhiteBoardConfigData.value.boardOptions.nodes = []
        }
        // 添加新节点
        embedWhiteBoardConfigData.value.boardOptions.nodes.push(change.item)
      }
    }
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

  // 同步更新配置数据
  if (embedWhiteBoardConfigData.value) {
    embedWhiteBoardConfigData.value.boardOptions.nodes = getNodes.value
  }
})

onEdgesChange((changes) => {
  // changes are arrays of type `EdgeChange`
  console.log('onEdgesChange', changes)
  changes.forEach((change) => {
    if (change.type === 'add') {
      // 确保边数组已初始化
      if (!embedWhiteBoardConfigData.value.boardOptions.edges) {
        embedWhiteBoardConfigData.value.boardOptions.edges = []
      }
      // 添加新边
      embedWhiteBoardConfigData.value.boardOptions.edges.push(change.item)
    } else {
      const targetEdge = edges.value.find((e) => e.id === (change as Exclude<EdgeChange, EdgeAddChange>).id)
      if (!targetEdge) {
        return
      }

      if (change.type === 'remove') {
        embedWhiteBoardConfigData.value.boardOptions.edges = edges.value.filter((e) => e.id !== change.id)
      }
    }
  })
})


const onConnect = (event) => {
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
    data: {
      label: '',
      edgeType: 'smoothstep', // 连线类型
      width: 1, // 线条粗细
      style: 'solid', // 线条样式
      animation: 'none', // 动画类型
      color: 'var(--b3-theme-on-surface)', // 线条颜色
      markerEnd: 'arrow', // 默认终点箭头
      markerStart: '', // 默认无起点箭头
    },
  }
  // 使用 setEdges 更新边的状态
  const newEdges = [...edges.value, newEdge]
  setEdges(newEdges)
  // 同步更新配置数据
  embedWhiteBoardConfigData.value.boardOptions.edges = newEdges
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

const onNodeMinimapClick = (event: NodeMouseEvent) => {
  const targetNode = findNode(event.node.id)
  if (!targetNode) return

  const x = Number(targetNode.position.x) + (Number(targetNode.width) || 0) / 2
  const y = Number(targetNode.position.y) + (Number(targetNode.height) || 0) / 2

  setCenter(x, y, { duration: 800 })
}

const onEdgeDoubleClick = (event) => {
  const edge = event.edge
  if (!edge.data) {
    edge.data = {}
  }
  if (!edge.data.label) {
    edge.data.label = '新标签'
    const newEdges = edges.value.map((e) => {
      if (e.id === edge.id) {
        return {
          ...e,
          data: edge.data,
        }
      }
      return e
    })
    setEdges(newEdges)
  }
}

const toggleBackground = () => {
  if (!embedWhiteBoardConfigData.value.boardOptions.useCustomBackground) {
    embedWhiteBoardConfigData.value.boardOptions.useCustomBackground = true
  }

  // 在 none、lines、dots 之间循环切换
  const variants = ['none', 'lines', 'dots'] as const
  const currentIndex = variants.indexOf(embedWhiteBoardConfigData.value.boardOptions.backgroundVariant || 'none')
  const nextIndex = (currentIndex + 1) % variants.length
  embedWhiteBoardConfigData.value.boardOptions.backgroundVariant = variants[nextIndex]
}

const onFitView = () => {
  rawFitView({ duration: 800 })
}

const onCenterView = () => {
  setCenter(0, 0, { duration: 800 })
}

const onSelectionDragStart = (event) => {
  console.log('onSelectionDragStart', event)
}

const onSelectionDrag = (event) => {
  console.log('onSelectionDrag', event)
}

const onSelectionDragStop = (event) => {
  console.log('onSelectionDragStop', event)
}

const onSelectionStart = (event) => {
  console.log('onSelectionStart', event)
}

const onSelectionEnd = (event) => {
  console.log('onSelectionEnd', event)
}

const selectedNodes = computed(() => getSelectedNodes.value)

// 计算多选工具栏的位置
const multipleSelectionToolbarPosition = computed(() => {
  if (selectedNodes.value.length <= 1) {
    return {
      x: 0,
      y: 0,
    }
  }

  // 计算选中节点的边界
  const bounds = selectedNodes.value.reduce((acc, node) => {
    // 需要考虑视口变换
    const x = node.position.x * (viewport.value?.zoom || 1) + (viewport.value?.x || 0)
    const y = node.position.y * (viewport.value?.zoom || 1) + (viewport.value?.y || 0)
    const width = (node.dimensions?.width || 0) * (viewport.value?.zoom || 1)
    const height = (node.dimensions?.height || 0) * (viewport.value?.zoom || 1)

    return {
      minX: Math.min(acc.minX, x),
      minY: Math.min(acc.minY, y),
      maxX: Math.max(acc.maxX, x + width),
      maxY: Math.max(acc.maxY, y + height),
    }
  }, {
    minX: Infinity,
    minY: Infinity,
    maxX: -Infinity,
    maxY: -Infinity,
  })

  // 工具栏位置在选区的顶部中间
  return {
    x: bounds.minX + (bounds.maxX - bounds.minX) / 2,
    y: bounds.minY - 16, // 向上偏移一些距离
  }
})

// 多选操作处理函数
const handleMultipleNodesDelete = () => {
  removeNodes(selectedNodes.value)
}

const handleMultipleNodesDuplicate = () => {
  const newNodes = selectedNodes.value.map((node) => ({
    ...node,
    id: generateWhiteBoardNodeId(),
    position: {
      x: node.position.x + 50,
      y: node.position.y + 50,
    },
    selected: true,
  }))
  addNodes(newNodes)
}

const handleMultipleNodesAlignLeft = () => {
  if (selectedNodes.value.length <= 1) return
  const minX = Math.min(...selectedNodes.value.map((node) => node.position.x))
  selectedNodes.value.forEach((node) => {
    node.position.x = minX
  })
}

const handleMultipleNodesAlignRight = () => {
  if (selectedNodes.value.length <= 1) return
  const maxX = Math.max(...selectedNodes.value.map((node) =>
    node.position.x + (node.dimensions?.width || 0),
  ))
  selectedNodes.value.forEach((node) => {
    node.position.x = maxX - (node.dimensions?.width || 0)
  })
}

const handleMultipleNodesAlignTop = () => {
  if (selectedNodes.value.length <= 1) return
  const minY = Math.min(...selectedNodes.value.map((node) => node.position.y))
  selectedNodes.value.forEach((node) => {
    node.position.y = minY
  })
}

const handleMultipleNodesAlignBottom = () => {
  if (selectedNodes.value.length <= 1) return
  const maxY = Math.max(...selectedNodes.value.map((node) =>
    node.position.y + (node.dimensions?.height || 0),
  ))
  selectedNodes.value.forEach((node) => {
    node.position.y = maxY - (node.dimensions?.height || 0)
  })
}

// 添加拖拽事件处理
const onDragover = (event: DragEvent) => {
  event.preventDefault()
}

const onDrop = async (event: DragEvent) => {
  event.preventDefault()

  // 获取拖拽的位置并考虑视口变换
  const rendererPoint = pointToRendererPoint({
    x: event.offsetX,
    y: event.offsetY,
  }, viewport.value)

  // 1. 从文档树拖拽
  const fileData = event.dataTransfer?.getData('application/siyuan-file')
  if (fileData) {
    const fileIds = fileData.split(',').filter(Boolean)
    for (const id of fileIds) {
      try {
        const response = await request('/api/block/getRefText', { id })
        if (response) {
          const newNode = {
            id: generateWhiteBoardNodeId(),
            type: EN_CONSTANTS.EN_WHITE_BOARD_NODE_TYPE_PROTYLE,
            position: {
              x: rendererPoint.x,
              y: rendererPoint.y + (fileIds.indexOf(id) * 10), // 堆叠效果
            },
            data: {
              blockId: id,
            },
            width: moduleWhiteBoardOptions.value.cardWidthDefault,
            height: moduleWhiteBoardOptions.value.cardHeightDefault,
            // 确保新节点可以被连线
            connectable: true,
            // 设置可拖拽和选择
            draggable: true,
            selectable: true,
          }
          // 使用 addNodes 而不是直接修改 nodes.value
          addNodes([newNode])
          // 同步更新配置数据
          if (embedWhiteBoardConfigData.value) {
            embedWhiteBoardConfigData.value.boardOptions.nodes = getNodes.value
          }
        }
      } catch (err) {
        console.error('处理文件ID时出错:', err)
      }
    }
    return
  }

  // 2. 从编辑器拖拽块 - 通过 gutter
  const gutterData = event.dataTransfer?.getData('application/siyuan-gutter')
  if (gutterData) {
    const [type, subtype, blockId] = gutterData.split('\u200B')
    if (blockId) {
      try {
        const response = await request('/api/block/getRefText', { id: blockId })
        if (response) {
          const newNode = {
            id: generateWhiteBoardNodeId(),
            type: EN_CONSTANTS.EN_WHITE_BOARD_NODE_TYPE_PROTYLE,
            position: rendererPoint,
            data: {
              blockId,
            },
            width: moduleWhiteBoardOptions.value.cardWidthDefault,
            height: moduleWhiteBoardOptions.value.cardHeightDefault,
            connectable: true,
            draggable: true,
            selectable: true,
          }
          addNodes([newNode])
          // 同步更新配置数据
          if (embedWhiteBoardConfigData.value) {
            embedWhiteBoardConfigData.value.boardOptions.nodes = getNodes.value
          }
        }
      } catch (err) {
        console.error('处理gutter块ID时出错:', err)
      }
    }
    return
  }

  // 3. 从编辑器内容区域拖拽块
  const gutterNodeType = event.dataTransfer?.types.find((type) =>
    type.startsWith('application/siyuan-gutternode'),
  )
  if (gutterNodeType) {
    const blockIdMatch = gutterNodeType.match(/gutternode.*?(\d{14}-\w{7})/)
    const blockId = blockIdMatch?.[1]
    if (blockId) {
      try {
        const response = await request('/api/block/getRefText', { id: blockId })
        if (response) {
          const newNode = {
            id: generateWhiteBoardNodeId(),
            type: EN_CONSTANTS.EN_WHITE_BOARD_NODE_TYPE_PROTYLE,
            position: rendererPoint,
            data: {
              blockId,
            },
            width: moduleWhiteBoardOptions.value.cardWidthDefault,
            height: moduleWhiteBoardOptions.value.cardHeightDefault,
            connectable: true,
            draggable: true,
            selectable: true,
          }
          addNodes([newNode])
          // 同步更新配置数据
          if (embedWhiteBoardConfigData.value) {
            embedWhiteBoardConfigData.value.boardOptions.nodes = getNodes.value
          }
        }
      } catch (err) {
        console.error('处理编辑器内容区域块ID时出错:', err)
      }
    }
  }
}

// 添加侧边栏状态
const sidebarInfo = ref({
  nodeId: '',
  blockId: '',
  title: '',
  name: '',
  alias: '',
  type: '',
  content: '',
  docName: '',
})

// 处理打开侧边栏
const handleOpenInSidebar = (nodeId: string, blockId: string, info: any) => {
  // 更新侧边栏信息
  sidebarInfo.value = {
    nodeId,
    blockId,
    ...info,
  }

  // 打开右侧栏
  embedBlockOptions.value.SiderRightShow = true
  embedBlockOptions.value.SiderRightWidth = moduleWhiteBoardOptions.value.siderRightWidthDefault

  // 存储当前选中的节点信息
  embedWhiteBoardConfigData.value.boardOptions.selectedNodeId = nodeId
  embedWhiteBoardConfigData.value.boardOptions.selectedBlockId = blockId
}

// 添加切换侧边栏内容的处理函数
const handleToggleSidebarContent = () => {
  if (embedWhiteBoardConfigData.value.boardOptions.selectedNodeId) {
    // 如果当前显示的是节点内容,切换到设置面板
    embedWhiteBoardConfigData.value.boardOptions.selectedNodeId = undefined
    embedWhiteBoardConfigData.value.boardOptions.selectedBlockId = undefined
  } else {
    // 如果当前显示的是设置面板,尝试恢复上一次查看的节点
    const selectedNodes = getSelectedNodes.value
    if (selectedNodes.length === 1) {
      const lastSelectedNode = selectedNodes[0]
      embedWhiteBoardConfigData.value.boardOptions.selectedNodeId = lastSelectedNode.id
      embedWhiteBoardConfigData.value.boardOptions.selectedBlockId = lastSelectedNode.data.blockId
    }
  }
}

const handleShowSelectedNode = () => {
  const selectedNodes = getSelectedNodes.value
  if (selectedNodes.length === 1) {
    const lastSelectedNode = selectedNodes[0]
    embedWhiteBoardConfigData.value.boardOptions.selectedNodeId = lastSelectedNode.id
    embedWhiteBoardConfigData.value.boardOptions.selectedBlockId = lastSelectedNode.data.blockId
  }
}

// 添加侧边栏 Protyle 相关状态
const sidebarProtyleRef = ref<Protyle | null>(null)
const sidebarProtyleUtilAreaRef = ref<HTMLDivElement | null>(null)

// 添加侧边栏 Protyle 加载后的处理函数
const afterSidebarProtyleLoad = (protyle: Protyle) => {
  sidebarProtyleRef.value = protyle

  // 移动工具区域到指定容器
  targetProtyleUtilClassList.forEach((className) => {
    const target = protyle.protyle.element.querySelector(`.${className}`)
    if (target) {
      sidebarProtyleUtilAreaRef.value?.appendChild(target)
    }
  })
}

// 添加工具区域类名列表
const targetProtyleUtilClassList = [
  'protyle-gutters',
  'protyle-select',
  'protyle-toolbar',
  'protyle-hint',
]

// 添加获取节点显示文本的函数
const getNodeDisplayText = (node) => {
  // 尝试从节点数据中获取显示文本
  if (node.data?.displayText) {
    return node.data.displayText
  }
  
  // 如果没有显示文本，尝试获取节点ID的简短版本
  const blockId = node.data?.blockId
  if (blockId) {
    return blockId.substring(0, 8) + '...'
  }
  
  // 默认返回节点ID的简短版本
  return node.id.substring(0, 8) + '...'
}

// 添加处理树形卡片切换的函数
const handleToggleTreeCard = (node) => {
  // 切换节点的折叠状态
  const nodes = getNodes.value
  const updatedNodes = nodes.map((n) => {
    if (n.id === node.id) {
      return {
        ...n,
        data: {
          ...n.data,
          isCollapsed: !n.data?.isCollapsed,
        },
      }
    }
    return n
  })
  
  // 使用Vue Flow的setNodes函数更新节点
  setNodes(updatedNodes)
  
  // 更新配置数据
  if (embedWhiteBoardConfigData.value) {
    embedWhiteBoardConfigData.value.boardOptions.nodes = updatedNodes
  }
}

// 添加显示错误的函数
const showError = (message) => {
  // 使用控制台显示错误
  console.error(message)
}

// 添加处理removeEdge事件的函数
const handleRemoveEdge = (edgeId) => {
  if (!edgeId) return
  
  // 使用Vue Flow提供的removeEdges函数删除边
  const edgeToRemove = edges.value.find(edge => edge.id === edgeId)
  if (edgeToRemove) {
    removeEdges([edgeToRemove])
    
    // 确保数据层面也删除了边
    embedWhiteBoardConfigData.value.boardOptions.edges = edges.value.filter(edge => edge.id !== edgeId)
  }
}
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
    margin: var(--en-gap);
    margin-bottom: v-bind("needMiniMapOffset ? 'calc(var(--en-gap) * 2 + 24px + var(--en-gap))' : 'var(--en-gap)'");
    transition: margin-bottom 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    border-radius: var(--b3-border-radius);
    background-color: var(--b3-theme-surface);
    border: 1px solid var(--b3-border-color);
    box-shadow: 0 0 8px rgba(0, 0, 0, 0.1);
    opacity: 0.85;

    &:hover {
      opacity: 1;
    }

    .vue-flow__minimap-mask {
      fill: var(--b3-theme-background);
      opacity: 0.4;
      pointer-events: none;
      stroke: var(--b3-theme-primary);
      stroke-width: 2;
    }

    .vue-flow__minimap-node {
      /*fill: currentColor;*/
      stroke: currentColor;
      stroke-width: 1;
      cursor: pointer;
      opacity: 0.3;

      &:hover {
        opacity: 1;
      }
    }
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

  .EnWhiteBoardControlArea__Left {
    left: var(--en-gap);
    top: 50%;
    transform: translateY(-50%);
    width: auto;
    height: auto;
    flex-direction: column;
    gap: var(--en-gap);

    .MainToolBar {
      opacity: 0.85;
      transition: opacity 0.15s ease;

      &:hover {
        opacity: 1;
      }
    }
  }

  .EnWhiteBoardControlArea__Bottom {
    bottom: 0;
    left: 0;
    width: 100%;
    height: var(--en-white-board-control-vertical-height);

    justify-content: space-between;
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

  :deep(.EnWhiteBoardControls) {
    background: var(--b3-theme-surface);
    border: 1px solid var(--b3-border-color);
    border-radius: var(--b3-border-radius);
    box-shadow: 0 0 8px rgba(0, 0, 0, 0.1);
    padding: 4px;
    margin-left: var(--en-gap);
    position: absolute;
    left: var(--en-gap);
    top: 50%;
    transform: translateY(-50%);
    display: flex;
    flex-direction: column;
    gap: 4px;

    .vue-flow__controls-button {
      background: var(--b3-theme-background);
      border: none;
      color: var(--b3-theme-on-surface);
      width: 24px;
      height: 24px;
      padding: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;

      &:hover {
        background: var(--b3-theme-surface-light);
      }

      svg {
        width: 14px;
        height: 14px;
      }
    }
  }

  :deep(.EnWhiteBoardToolbar) {
    margin-bottom: var(--en-gap);

    .arco-btn-group {
      background: var(--b3-theme-surface);
      border: 1px solid var(--b3-border-color);
      border-radius: var(--b3-border-radius);
      padding: 4px;
      box-shadow: 0 0 8px rgba(0, 0, 0, 0.1);
    }
  }

  :deep(.vue-flow__selection) {
    background: rgba(var(--primary-6), 0.08);
    border: 2px solid rgb(var(--primary-6));
    border-radius: var(--b3-border-radius);
  }

  :deep(.vue-flow__node.selected) {
    .EnWhiteBoardNodeProtyleContainer {
      border-color: rgb(var(--primary-6));
      box-shadow: 0 0 0 2px rgba(var(--primary-6), 0.1);
    }
  }
}

.EnWhiteBoardMultipleSelectionToolbar {
  background: var(--b3-theme-surface);
  border: 1px solid var(--b3-border-color);
  border-radius: var(--b3-border-radius);
  padding: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  pointer-events: all;
  white-space: nowrap;

  .arco-btn-group {
    display: flex;
    gap: 4px;
  }

  .arco-btn {
    padding: 0 8px;
    height: 24px;
    line-height: 24px;
    font-size: 12px;
    background-color: var(--b3-theme-background);

    &:hover {
      background-color: var(--b3-theme-surface-light);
    }

    .arco-icon {
      font-size: 14px;
    }
  }
}

.sidebar-header {
  padding: var(--en-gap);
  border-bottom: 1px solid var(--b3-border-color);
  margin-bottom: var(--en-gap);

  .sidebar-title {
    font-size: 14px;
    font-weight: bold;
    color: var(--b3-theme-on-background);
    margin-bottom: 4px;
  }

  .sidebar-doc-name {
    font-size: 12px;
    color: var(--b3-theme-on-surface);
  }
}

.sidebar-content {
  flex: 1;
  overflow: hidden;
  position: relative;
  display: flex;
  flex-direction: column;
  padding: var(--en-gap);
  box-sizing: border-box;

  .sidebar-protyle-container {
    position: relative;
    height: 100%;
    width: 100%;
    overflow: hidden;
    border: 1px solid var(--b3-border-color);
    border-radius: var(--b3-border-radius);
    background-color: var(--b3-theme-background);

    :deep(.protyle) {
      height: 100%;

      .protyle-content {
        padding: var(--en-gap);
      }

      .protyle-wysiwyg {
        padding-bottom: 16px !important;
      }
    }
  }
}

.sidebar-protyle-util-area {
  position: absolute;
  z-index: 4;
  top: 0;
  left: 0;
  height: 0;
  pointer-events: none;

  :deep(*) {
    pointer-events: auto;
  }
}
</style>
