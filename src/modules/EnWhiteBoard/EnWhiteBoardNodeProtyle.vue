<template>
  <div
    class="EnWhiteBoardCardContainer"
  >
    <div
      ref="mainRef"
      class="main EnWhiteBoardCardMain"
      @wheel.capture="captureWheel"
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
      <!-- <div
        v-if="!nodeData.editing"
        class="protyle-cursor-mask"
      >

      </div> -->
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
import { EnWhiteBoardNodeData } from '@/modules/EnWhiteBoard/EnWhiteBoard'
import { debounce } from '@/utils'
import {
  unWatchDomChange,
  watchDomChange,
} from '@/utils/DOM'
import { SyDomNodeTypes } from '@/utils/Siyuan'
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
const afterProtyleLoad = (protyle: Protyle) => {
  targetProtyleUtilClassList.forEach((className) => {
    const target = protyle.protyle.element.querySelector(`.${className}`)
    if (target) {
      protyleUtilAreaRef.value?.appendChild(target)
    }
  })

  protyle?.protyle?.wysiwyg?.element?.addEventListener('mousedown', (event) => {
    const target = event.target as HTMLElement
    const mainElement = target.closest('.EnWhiteBoardCardMain')
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
  }, true)
}

const mainRef = ref<HTMLDivElement | null>(null)

const lastReadOnlyStatus = ref(false)
const changeReadOnly = () => {
  const mainElement = mainRef.value
  if (!mainElement)
    return
  const readonly = !mainElement.classList.contains('nodrag')
  if (lastReadOnlyStatus.value === readonly)
    return

  const elements = mainElement.querySelectorAll(`[data-type="${SyDomNodeTypes.NodeParagraph}"]`)
  elements?.forEach((element) => {
    const contentEditable = element.firstElementChild
    contentEditable?.setAttribute('contenteditable', `${!readonly}`)
  })
  lastReadOnlyStatus.value = readonly
}
const watchNodrag = debounce(() => {
  if (!mainRef.value)
    return

  changeReadOnly()
}, 50)
onMounted(() => {
  watchDomChange(watchNodrag)
})
onBeforeUnmount(() => {
  unWatchDomChange(watchNodrag)
})


const onResize = (event: OnResize) => {
  console.log('onResize', event)
}
</script>

<style lang="scss" scoped>

