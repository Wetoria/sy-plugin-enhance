<template>
  <BaseEdge
    :path="path"
    :style="edgeStyle"
    @click="onEdgeClick"
    @dblclick="onLabelDblClick"
  >
    <template
      v-if="showToolbar && !isMultipleNodesSelected"
      #toolbar
    >
      <EnWhiteBoardToolBar
        :is-edge-toolbar="true"
        :edge-id="edgeId"
        :whiteBoardConfigData="whiteBoardConfigData"
        @remove-edge="onRemoveEdge"
      />
    </template>
  </BaseEdge>
  <EdgeLabelRenderer>
    <div
      v-if="isSelected && edgeId && !isMultipleNodesSelected"
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
      v-if="isEditing || (label && !isEditing)"
      class="nodrag nopan EnWhiteBoardEdgeLabel"
      :class="{ editing: isEditing }"
      :style="{
        pointerEvents: 'all',
        position: 'absolute',
        transform: `translate(-50%, -50%) translate(${edgePathParams[1]}px,${edgePathParams[2]}px)`,
      }"
      @dblclick.stop="onLabelDblClick"
    >
      <span
        ref="measureRef"
        class="EdgeLabelMeasure"
      >{{ editingLabel || label || '' }}</span>
      <input
        ref="inputRef"
        v-model="editingLabel"
        class="EdgeLabelInput"
        :placeholder="isEditing ? '输入标签' : ''"
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
  getBezierPath,
  getSmoothStepPath,
  getStraightPath,
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
import { useWhiteBoardModule } from './EnWhiteBoard'

interface EdgeData {
  label?: string
  edgeType?: string
  width?: number
  style?: string
  color?: string
  showToolbar?: boolean
  whiteBoardConfigData?: any
  path?: string
  markerEnd?: string
  markerStart?: string
}

// 基础 props 类型
interface BaseProps {
  whiteBoardConfigData?: any
}

// 合并类型
type Props = (EdgeProps<EdgeData> | ConnectionLineProps) & BaseProps

const props = defineProps<Props>()

const emit = defineEmits<{
  'remove-edge': [edgeId: string]
}>()

const markerEnd = 'url(#arrow)'

const edgePathParams = computed(() => {
  let sourceX = props.sourceX
  let sourceY = props.sourceY
  let targetX = props.targetX
  let targetY = props.targetY

  // 根据节点位置计算实际的连接点
  if (props.sourceNode) {
    const sourceWidth = Number(props.sourceNode.width) || 0
    const sourceHeight = Number(props.sourceNode.height) || 0

    switch (props.sourcePosition) {
      case Position.Left:
        sourceX = props.sourceNode.position.x
        sourceY = props.sourceNode.position.y + sourceHeight / 2
        break
      case Position.Right:
        sourceX = props.sourceNode.position.x + sourceWidth
        sourceY = props.sourceNode.position.y + sourceHeight / 2
        break
      case Position.Top:
        sourceX = props.sourceNode.position.x + sourceWidth / 2
        sourceY = props.sourceNode.position.y
        break
      case Position.Bottom:
        sourceX = props.sourceNode.position.x + sourceWidth / 2
        sourceY = props.sourceNode.position.y + sourceHeight
        break
    }
  }

  if (props.targetNode) {
    const targetWidth = Number(props.targetNode.width) || 0
    const targetHeight = Number(props.targetNode.height) || 0

    switch (props.targetPosition) {
      case Position.Left:
        targetX = props.targetNode.position.x
        targetY = props.targetNode.position.y + targetHeight / 2
        break
      case Position.Right:
        targetX = props.targetNode.position.x + targetWidth
        targetY = props.targetNode.position.y + targetHeight / 2
        break
      case Position.Top:
        targetX = props.targetNode.position.x + targetWidth / 2
        targetY = props.targetNode.position.y
        break
      case Position.Bottom:
        targetX = props.targetNode.position.x + targetWidth / 2
        targetY = props.targetNode.position.y + targetHeight
        break
    }
  }

  const pathParams = {
    ...props,
    sourceX,
    sourceY,
    targetX,
    targetY,
  }

  let path
  const edgeType = getData()?.edgeType || 'smoothstep'

  switch (edgeType) {
    case 'bezier':
      path = getBezierPath(pathParams)
      break
    case 'step':
      path = getSmoothStepPath({
        ...pathParams,
        borderRadius: 0,
      })
      break
    case 'straight':
      path = getStraightPath(pathParams)
      break
    case 'smoothstep':
    default:
      path = getSmoothStepPath(pathParams)
  }

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
  getSelectedNodes,
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
    inputWidth.value = Math.max(measureRef.value.offsetWidth + 4, 60) // 最小宽度60px
  }
}

