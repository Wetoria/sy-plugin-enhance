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
      @open-in-sidebar="handleOpenInSidebar"
    />
  </NodeToolbar>
  <div
    ref="containerRef"
    class="EnWhiteBoardNodeProtyleContainer"
    :class="{
      'variant-default': !nodeData.style?.variant || nodeData.style.variant === 'default',
      'variant-card': nodeData.style?.variant === 'card',
      'variant-note': nodeData.style?.variant === 'note',
    }"
    :data-en-flow-node-id="flowNode.id"
    :style="{
      '--en-card-width': `${flowNode.dimensions.width}px`,
      '--en-card-height': `${flowNode.dimensions.height}px`,
      'backgroundColor': nodeData.style?.backgroundColor,
    }"
  >

    <div class="ProtyleToolbarArea">
      <div class="infos">

      </div>

      <div class="operations">
        <a-spin v-if="isMergingToSuperBlock">
          <template #icon>
            <icon-sync />
          </template>
        </a-spin>
      </div>
    </div>
    <div
      ref="mainRef"
      class="main EnWhiteBoardNodeProtyleMain"
      :data-en-flow-node-id="flowNode.id"
      @wheel.capture="captureWheel"
      @mousedown.capture="captureMouseDown"
      @click.capture="captureClick"
    >

      <template v-if="nodeData.blockId">
        <EnProtyle
          :block-id="nodeData.blockId"
          disableEnhance
          @after="afterProtyleLoad"
        />
        <Teleport
          v-if="enWhiteBoardProtyleUtilAreaRef"
          :to="enWhiteBoardProtyleUtilAreaRef"
        >
          <div
            ref="protyleUtilAreaRef"
            :data-en-whiteboard-node-protyle-util-area="flowNode.id"
          >

          </div>
        </Teleport>
      </template>
    </div>

    <NodeResizer
      :min-width="100"
      :min-height="36"
      color="transparent"
      @resize="onResize"
    />


    <Handle
      id="top"
      class="Handle Top"
      type="source"
      :position="Position.Top"
    >
      <div class="HandleIcon">
        <icon-arrow-up />
      </div>
    </Handle>
    <Handle
      id="bottom"
      class="Handle Bottom"
      type="source"
      :position="Position.Bottom"
    >
      <div class="HandleIcon">
        <icon-arrow-down />
      </div>
    </Handle>
    <Handle
      id="left"
      class="Handle Left"
      type="source"
      :position="Position.Left"
    >
      <div class="HandleIcon">
        <icon-arrow-left />
      </div>
    </Handle>
    <Handle
      id="right"
      class="Handle Right"
      type="source"
      :position="Position.Right"
    >
      <div class="HandleIcon">
        <icon-arrow-right />
      </div>
    </Handle>
  </div>
</template>

<script lang="ts">

</script>

<script setup lang="ts">
import EnProtyle from '@/components/EnProtyle.vue'
import {
  generateWhiteBoardNodeId,
  useWhiteBoardModule,
} from '@/modules/EnWhiteBoard/EnWhiteBoard'
import { debounce } from '@/utils'

import {
  useSiyuanDatabaseIndexCommit,
  useSiyuanEventTransactions,
} from '@/utils/EventBusHooks'
import {
  Handle,
  Position,
  useKeyPress,
  useNode,
  useVueFlow,
} from '@vue-flow/core'
import {
  NodeResizer,
  OnResize,
} from '@vue-flow/node-resizer'
import { NodeToolbar } from '@vue-flow/node-toolbar'
import { Protyle } from 'siyuan'
import {
  computed,
  onBeforeUnmount,
  onMounted,
  ref,
} from 'vue'
import EnWhiteBoardToolBar from './EnWhiteBoardToolBar.vue'

const props = defineProps<{
  enWhiteBoardProtyleUtilAreaRef: HTMLElement
}>()