.EnWhiteBoardCardContainer {
  display: flex;
  flex-direction: column;
  justify-content: center;

  width: 100%;
  height: 100%;
  box-sizing: border-box;
  overflow: hidden;

  position: relative;
  border: 1px solid var(--b3-border-color);
  border-radius: var(--en-whiteboard-card-radius);

  padding: unset;


  .main {
    flex: 1;
    display: flex;
    flex-direction: column;

    overflow-x: hidden;
    overflow-y: auto;

    position: relative;

    &:not(.nodrag) {
      opacity: 0.9;

      :deep(.protyle-wysiwyg) {
        cursor: var(--en-whiteboard-card-cursor);
      }
    }

    .protyle-cursor-mask {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.5);
      z-index: 1;
    }
  }

  :deep(.vue-flow__resize-control) {
    opacity: 0;
    &:hover {
      opacity: 1;
    }

    &.line {
      // --en-line-vertical-size: min(max(8px, 20%), 30px);
      // --en-line-horizontal-size: min(max(8px, 20%), 30px);
      // background-color: var(--en-whiteboard-resizer-color);
      // border: unset;
      // border-radius: var(--en-whiteboard-resizer-width);

      // &.top {
      //   width: var(--en-line-vertical-size);
      //   height: var(--en-whiteboard-resizer-width);
      //   left: calc(50% - var(--en-line-vertical-size) / 2);
      // }
      // &.bottom {
      //   width: var(--en-line-vertical-size);
      //   height: var(--en-whiteboard-resizer-width);
      //   left: calc(50% - var(--en-line-vertical-size) / 2);
      // }
      // &.left {
      //   width: var(--en-whiteboard-resizer-width);
      //   height: var(--en-line-horizontal-size);
      //   top: calc(50% - var(--en-line-horizontal-size) / 2);
      // }
      // &.right {
      //   width: var(--en-whiteboard-resizer-width);
      //   height: var(--en-line-horizontal-size);
      //   top: calc(50% - var(--en-line-horizontal-size) / 2);
      // }

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
        top: calc(0px - var(--en-whiteboard-resizer-width) / 2);
        left: calc(50% - var(--en-line-vertical-size) / 2);
      }
      &.bottom::before {
        width: var(--en-line-vertical-size);
        height: var(--en-whiteboard-resizer-width);
        bottom: calc(0px - var(--en-whiteboard-resizer-width) / 2);
        left: calc(50% - var(--en-line-vertical-size) / 2);
      }
      &.left::before {
        width: var(--en-whiteboard-resizer-width);
        height: var(--en-line-horizontal-size);
        top: calc(50% - var(--en-line-horizontal-size) / 2);
        left: calc(0px - var(--en-whiteboard-resizer-width) / 2);
      }
      &.right::before {
        width: var(--en-whiteboard-resizer-width);
        height: var(--en-line-horizontal-size);
        top: calc(50% - var(--en-line-horizontal-size) / 2);
        right: calc(0px - var(--en-whiteboard-resizer-width) / 2);
      }
    }

    &.handle {
      border: unset;
      border: 1px solid red;
      // width: var(--en-whiteboard-handle-size);
      // height: var(--en-whiteboard-handle-size);

      width: min(max(8px, 10%), 30px);
      height: min(max(6px, 20%), 30px);
      transform: unset;
      border-color: var(--en-whiteboard-resizer-color);
      border-style: solid;

      &.top.left {
        border-top-width: var(--en-whiteboard-resizer-width);
        border-bottom-width: 0px;
        border-left-width: var(--en-whiteboard-resizer-width);
        border-right-width: 0px;
        border-top-left-radius: var(--en-whiteboard-card-radius);
        top: 0;
        bottom: unset;
        left: 0;
        right: unset;
        transform: translate(calc(0px - var(--en-whiteboard-resizer-width) / 2), calc(0px - var(--en-whiteboard-resizer-width) / 2));
      }
      &.top.right {
        border-top-width: var(--en-whiteboard-resizer-width);
        border-bottom-width: 0px;
        border-left-width: 0px;
        border-right-width: var(--en-whiteboard-resizer-width);
        border-top-right-radius: var(--en-whiteboard-card-radius);
        top: 0;
        bottom: unset;
        left: unset;
        right: 0;
        transform: translate(calc(0px + var(--en-whiteboard-resizer-width) / 2), calc(0px - var(--en-whiteboard-resizer-width) / 2));
      }
      &.bottom.left {
        border-top-width: 0px;
        border-bottom-width: var(--en-whiteboard-resizer-width);
        border-left-width: var(--en-whiteboard-resizer-width);
        border-right-width: 0px;
        border-bottom-left-radius: var(--en-whiteboard-card-radius);
        top: unset;
        bottom: 0;
        left: 0;
        right: unset;
        transform: translate(calc(0px - var(--en-whiteboard-resizer-width) / 2), calc(0px + var(--en-whiteboard-resizer-width) / 2));
      }
      &.bottom.right {
        border-top-width: 0px;
        border-bottom-width: var(--en-whiteboard-resizer-width);
        border-left-width: 0px;
        border-right-width: var(--en-whiteboard-resizer-width);
        border-bottom-right-radius: var(--en-whiteboard-card-radius);
        top: unset;
        bottom: 0;
        left: unset;
        right: 0;
        transform: translate(calc(0px + var(--en-whiteboard-resizer-width) / 2), calc(0px + var(--en-whiteboard-resizer-width) / 2));
      }

      // &::before {
      //   content: '';
      //   border-color: var(--en-whiteboard-resizer-color);
      //   border-style: solid;
      //   position: absolute;
      //   width: 100%;
      //   height: 100%;
      //   box-sizing: border-box;
      // }

      // &.top.left::before {
      //   border-top-width: var(--en-whiteboard-resizer-width);
      //   border-bottom-width: 0px;
      //   border-left-width: var(--en-whiteboard-resizer-width);
      //   border-right-width: 0px;
      //   border-top-left-radius: var(--en-whiteboard-card-radius);
      //   // left: calc(50% - var(--en-whiteboard-resizer-width) / 2);
      //   // top: calc((var(--en-whiteboard-handle-size) - var(--en-whiteboard-resizer-width)) / 2);
      // }
      // &.top.right::before {
      //   border-top-width: var(--en-whiteboard-resizer-width);
      //   border-bottom-width: 0px;
      //   border-left-width: 0px;
      //   border-right-width: var(--en-whiteboard-resizer-width);
      //   border-top-right-radius: var(--en-whiteboard-card-radius);
      //   // right: calc(50% - var(--en-whiteboard-resizer-width) / 2);
      //   // top: calc((var(--en-whiteboard-handle-size) - var(--en-whiteboard-resizer-width)) / 2);
      // }
      // &.bottom.left::before {
      //   border-top-width: 0px;
      //   border-bottom-width: var(--en-whiteboard-resizer-width);
      //   border-left-width: var(--en-whiteboard-resizer-width);
      //   border-right-width: 0px;
      //   border-bottom-left-radius: var(--en-whiteboard-card-radius);
      //   // left: calc(50% - var(--en-whiteboard-resizer-width) / 2);
      //   // bottom: calc((var(--en-whiteboard-handle-size) - var(--en-whiteboard-resizer-width)) / 2);
      // }
      // &.bottom.right::before {
      //   border-top-width: 0px;
      //   border-bottom-width: var(--en-whiteboard-resizer-width);
      //   border-left-width: 0px;
      //   border-right-width: var(--en-whiteboard-resizer-width);
      //   border-bottom-right-radius: var(--en-whiteboard-card-radius);
      //   // right: calc(50% - var(--en-whiteboard-resizer-width) / 2);
      //   // bottom: calc((var(--en-whiteboard-handle-size) - var(--en-whiteboard-resizer-width)) / 2);
      // }
    }
  }
}
</style>

<style lang="scss">
.vue-flow__node-EnWhiteBoardCard {
  --en-whiteboard-card-cursor: grab;

  &.dragging {
    --en-whiteboard-card-cursor: grabbing;
  }
}
</style>
