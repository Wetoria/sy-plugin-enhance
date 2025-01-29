<template>
  <BaseEdge
    class="EnWhiteBoardEdgeBase"
    :path="edgePathParams[0]"
    :marker-end="markerEnd"
    @click="onEdgeClick"
  />
  <EdgeLabelRenderer>
    <div
      v-if="isSelected && edgeId"
      class="nodrag nopan EnWhiteBoardEdgeToolbar"
      :style="{
        pointerEvents: 'all',
        position: 'absolute',
        transformOrigin: 'center bottom',
        transform: `translate(-50%, -100%) translate(${edgePathParams[1]}px,${edgePathParams[2]}px) translateY(${toolbarOffsetY}px) scale(${1 / (viewport?.zoom || 1)})`,
      }"
    >
      <EnWhiteBoardToolBar
        :is-edge-toolbar="true"
        :edge-id="edgeId"
        :whiteBoardConfigData="props.whiteBoardConfigData"
        @remove-edge="onRemoveEdge"
      />
    </div>
  </EdgeLabelRenderer>
  <EdgeLabelRenderer>
    <div
      v-if="label || isEditing"
      class="nodrag nopan EnWhiteBoardEdgeLabel"
      :style="{
        pointerEvents: 'all',
        position: 'absolute',
        transform: `translate(-50%, -50%) translate(${edgePathParams[1]}px,${edgePathParams[2]}px)`,
      }"
      @dblclick="onLabelDblClick"
    >
      <span
        ref="measureRef"
        class="EdgeLabelMeasure"
      >{{ editingLabel || '新标签' }}</span>
      <input
        ref="inputRef"
        v-model="editingLabel"
        class="EdgeLabelInput"
        :readonly="!isEditing"
        :style="{
          cursor: isEditing ? 'text' : 'default',
          width: `${inputWidth}px`,
        }"
        @blur="finishEdit"
        @keydown.enter="finishEdit"
        @keydown.esc="cancelEdit"
        @input="updateInputWidth"
      >
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
  watch,
} from 'vue'
import EnWhiteBoardToolBar from './EnWhiteBoardToolBar.vue'

interface EdgeData {
  label?: string
}

// 基础 props 类型
interface BaseProps {
  whiteBoardConfigData?: any
}

// 合并类型
type Props = (EdgeProps<EdgeData> | ConnectionLineProps) & BaseProps

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
  getSelectedEdges,
  viewport,
} = useVueFlow()

const isEditing = ref(false)
const editingLabel = ref('')
const inputRef = ref<HTMLInputElement | null>(null)
const measureRef = ref<HTMLSpanElement | null>(null)
const inputWidth = ref(0)

const isSelected = computed(() => {
  if (!('id' in props)) return false
  const selectedEdges = getSelectedEdges.value
  return selectedEdges.some((edge) => edge.id === props.id)
})

const edgeId = computed(() => {
  if ('id' in props) {
    return props.id
  }
  return null
})

const toolbarOffsetY = computed(() => {
  // 如果有标签，需要额外向上偏移标签高度的一半
  if (label.value) {
    return -24 // -8px(基础偏移) - 16px(标签高度的一半)
  }
  return -8 // 基础偏移
})

const updateInputWidth = () => {
  if (measureRef.value) {
    inputWidth.value = measureRef.value.offsetWidth
  }
}

watch(label, (newLabel) => {
  if (!isEditing.value) {
    editingLabel.value = newLabel
    nextTick(updateInputWidth)
  }
}, { immediate: true })

watch(editingLabel, () => {
  nextTick(updateInputWidth)
})

const onLabelDblClick = async (event: MouseEvent) => {
  event.stopPropagation()
  isEditing.value = true
  await nextTick()
  inputRef.value?.focus()
  inputRef.value?.select()
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
  editingLabel.value = label.value
  isEditing.value = false
}

const onRemoveEdge = () => {
  // 移除此处的删除逻辑，完全交由工具栏组件处理
}

const onEdgeClick = () => {
  // 这里不需要实现，因为 VueFlow 会自动处理边的选中状态
}
</script>

<style lang="scss" scoped>
.EnWhiteBoardEdgeBase {
  stroke: var(--b3-theme-on-surface);
  stroke-width: 2;
}

.EnWhiteBoardEdgeLabel {
  position: absolute;
  display: inline-block;
  white-space: nowrap;
  background: var(--b3-theme-surface);
  padding: 2px 4px;
  border-radius: var(--b3-border-radius);
  font-size: 12px;
  color: var(--b3-theme-on-surface);
  user-select: none;
  border: 1px solid var(--b3-border-color);
  cursor: pointer;
  z-index: 0;

  &:hover {
    background: var(--b3-theme-surface-light);
  }

  &.editing {
    z-index: 5;
    background: var(--b3-theme-background);
  }
}

.EdgeLabelMeasure {
  visibility: hidden;
  position: absolute;
  font-family: var(--b3-font-family);
  color: var(--b3-theme-on-surface);
  font-size: 12px;
  white-space: pre;
}

.EdgeLabelInput {
  font-family: var(--b3-font-family);
  color: var(--b3-theme-on-surface);
  font-size: 12px;
  background: transparent;
  border: none;
  outline: none;
  text-align: center;
  padding: 0;

  &:not([readonly]):focus {
    background: var(--b3-theme-surface-light);
  }
}

.EnWhiteBoardEdgeToolbar {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  padding: 4px;
  border-radius: var(--b3-border-radius);
  pointer-events: all;
}

.EnWhiteBoardEdgeLabel {
  &:hover {
    .EnWhiteBoardEdgeToolbar {
      opacity: 1;
    }
  }
}
</style>
