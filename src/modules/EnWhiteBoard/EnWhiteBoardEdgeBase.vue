<template>
  <BaseEdge
    class="EnWhiteBoardEdgeBase"
    :path="edgePathParams[0]"
    :marker-end="markerEnd"
  >
  </BaseEdge>
  <EdgeLabelRenderer>
    <!-- <div
      class="nodrag nopan EnWhiteBoardEdgeBaseTest"
      :style="{
        pointerEvents: 'all',
        position: 'absolute',
        transform: `translate(-50%, -50%) translate(${edgePathParams[1]}px,${edgePathParams[2]}px)`,
      }"
    >
      Test 123
    </div> -->
  </EdgeLabelRenderer>
</template>

<script setup lang="ts">
import {
  BaseEdge,
  ConnectionLineProps,
  EdgeLabelRenderer,
  EdgeProps,
  getSmoothStepPath,
  Position,
} from '@vue-flow/core'
import {
  computed,
} from 'vue'

const props = defineProps<EdgeProps | ConnectionLineProps>()

const edgePathParams = computed(() => {
  let sourceX = props.sourceX
  let sourceY = props.sourceY
  let targetX = props.targetX
  let targetY = props.targetY

  // 根据节点位置计算实际的连接点
  if (props.sourceNode && props.sourcePosition === Position.Left) {
    sourceX = props.sourceNode.position.x
  } else if (props.sourceNode && props.sourcePosition === Position.Right) {
    sourceX = props.sourceNode.position.x + Number(props.sourceNode.width)
  } else if (props.sourceNode && props.sourcePosition === Position.Top) {
    sourceY = props.sourceNode.position.y
  } else if (props.sourceNode && props.sourcePosition === Position.Bottom) {
    sourceY = props.sourceNode.position.y + Number(props.sourceNode.height)
  }

  if (props.targetNode && props.targetPosition === Position.Left) {
    targetX = props.targetNode.position.x
  } else if (props.targetNode && props.targetPosition === Position.Right) {
    targetX = props.targetNode.position.x + Number(props.targetNode.width)
  } else if (props.targetNode && props.targetPosition === Position.Top) {
    targetY = props.targetNode.position.y
  } else if (props.targetNode && props.targetPosition === Position.Bottom) {
    targetY = props.targetNode.position.y + Number(props.targetNode.height)
  }

  const path = getSmoothStepPath({
    ...props,
    sourceX,
    sourceY,
    targetX,
    targetY,
  })

  return path
})
</script>

<style lang="scss" scoped>

</style>