const emit = defineEmits<{
  clickCard: [element: HTMLElement]
  openInSidebar: [nodeId: string, blockId: string]
}>()

const {
  moduleOptions: whiteBoardModuleOptions,
} = useWhiteBoardModule()

const {
  node: flowNode,
} = useNode()

const {
  getNodes,
  addNodes,
  removeNodes,
  getSelectedNodes,
  setNodes,
} = useVueFlow()

const nodeData = computed(() => flowNode.data)

const containerRef = ref<HTMLDivElement | null>(null)

const spaceKeyPressing = useKeyPress('Space')
const captureWheel = (event: WheelEvent) => {
  if (!event.ctrlKey && !event.altKey && !event.shiftKey && !event.metaKey && !spaceKeyPressing.value) {

    const protyleContent = mainRef.value?.querySelector('.protyle-content')

    if (!protyleContent) {
      return
    }

    const {
      scrollTop,
      scrollHeight,
      clientHeight,
    } = protyleContent
    const isAtTop = scrollTop <= 0
    const isAtBottom = scrollTop + clientHeight >= scrollHeight

    if ((event.deltaY < 0 && !isAtTop) || (event.deltaY > 0 && !isAtBottom)) {
      event.stopImmediatePropagation()
    }
  }
}

const targetProtyleUtilClassList = [
  'protyle-gutters',
  'protyle-select',
  'protyle-toolbar',
  'protyle-hint',
]
const protyleUtilAreaRef = ref<HTMLDivElement | null>(null)
const cardProtyleRef = ref<Protyle | null>(null)
const afterProtyleLoad = (protyle: Protyle) => {
  cardProtyleRef.value = protyle

  targetProtyleUtilClassList.forEach((className) => {
    const target = protyle.protyle.element.querySelector(`.${className}`)
    if (target) {
      protyleUtilAreaRef.value?.appendChild(target)
    }
  })

  // protyle?.protyle?.wysiwyg?.element?.addEventListener('mousedown', (event) => {
  //   const target = event.target as HTMLElement
  //   const mainElement = target.closest('.EnWhiteBoardNodeProtyleMain')
  //   if (mainElement && !mainElement.classList.contains('nodrag')) {
  //     event.stopImmediatePropagation()
  //     const newEvent = new MouseEvent('mousedown', {
  //       bubbles: true,
  //       cancelable: true,
  //       view: window,
  //       ...event,
  //     })
  //     mainElement.parentElement?.dispatchEvent(newEvent)
  //   }
  // }, true)
}

const captureMouseDown = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  const mainElement = target.closest('.EnWhiteBoardNodeProtyleMain')
  if (mainElement && !mainElement.classList.contains('nodrag')) {
    event.stopPropagation()
    containerRef.value?.dispatchEvent(
      new MouseEvent('mousedown', {
        bubbles: true,
        cancelable: true,
        view: window,
        clientX: event.clientX,
        clientY: event.clientY,
        screenX: event.screenX,
        screenY: event.screenY,
      }),
    )
  }
}

const captureClick = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  const protyleContent = target.closest('.protyle-content')
  const isInProtyleContent = !!protyleContent
  if (isInProtyleContent) {

    const lastRect = cardProtyleRef.value?.protyle.wysiwyg.element.lastElementChild.getBoundingClientRect()
    if (event.y > lastRect.bottom) {
      event.stopImmediatePropagation()
      const newEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        view: window,
        ...event,
      })
      const mainElement = target.closest('.EnWhiteBoardNodeProtyleMain')
      mainElement?.parentElement?.dispatchEvent(newEvent)
    }
  }
}

const mainRef = ref<HTMLDivElement | null>(null)

let offTransactionEvent = null
const bindNodeIdToEnNode = () => {
  if (!cardProtyleRef.value) {
    return
  }
  const firstNode = cardProtyleRef.value.protyle.element?.querySelector(`[data-node-id]`) as HTMLElement
  if (!firstNode) {
    return
  }
  const nodeId = firstNode.dataset.nodeId
  if (!nodeId) {
    return
  }

  nodeData.value.blockId = nodeId
}