watch(label, (newLabel) => {
  if (!isEditing.value) {
    editingLabel.value = newLabel || ''
    nextTick(updateInputWidth)
  }
}, { immediate: true })

watch(editingLabel, () => {
  nextTick(updateInputWidth)
})

const onLabelDblClick = async (event: MouseEvent) => {
  event.stopPropagation()
  isEditing.value = true
  editingLabel.value = label.value || ''
  await nextTick()
  inputRef.value?.focus()
}

const finishEdit = () => {
  if (!isEditing.value) return
  if (!('id' in props)) return

  const newEdges = edges.value.map((edge) => {
    if (edge.id === props.id) {
      const trimmedLabel = editingLabel.value.trim()
      if (!trimmedLabel) {
        const {
          label,
          ...restData
        } = edge.data
        edge.data = restData
      } else {
        edge.data = {
          ...edge.data,
          label: trimmedLabel,
        }
      }
    }
    return edge
  })

  setEdges(newEdges)
  if (props.whiteBoardConfigData) {
    props.whiteBoardConfigData.boardOptions.edges = newEdges
  }
  isEditing.value = false
}

const cancelEdit = () => {
  isEditing.value = false
  editingLabel.value = label.value || ''
}

const onRemoveEdge = () => {
  // 移除此处的删除逻辑，完全交由工具栏组件处理
  if ('id' in props && props.id) {
    emit('remove-edge', props.id)
  }
}

const onEdgeClick = () => {
  // 这里不需要实现，因为 VueFlow 会自动处理边的选中状态
}

const getData = () => {
  if ('data' in props) {
    return props.data || {}
  }
  return {}
}

const edgeStyle = computed(() => {
  const data = getData()
  const width = data.width || 1

  // 根据线条粗细调整点线和虚线的间距
  let dashArray
  if (data.style === 'dashed') {
    dashArray = `${width * 5},${width * 5}` // 虚线间距随线条粗细等比例变化
  } else if (data.style === 'dotted') {
    dashArray = `${width},${width * 2}` // 点线的点大小和间距随线条粗细变化，减小间距
  }

  // 只有当源节点和目标节点都是思维导图节点时才添加过渡动画
  const isMindmapEdge = props.sourceNode?.data?.mindmap && props.targetNode?.data?.mindmap

  // 如果是预览连线,使用全局配置的边样式
  if (!('id' in props)) {
    // 获取全局配置
    const { moduleOptions } = useWhiteBoardModule()
    // 获取预览连线的边粗细
    const previewWidth = moduleOptions.value.edgeWidthDefault || '2'
    // 获取预览连线的边样式
    const previewStyle = moduleOptions.value.edgeStyleDefault || 'solid'
    // 获取预览连线的终点箭头
    const previewMarkerEnd = moduleOptions.value.edgeMarkerEndDefault || 'arrow'
    // 获取预览连线的起点箭头
    const previewMarkerStart = moduleOptions.value.edgeMarkerStartDefault || ''
    
    // 计算预览连线的虚线/点线间距
    let previewDashArray
    if (previewStyle === 'dashed') {
      previewDashArray = `${Number(previewWidth) * 5},${Number(previewWidth) * 5}`
    } else if (previewStyle === 'dotted') {
      previewDashArray = `${Number(previewWidth)},${Number(previewWidth) * 2}`
    }
    
    return {
      strokeWidth: Number(previewWidth),
      stroke: 'var(--b3-theme-on-surface)',
      strokeDasharray: previewDashArray,
      markerEnd: previewMarkerEnd ? `url(#${previewMarkerEnd})` : undefined,
      markerStart: previewMarkerStart ? `url(#${previewMarkerStart})` : undefined,
      transition: 'none',
    }
  }

  return {
    strokeWidth: width,
    stroke: data.color || 'var(--b3-theme-on-surface)',
    strokeDasharray: dashArray,
    markerEnd: `url(#${data.markerEnd || 'arrow'})`,
    markerStart: data.markerStart ? `url(#${data.markerStart})` : undefined,
    transition: isMindmapEdge ? 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
  }
})

const showToolbar = computed(() => {
  const data = getData()
  return data.showToolbar === true
})

const whiteBoardConfigData = computed(() => {
  const data = getData()
  return data.whiteBoardConfigData || {}
})

const path = computed(() => {
  const data = getData()
  return data.path || edgePathParams.value[0]
})

const isMultipleNodesSelected = computed(() => {
  return getSelectedNodes.value.length > 1
})
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
  z-index: 5;

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
  z-index: 10;
}

.EnWhiteBoardEdgeLabel {
  &:hover {
    .EnWhiteBoardEdgeToolbar {
      opacity: 1;
    }
  }
}
</style>
