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

<script setup lang="tsx">
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
  const isSourceRight = props.sourcePosition === Position.Right
  const isSourceLeft = props.sourcePosition === Position.Left
  const isSourceTop = props.sourcePosition === Position.Top
  const isSourceBottom = props.sourcePosition === Position.Bottom

  const isTargetRight = props.targetPosition === Position.Right
  const isTargetLeft = props.targetPosition === Position.Left
  const isTargetTop = props.targetPosition === Position.Top
  const isTargetBottom = props.targetPosition === Position.Bottom

  let sourceX = props.sourceX
  let sourceY = props.sourceY
  let targetX = props.targetX
  let targetY = props.targetY

  if (isSourceRight) {
    sourceX -= 16
  } else if (isSourceLeft) {
    sourceX += 16
  } else if (isSourceTop) {
    sourceY += 16
  } else if (isSourceBottom) {
    sourceY -= 16
  }

  if (isTargetRight) {
    targetX -= 16
  } else if (isTargetLeft) {
    targetX += 16
  } else if (isTargetTop) {
    targetY += 16
  } else if (isTargetBottom) {
    targetY -= 16
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