const removeNodeCreatedByOther = (event) => {
  const {
    detail,
  } = event
  const {
    sid,
    data,
  } = detail
  const currentProtyleId = cardProtyleRef.value?.protyle.id
  data.forEach((item) => {
    const {
      doOperations = [],
    } = item
    doOperations.forEach((operation) => {
      const {
        action,
        id: opId,
      } = operation
      const isCreate = action === 'insert'
      const isCreateByOther = sid !== currentProtyleId

      if (isCreate && isCreateByOther) {
        let timer = null
        timer = setInterval(() => {
          const wysiwygElement = cardProtyleRef.value?.protyle.wysiwyg.element
          const firstLevelChildren = wysiwygElement?.children
          const targetElement = Array.from(firstLevelChildren).find((child: HTMLElement) => {
            const childNodeId = child.dataset.nodeId
            return childNodeId && childNodeId === opId
          })
          if (targetElement) {
            targetElement.remove()
            clearInterval(timer)
          }
        }, 0)
      }
    })
  })
}

const isMergingToSuperBlock = ref(false)
const mergeTopLevelBlocksIntoSuperBlock = debounce(() => {
  if (!whiteBoardModuleOptions.value.autoMergeToSuperBlock) {
    return
  }

  const children = Array.from(cardProtyleRef.value?.protyle.wysiwyg.element?.children || [])
  // 如果只有一个子元素，则不进行合并
  if (children.length <= 1) {
    return
  }

  const protyleIns = cardProtyleRef.value?.protyle.getInstance()
  isMergingToSuperBlock.value = true
  protyleIns.turnIntoOneTransaction(children, 'BlocksMergeSuperBlock', 'row')
  const off = useSiyuanDatabaseIndexCommit(debounce(async () => {
    off()
    isMergingToSuperBlock.value = false
  }, 20))
}, whiteBoardModuleOptions.value.autoMergeToSuperBlockDelay * 1000)

onMounted(() => {
  offTransactionEvent = useSiyuanEventTransactions((event) => {
    bindNodeIdToEnNode()
    removeNodeCreatedByOther(event)
    mergeTopLevelBlocksIntoSuperBlock()
  })
})
onBeforeUnmount(() => {
  if (offTransactionEvent) {
    offTransactionEvent()
  }
})

const onResize = (event: OnResize) => {
  console.log('onResize', event)
}

const handleRemoveNode = () => {
  removeNodes([flowNode])
}

const handleDuplicateNode = () => {
  const nodes = getNodes.value
  const sourceNode = nodes.find((node) => node.id === flowNode.id)
  if (!sourceNode) return

  // 创建新节点，保持相同的 blockId
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
    // 重置节点的连线相关属性
    selected: true, // 将新节点设置为选中状态
    dragging: false,
    resizing: false,
  }

  // 取消选中原始节点
  const updatedNodes = nodes.map((node) => ({
    ...node,
    selected: node.id === sourceNode.id ? false : node.selected,
  }))
  setNodes(updatedNodes)

  // 添加新节点
  addNodes([newNode])
}

const isMultipleSelected = computed(() => {
  return getSelectedNodes.value.length > 1
})

const isSelected = computed(() => {
  const selectedNodes = getSelectedNodes.value
  return selectedNodes.some((node) => node.id === flowNode.id)
})

const handleOpenInSidebar = () => {
  if (flowNode.id && nodeData.value.blockId) {
    emit('openInSidebar', flowNode.id, nodeData.value.blockId)
  }
}
</script>

