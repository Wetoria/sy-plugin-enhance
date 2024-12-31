<template>
  <div
    class="EnWhiteBoardNodeProtyleContainer"
    :data-en-flow-node-id="nodeProps.id"
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
      :data-en-flow-node-id="nodeProps.id"
      @wheel.capture="captureWheel"
      @mousedown.capture="captureMouseDown"
    >
      <!-- <div>{{ data.label }}</div>

      <div>
        {{ x }} {{ y }}
      </div> -->

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
            :data-en-whiteboard-node-protyle-util-area="nodeProps.id"
          >

          </div>
        </Teleport>
      </template>
    </div>

    <NodeResizer
      :min-width="100"
      :min-height="30"
      color="transparent"
      @resize="onResize"
    />


    <Handle
      type="source"
      :position="Position.Bottom"
    />
  </div>
</template>

<script lang="ts">

</script>

<script setup lang="ts">
import EnProtyle from '@/components/EnProtyle.vue'
import {
  EnWhiteBoardNodeData,
  useWhiteBoardModule,
} from '@/modules/EnWhiteBoard/EnWhiteBoard'
import { debounce } from '@/utils'


import {
  useSiyuanDatabaseIndexCommit,
  useSiyuanEventTransactions,
} from '@/utils/EventBusHooks'
import {
  Handle,
  type NodeProps,
  Position,
  useKeyPress,
} from '@vue-flow/core'
import {
  NodeResizer,
  OnResize,
} from '@vue-flow/node-resizer'
import { Protyle } from 'siyuan'
import {
  computed,
  onBeforeUnmount,
  onMounted,
  ref,
} from 'vue'


const props = defineProps<{
  nodeProps: NodeProps<EnWhiteBoardNodeData>
  enWhiteBoardProtyleUtilAreaRef: HTMLElement
}>()

const emit = defineEmits<{
  clickCard: [element: HTMLElement]
}>()

const {
  moduleOptions: whiteBoardModuleOptions,
} = useWhiteBoardModule()

// const node = computed(() => props.node)
const x = computed(() => `${Math.round(props.nodeProps.position.x)}px`)
const y = computed(() => `${Math.round(props.nodeProps.position.y)}px`)

const nodeData = computed(() => props.nodeProps.data)

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
  console.log('captureMouseDown', event)
  const mainElement = target.closest('.EnWhiteBoardNodeProtyleMain')
  if (mainElement && !mainElement.classList.contains('nodrag')) {
    event.stopImmediatePropagation()
    const newEvent = new MouseEvent('mousedown', {
      bubbles: true,
      cancelable: true,
      view: window,
      ...event,
    })
    mainElement.parentElement?.dispatchEvent(newEvent)
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
    z-index: 1;
    background-color: var(--b3-theme-surface);

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

      &.top {
        top: calc(0px - (var(--en-whiteboard-node-protyle-border-width) / 2));
      }
      &.bottom {
        bottom: 0px;
        transform: translateY(
          calc(0px + (var(--en-whiteboard-node-protyle-border-width) / 2))
        );
      }
      &.left {
        left: calc(0px - (var(--en-whiteboard-node-protyle-border-width) / 2));
      }
      &.right {
        right: 0px;
        transform: translateX(
          calc(0px + (var(--en-whiteboard-node-protyle-border-width) / 2))
        );
      }

      &::before {
        content: '';
        background-color: var(--en-whiteboard-resizer-color);
        border-radius: var(--en-whiteboard-resizer-width);
        position: absolute;
        --en-line-vertical-size: min(max(8px, 20%), 30px);
        --en-line-horizontal-size: min(max(8px, 20%), 30px);
      }

      &.top::before {
        width: var(--en-line-vertical-size);
        height: var(--en-whiteboard-resizer-width);
        top: 0px;
        transform: translateY(
          calc(0px - (var(--en-whiteboard-resizer-width) / 2) - 0.5px)
        );
        left: calc(50% - var(--en-line-vertical-size) / 2);
      }
      &.bottom::before {
        width: var(--en-line-vertical-size);
        height: var(--en-whiteboard-resizer-width);
        bottom: 0px;
        transform: translateY(
          calc(0px + (var(--en-whiteboard-resizer-width) / 2) + 0.5px)
        );
        left: calc(50% - var(--en-line-vertical-size) / 2);
      }
      &.left::before {
        width: var(--en-whiteboard-resizer-width);
        height: var(--en-line-horizontal-size);
        top: calc(50% - var(--en-line-horizontal-size) / 2);
        left: 0px;
        transform: translateX(
          calc(0px - (var(--en-whiteboard-resizer-width) / 2) - 0.5px)
        );
      }
      &.right::before {
        width: var(--en-whiteboard-resizer-width);
        height: var(--en-line-horizontal-size);
        top: calc(50% - var(--en-line-horizontal-size) / 2);
        right: 0px;
        transform: translateX(
          calc(0px + (var(--en-whiteboard-resizer-width) / 2) + 0.5px)
        );
      }
    }

    &.handle {
      border: unset;

      width: min(max(8px, 10%), 30px);
      height: min(max(6px, 20%), 30px);
      transform: unset;

      &::after,
      &::before {
        content: '';
        background-color: var(--en-whiteboard-resizer-color);
        border-radius: var(--en-whiteboard-card-radius);
        position: absolute;
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

        &::after {
          width: 100%;
          height: var(--en-whiteboard-resizer-width);
          top: 0;
          left: 0;
        }
        &::before {
          width: var(--en-whiteboard-resizer-width);
          height: 100%;
          top: 0;
          left: 0;
        }
      }
      &.top.right {
        top: 0;
        bottom: unset;
        left: unset;
        right: 0;
        transform: translate(
          calc(0px + (var(--en-whiteboard-resizer-width) / 2) + (var(--en-whiteboard-node-protyle-border-width) / 2)),
          calc(0px - (var(--en-whiteboard-resizer-width) / 2) - (var(--en-whiteboard-node-protyle-border-width) / 2))
        );
        &::after {
          width: 100%;
          height: var(--en-whiteboard-resizer-width);
          top: 0;
          right: 0;
        }
        &::before {
          width: var(--en-whiteboard-resizer-width);
          height: 100%;
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
        &::after {
          width: 100%;
          height: var(--en-whiteboard-resizer-width);
          bottom: 0;
          left: 0;
        }
        &::before {
          width: var(--en-whiteboard-resizer-width);
          height: 100%;
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
        &::after {
          width: 100%;
          height: var(--en-whiteboard-resizer-width);
          bottom: 0;
          right: 0;
        }
        &::before {
          width: var(--en-whiteboard-resizer-width);
          height: 100%;
          bottom: 0;
          right: 0;
        }
      }
    }
  }
}
</style>

<style lang="scss">
.vue-flow__node-EnWhiteBoardNodeProtyle {
  --en-whiteboard-card-cursor: grab;

  &.dragging {
    --en-whiteboard-card-cursor: grabbing;
  }

  &.selected {
    .EnWhiteBoardNodeProtyleContainer {
      border-color: var(--b3-theme-primary-light);
    }
  }
}
</style>
