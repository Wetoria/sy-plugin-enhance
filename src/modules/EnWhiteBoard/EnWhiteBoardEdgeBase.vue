<template>
  <BaseEdge
    class="EnWhiteBoardEdgeBase"
    :path="edgePathParams[0]"
    :marker-end="markerEnd"
  />
  <EdgeLabelRenderer>
    <div
      v-if="label"
      class="nodrag nopan EnWhiteBoardEdgeLabel"
      :style="{
        pointerEvents: 'all',
        position: 'absolute',
        transform: `translate(-50%, -50%) translate(${edgePathParams[1]}px,${edgePathParams[2]}px)`,
      }"
      @click="onLabelClick"
      @dblclick="onLabelDblClick"
    >
      <template v-if="isEditing">
        <input
          ref="inputRef"
          v-model="editingLabel"
          class="EdgeLabelInput"
          type="text"
          @blur="finishEdit"
          @keydown.enter="finishEdit"
          @keydown.esc="cancelEdit"
        >
      </template>
      <template v-else>
        {{ label }}
      </template>
    </div>
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
  useVueFlow,
} from '@vue-flow/core'
import {
  computed,
  nextTick,
  ref,
} from 'vue'

interface EdgeData {
  label?: string
}

type Props = EdgeProps<EdgeData> | ConnectionLineProps

const props = defineProps<Props>()

const markerEnd = 'url(#arrow)'

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

const label = computed(() => {
  if ('data' in props) {
    return props.data?.label || ''
  }
  return ''
})

const {
  edges,
  setEdges,
} = useVueFlow()

const isEditing = ref(false)
const editingLabel = ref('')
const inputRef = ref<HTMLInputElement | null>(null)

const onLabelClick = (event: MouseEvent) => {
  event.stopPropagation()
}

const onLabelDblClick = async (event: MouseEvent) => {
  event.stopPropagation()
  isEditing.value = true
  editingLabel.value = label.value
  await nextTick()
  inputRef.value?.focus()
}

const finishEdit = () => {
  if (!isEditing.value) return
  if (!('id' in props)) return

  const newEdges = edges.value.map((edge) => {
    if (edge.id === props.id) {
      edge.data = {
        ...edge.data,
        label: editingLabel.value,
      }
    }
    return edge
  })

  setEdges(newEdges)
  isEditing.value = false
}

const cancelEdit = () => {
  isEditing.value = false
}
</script>

<style lang="scss" scoped>
.EnWhiteBoardEdgeBase {
  stroke: var(--b3-theme-on-surface);
  stroke-width: 2;
}

.EnWhiteBoardEdgeLabel {
  font-family: var(--b3-font-family);
  color: var(--b3-theme-on-surface);
  cursor: pointer;
  user-select: none;
  background: var(--b3-theme-surface);
  padding: 4px 8px;
  border-radius: var(--b3-border-radius);
  font-size: 12px;
  border: 1px solid var(--b3-border-color);
  z-index: 1;

  &:hover {
    background: var(--b3-theme-surface-light);
  }
}

.EdgeLabelInput {
  background: transparent;
  border: none;
  outline: none;
  color: var(--b3-theme-on-surface);
  font-size: 12px;
  width: 100%;
  min-width: 50px;
  font-family: var(--b3-font-family);
}
</style>
