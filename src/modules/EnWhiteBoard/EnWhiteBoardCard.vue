<template>
  <div
    :class="[
      'EnWhiteBoardCardContainer',
      'vue-flow__node-default',
    ]"
  >
    <NodeResizer
      :min-width="100"
      :min-height="30"
      color="transparent"
    />

    <div>{{ data.label }}</div>

    <div>
      {{ x }} {{ y }}
    </div>

    <Handle type="source" :position="Position.Bottom" />
  </div>
</template>

<script lang="ts">

interface EnWhiteBoardNodeData {
  nodeId: string
}

</script>

<script setup lang="ts">
import { Handle, Position, type NodeProps } from '@vue-flow/core'
import { NodeResizer } from '@vue-flow/node-resizer'
import { computed } from 'vue';

const props = defineProps<NodeProps<EnWhiteBoardNodeData>>()
// const node = computed(() => props.node)
const x = computed(() => `${Math.round(props.position.x)}px`)
const y = computed(() => `${Math.round(props.position.y)}px`)
</script>

<style lang="scss" scoped>

.EnWhiteBoardCardContainer {
  display: flex;
  flex-direction: column;
  justify-content: center;

  width: 100%;
  height: 100%;
  box-sizing: border-box;

  position: relative;
  border-radius: var(--en-whiteboard-card-radius);

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