<style lang="scss" scoped>
.EnWhiteBoardNodeProtyleContainer {
  display: flex;
  flex-direction: column;
  justify-content: center;

  width: 100%;
  height: 100%;
  box-sizing: border-box;

  position: relative;
  --en-whiteboard-node-protyle-border-width: 2px;
  border: var(--en-whiteboard-node-protyle-border-width) solid var(--b3-border-color);
  border-radius: var(--en-whiteboard-card-radius);

  padding: unset;

  .main {
    flex: 1;
    display: flex;
    flex-direction: column;


    position: relative;

    overflow: hidden;

    &:not(.nodrag) {
      opacity: 0.7;

      :deep(.protyle-wysiwyg) {
        cursor: var(--en-whiteboard-card-cursor);
      }
    }

    :deep(.protyle-wysiwyg) {
      padding-bottom: 16px !important;
    }

  }

  .ProtyleToolbarArea {
    width: 100%;
    height: 30px;
    flex-shrink: 0;
    background-color: color-mix(in srgb, var(--b3-theme-surface) 65%, transparent);

    display: flex;
    align-items: center;
    justify-content: space-between;

    box-sizing: border-box;
    padding: var(--en-gap);
  }

  :deep(.vue-flow__resize-control) {
    opacity: 0;
    &:hover {
      opacity: 1;
    }

    &.line {
      box-sizing: border-box;
      border: unset;
      top: unset;
      bottom: unset;
      left: unset;
      right: unset;

      &.top,
      &.bottom {
        left: 0px;
        height: var(--en-whiteboard-resizer-width);
      }

      &.left,
      &.right {
        top: 0px;
        width: var(--en-whiteboard-resizer-width);
      }

      &.top {
        top: calc(0px - (var(--en-whiteboard-node-protyle-border-width) / 2));
      }
      &.bottom {
        bottom: 0px;
        transform: translateY(
          calc(0px + (var(--en-whiteboard-resizer-width) / 2) + (var(--en-whiteboard-node-protyle-border-width) / 2))
        );
      }
      &.left {
        left: calc(0px - (var(--en-whiteboard-node-protyle-border-width) / 2));
      }
      &.right {
        top: 0px;
        right: 0px;
        transform: translateX(
          calc(0px + (var(--en-whiteboard-resizer-width) / 2) + (var(--en-whiteboard-node-protyle-border-width) / 2))
        );
      }

      &::before {
        content: '';
        background-color: var(--en-whiteboard-resizer-color);
        border-radius: var(--en-whiteboard-resizer-width);
        position: absolute;
        --en-line-vertical-width: min(max(8px, calc(var(--en-card-width) * 0.2)), 30px);
        --en-line-horizontal-height: min(max(8px, calc(var(--en-card-height) * 0.2)), 30px);
      }


      // 调整大小
      &.top::before,
      &.bottom::before {
        width: var(--en-line-vertical-width);
        height: var(--en-whiteboard-resizer-width);
      }

      &.left::before,
      &.right::before {
        width: var(--en-whiteboard-resizer-width);
        height: var(--en-line-horizontal-height);
      }

      // 调整位置
      &.top::before {
        top: 0px;
        left: calc(50% - var(--en-line-vertical-width) / 2);
      }
      &.bottom::before {
        bottom: 0px;
        left: calc(50% - var(--en-line-vertical-width) / 2);
      }
      &.left::before {
        top: calc(50% - var(--en-line-horizontal-height) / 2);
        left: 0px;
      }
      &.right::before {
        top: calc(50% - var(--en-line-horizontal-height) / 2);
        right: 0px;
      }
    }

    &.handle {
      border: unset;

      --en-handle-base-width: min(var(--en-card-width), var(--en-card-height));
      --en-handle-width: min(max(12px, calc(var(--en-handle-base-width) * 0.3)), 36px);
      width: var(--en-handle-width);
      height: var(--en-handle-width);
      transform: unset;
      top: unset;
      bottom: unset;
      left: unset;
      right: unset;

      &::after,
      &::before {
        content: '';
        background-color: var(--en-whiteboard-resizer-color);
        border-radius: var(--en-whiteboard-card-radius);
        position: absolute;
      }

      &::before {
        width: 100%;
        height: var(--en-whiteboard-resizer-width);
      }
      &::after {
        width: var(--en-whiteboard-resizer-width);
        height: 100%;
      }


      &.top.left {
        top: 0;
        bottom: unset;
        left: 0;
        right: unset;
        transform: translate(
          calc(0px - (var(--en-whiteboard-resizer-width) / 2) - (var(--en-whiteboard-node-protyle-border-width) / 2)),
          calc(0px - (var(--en-whiteboard-resizer-width) / 2) - (var(--en-whiteboard-node-protyle-border-width) / 2))
        );

        &::before,
        &::after {
          top: 0;
          left: 0;
        }
      }

      &.top.right {
        top: 0px;
        bottom: unset;
        left: unset;
        right: 0px;
        transform: translate(
          calc(0px + (var(--en-whiteboard-resizer-width) / 2) + (var(--en-whiteboard-node-protyle-border-width) / 2)),
          calc(0px - (var(--en-whiteboard-resizer-width) / 2) - (var(--en-whiteboard-node-protyle-border-width) / 2))
        );

        &::before,
        &::after {
          top: 0;
          right: 0;
        }
      }
      &.bottom.left {
        top: unset;
        bottom: 0;
        left: 0;
        right: unset;
        transform: translate(
          calc(0px - (var(--en-whiteboard-resizer-width) / 2) - (var(--en-whiteboard-node-protyle-border-width) / 2)),
          calc(0px + (var(--en-whiteboard-resizer-width) / 2) + (var(--en-whiteboard-node-protyle-border-width) / 2))
        );

        &::before,
        &::after {
          bottom: 0;
          left: 0;
        }
      }
      &.bottom.right {
        top: unset;
        bottom: 0;
        left: unset;
        right: 0;
        transform: translate(
          calc(0px + (var(--en-whiteboard-resizer-width) / 2) + (var(--en-whiteboard-node-protyle-border-width) / 2)),
          calc(0px + (var(--en-whiteboard-resizer-width) / 2) + (var(--en-whiteboard-node-protyle-border-width) / 2))
        );

        &::after,
        &::before {
          bottom: 0;
          right: 0;
        }
      }
    }
  }

  .Handle {
    // border-radius: var(--en-whiteboard-card-radius);
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
  }

  .Handle.Top {
    top: -16px;
  }
  .Handle.Bottom {
    bottom: -16px;
  }
  .Handle.Left {
    left: -16px;
  }
  .Handle.Right {
    right: -16px;
  }

  &.variant-default {
    border: var(--en-whiteboard-node-protyle-border-width) solid var(--b3-border-color);
    border-radius: var(--en-whiteboard-card-radius);
  }

  &.variant-card {
    border: none;
    border-radius: var(--en-whiteboard-card-radius);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  }

  &.variant-note {
    border: none;
    border-radius: 0;
    box-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
    background-color: #fefabc;
    transform: rotate(2deg);

    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 20px;
      width: 20px;
      height: 30px;
      background-color: rgba(0,0,0,0.1);
      border-radius: 0 0 20px 20px;
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

<style lang="scss">
.vue-flow__node-EnWhiteBoardNodeProtyle {
  --en-whiteboard-card-cursor: grab;
  --en-whiteboard-card-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  transition: box-shadow 0.3s ease;

  .EnWhiteBoardNodeProtyleContainer {
    transition: box-shadow 0.3s ease;
  }

  &.dragging {
    --en-whiteboard-card-cursor: grabbing;

    .EnWhiteBoardNodeProtyleContainer {
      box-shadow: var(--en-whiteboard-card-shadow);
      transform: translateY(-2px);
      transition: box-shadow 0.3s ease, transform 0.3s ease;
    }
  }

  &.selected {
    .EnWhiteBoardNodeProtyleContainer {
      border-color: var(--b3-theme-primary-light);
    }
  }
}
</style>
