<template>
  <div
    class="EnWhiteBoardToolBar"
    :class="{
      'is-node-toolbar': isNodeToolbar,
      'is-edge-toolbar': isEdgeToolbar,
    }"
  >
    <!-- 基础工具栏 -->
    <template v-if="!isNodeToolbar && !isEdgeToolbar">
      <div class="ToolBarContent">
        <a-button-group>
          <template v-if="showBasicControls">
            <a-tooltip content="适应视图">
              <a-button @click="onFitView">
                <SyIcon name="iconFullscreen" />
              </a-button>
            </a-tooltip>
            <a-tooltip content="居中视图">
              <a-button @click="onCenterView">
                <SyIcon name="iconFocus" />
              </a-button>
            </a-tooltip>
            <a-tooltip content="切换背景">
              <a-button @click="onToggleBackground">
                <SyIcon name="iconTheme" />
              </a-button>
            </a-tooltip>
          </template>
          <template v-if="showExtraControls">
            <a-tooltip content="放大">
              <a-button @click="onZoomIn">
                <SyIcon name="iconZoomIn" />
              </a-button>
            </a-tooltip>
            <a-tooltip content="缩小">
              <a-button @click="onZoomOut">
                <SyIcon name="iconZoomOut" />
              </a-button>
            </a-tooltip>
          </template>
          <slot name="before" />
          <slot />
          <slot name="after" />
        </a-button-group>
      </div>
    </template>

    <!-- 节点工具栏 -->
    <template v-if="isNodeToolbar">
      <div class="ToolbarContent">
        <a-button-group>
          <a-tooltip content="删除节点">
            <a-button @click="onRemoveNode">
              <template #icon>
                <icon-delete />
              </template>
            </a-button>
          </a-tooltip>
          <a-tooltip content="复制节点">
            <a-button @click="onDuplicateNode">
              <template #icon>
                <icon-copy />
              </template>
            </a-button>
          </a-tooltip>
          <slot name="nodeToolbarExtra" />
        </a-button-group>
      </div>
    </template>

    <!-- 连线工具栏 -->
    <template v-if="isEdgeToolbar">
      <div class="ToolbarContent">
        <!-- 标签编辑模式 -->
        <template v-if="isEditingLabel">
          <div class="LabelEditor">
            <a-input
              v-model="editingLabelText"
              placeholder="输入标签"
              @keyup.enter="saveLabelEdit"
              @keyup.esc="cancelEdit"
            >
              <template #append>
                <a-button-group>
                  <a-button @click="saveLabelEdit">
                    <template #icon>
                      <icon-check />
                    </template>
                  </a-button>
                  <a-button @click="cancelEdit">
                    <template #icon>
                      <icon-close />
                    </template>
                  </a-button>
                </a-button-group>
              </template>
            </a-input>
          </div>
        </template>

        <!-- 普通工具栏模式 -->
        <template v-else>
          <a-button-group>
            <a-tooltip content="删除连线">
              <a-button @click="onRemoveEdge">
                <template #icon>
                  <icon-delete />
                </template>
              </a-button>
            </a-tooltip>
            <a-tooltip content="编辑标签">
              <a-button
                @click="() => {
                  editingLabelText = currentEdge?.data?.label || ''
                  isEditingLabel = true
                }"
              >
                <template #icon>
                  <icon-edit />
                </template>
              </a-button>
            </a-tooltip>
            <a-tooltip content="边类型">
              <a-dropdown
                trigger="click"
                @select="onEdgeTypeSelect"
              >
                <a-button>
                  <template #icon>
                    <icon-branch />
                  </template>
                </a-button>
                <template #content>
                  <a-doption value="smoothstep">
                    <div class="EdgeTypeOption">
                      <svg
                        viewBox="0 0 100 30"
                        width="100"
                        height="30"
                      >
                        <path
                          d="M10,20 L15,20 C18,20 20,20 20,17 L20,13 C20,10 22,10 25,10 L90,10"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2"
                        />
                      </svg>
                      <span>平滑阶梯</span>
                    </div>
                  </a-doption>
                  <a-doption value="step">
                    <div class="EdgeTypeOption">
                      <svg
                        viewBox="0 0 100 30"
                        width="100"
                        height="30"
                      >
                        <path
                          d="M10,20 L20,20 L20,10 L90,10"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2"
                        />
                      </svg>
                      <span>阶梯</span>
                    </div>
                  </a-doption>
                  <a-doption value="straight">
                    <div class="EdgeTypeOption">
                      <svg
                        viewBox="0 0 100 30"
                        width="100"
                        height="30"
                      >
                        <line
                          x1="10"
                          y1="15"
                          x2="90"
                          y2="15"
                          stroke="currentColor"
                          stroke-width="2"
                        />
                      </svg>
                      <span>直线</span>
                    </div>
                  </a-doption>
                  <a-doption value="bezier">
                    <div class="EdgeTypeOption">
                      <svg
                        viewBox="0 0 100 30"
                        width="100"
                        height="30"
                      >
                        <path
                          d="M10,15 C35,5 65,25 90,15"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2"
                        />
                      </svg>
                      <span>贝塞尔曲线</span>
                    </div>
                  </a-doption>
                </template>
              </a-dropdown>
            </a-tooltip>
            <a-tooltip content="边粗细">
              <a-dropdown
                trigger="click"
                @select="onEdgeWidthSelect"
              >
                <a-button>
                  <template #icon>
                    <icon-line-height />
                  </template>
                </a-button>
                <template #content>
                  <a-doption value="1">
                    <div class="EdgeTypeOption">
                      <svg
                        viewBox="0 0 40 20"
                        width="40"
                        height="20"
                      >
                        <line
                          x1="5"
                          y1="10"
                          x2="35"
                          y2="10"
                          stroke="currentColor"
                          stroke-width="1"
                        />
                      </svg>
                      <span>细</span>
                    </div>
                  </a-doption>
                  <a-doption value="2">
                    <div class="EdgeTypeOption">
                      <svg
                        viewBox="0 0 40 20"
                        width="40"
                        height="20"
                      >
                        <line
                          x1="5"
                          y1="10"
                          x2="35"
                          y2="10"
                          stroke="currentColor"
                          stroke-width="2"
                        />
                      </svg>
                      <span>中</span>
                    </div>
                  </a-doption>
                  <a-doption value="3">
                    <div class="EdgeTypeOption">
                      <svg
                        viewBox="0 0 40 20"
                        width="40"
                        height="20"
                      >
                        <line
                          x1="5"
                          y1="10"
                          x2="35"
                          y2="10"
                          stroke="currentColor"
                          stroke-width="3"
                        />
                      </svg>
                      <span>粗</span>
                    </div>
                  </a-doption>
                </template>
              </a-dropdown>
            </a-tooltip>
            <a-tooltip content="边样式">
              <a-dropdown
                trigger="click"
                @select="onEdgeStyleSelect"
              >
                <a-button>
                  <template #icon>
                    <icon-strikethrough />
                  </template>
                </a-button>
                <template #content>
                  <a-doption value="solid">
                    <div class="EdgeTypeOption">
                      <svg
                        viewBox="0 0 40 20"
                        width="40"
                        height="20"
                      >
                        <line
                          x1="5"
                          y1="10"
                          x2="35"
                          y2="10"
                          stroke="currentColor"
                          stroke-width="2"
                        />
                      </svg>
                      <span>实线</span>
                    </div>
                  </a-doption>
                  <a-doption value="dashed">
                    <div class="EdgeTypeOption">
                      <svg
                        viewBox="0 0 40 20"
                        width="40"
                        height="20"
                      >
                        <line
                          x1="5"
                          y1="10"
                          x2="35"
                          y2="10"
                          stroke="currentColor"
                          stroke-width="2"
                          stroke-dasharray="6,3"
                        />
                      </svg>
                      <span>虚线</span>
                    </div>
                  </a-doption>
                  <a-doption value="dotted">
                    <div class="EdgeTypeOption">
                      <svg
                        viewBox="0 0 40 20"
                        width="40"
                        height="20"
                      >
                        <line
                          x1="5"
                          y1="10"
                          x2="35"
                          y2="10"
                          stroke="currentColor"
                          stroke-width="2"
                          stroke-dasharray="2,2"
                        />
                      </svg>
                      <span>点线</span>
                    </div>
                  </a-doption>
                </template>
              </a-dropdown>
            </a-tooltip>
            <a-tooltip content="起点箭头">
              <a-dropdown
                trigger="click"
                @select="onEdgeMarkerStartSelect"
              >
                <a-button>
                  <template #icon>
                    <icon-double-left />
                  </template>
                </a-button>
                <template #content>
                  <a-doption value="">
                    <div class="EdgeTypeOption">
                      <svg
                        viewBox="0 0 40 20"
                        width="40"
                        height="20"
                      >
                        <line
                          x1="5"
                          y1="10"
                          x2="35"
                          y2="10"
                          stroke="currentColor"
                          stroke-width="2"
                        />
                      </svg>
                      <span>无</span>
                    </div>
                  </a-doption>
                  <a-doption value="circle-solid">
                    <div class="EdgeTypeOption">
                      <svg
                        viewBox="0 0 40 20"
                        width="40"
                        height="20"
                      >
                        <circle
                          cx="10"
                          cy="10"
                          r="3"
                          fill="currentColor"
                        />
                        <line
                          x1="10"
                          y1="10"
                          x2="35"
                          y2="10"
                          stroke="currentColor"
                          stroke-width="2"
                        />
                      </svg>
                      <span>实心圆点</span>
                    </div>
                  </a-doption>
                  <a-doption value="line">
                    <div class="EdgeTypeOption">
                      <svg
                        viewBox="0 0 40 20"
                        width="40"
                        height="20"
                      >
                        <line
                          x1="7"
                          y1="5"
                          x2="7"
                          y2="15"
                          stroke="currentColor"
                          stroke-width="2"
                        />
                        <line
                          x1="7"
                          y1="10"
                          x2="35"
                          y2="10"
                          stroke="currentColor"
                          stroke-width="2"
                        />
                      </svg>
                      <span>横线</span>
                    </div>
                  </a-doption>
                  <a-doption value="circle-hollow">
                    <div class="EdgeTypeOption">
                      <svg
                        viewBox="0 0 40 20"
                        width="40"
                        height="20"
                      >
                        <line
                          x1="10"
                          y1="10"
                          x2="35"
                          y2="10"
                          stroke="currentColor"
                          stroke-width="2"
                        />
                        <circle
                          cx="10"
                          cy="10"
                          r="3"
                          fill="currentColor"
                        />
                        <circle
                          cx="10"
                          cy="10"
                          r="2"
                          fill="var(--b3-theme-surface)"
                        />
                      </svg>
                      <span>空心圆点</span>
                    </div>
                  </a-doption>
                  <a-doption value="arrow-start">
                    <div class="EdgeTypeOption">
                      <svg
                        viewBox="0 0 40 20"
                        width="40"
                        height="20"
                      >
                        <path
                          d="M7,10 L13,14 L13,6 Z"
                          fill="currentColor"
                        />
                        <line
                          x1="13"
                          y1="10"
                          x2="35"
                          y2="10"
                          stroke="currentColor"
                          stroke-width="2"
                        />
                      </svg>
                      <span>箭头</span>
                    </div>
                  </a-doption>
                </template>
              </a-dropdown>
            </a-tooltip>
            <a-tooltip content="终点箭头">
              <a-dropdown
                trigger="click"
                @select="onEdgeMarkerEndSelect"
              >
                <a-button>
                  <template #icon>
                    <icon-double-right />
                  </template>
                </a-button>
                <template #content>
                  <a-doption value="">
                    <div class="EdgeTypeOption">
                      <svg
                        viewBox="0 0 40 20"
                        width="40"
                        height="20"
                      >
                        <line
                          x1="5"
                          y1="10"
                          x2="35"
                          y2="10"
                          stroke="currentColor"
                          stroke-width="2"
                        />
                      </svg>
                      <span>无</span>
                    </div>
                  </a-doption>
                  <a-doption value="circle-solid">
                    <div class="EdgeTypeOption">
                      <svg
                        viewBox="0 0 40 20"
                        width="40"
                        height="20"
                      >
                        <line
                          x1="5"
                          y1="10"
                          x2="30"
                          y2="10"
                          stroke="currentColor"
                          stroke-width="2"
                        />
                        <circle
                          cx="30"
                          cy="10"
                          r="3"
                          fill="currentColor"
                        />
                      </svg>
                      <span>实心圆点</span>
                    </div>
                  </a-doption>
                  <a-doption value="line">
                    <div class="EdgeTypeOption">
                      <svg
                        viewBox="0 0 40 20"
                        width="40"
                        height="20"
                      >
                        <line
                          x1="5"
                          y1="10"
                          x2="33"
                          y2="10"
                          stroke="currentColor"
                          stroke-width="2"
                        />
                        <line
                          x1="33"
                          y1="5"
                          x2="33"
                          y2="15"
                          stroke="currentColor"
                          stroke-width="2"
                        />
                      </svg>
                      <span>横线</span>
                    </div>
                  </a-doption>
                  <a-doption value="circle-hollow">
                    <div class="EdgeTypeOption">
                      <svg
                        viewBox="0 0 40 20"
                        width="40"
                        height="20"
                      >
                        <line
                          x1="5"
                          y1="10"
                          x2="30"
                          y2="10"
                          stroke="currentColor"
                          stroke-width="2"
                        />
                        <circle
                          cx="30"
                          cy="10"
                          r="3"
                          fill="currentColor"
                        />
                        <circle
                          cx="30"
                          cy="10"
                          r="2"
                          fill="var(--b3-theme-surface)"
                        />
                      </svg>
                      <span>空心圆点</span>
                    </div>
                  </a-doption>
                  <a-doption value="arrow">
                    <div class="EdgeTypeOption">
                      <svg
                        viewBox="0 0 40 20"
                        width="40"
                        height="20"
                      >
                        <line
                          x1="5"
                          y1="10"
                          x2="27"
                          y2="10"
                          stroke="currentColor"
                          stroke-width="2"
                        />
                        <path
                          d="M27,10 L33,14 L33,6 Z"
                          fill="currentColor"
                        />
                      </svg>
                      <span>箭头</span>
                    </div>
                  </a-doption>
                </template>
              </a-dropdown>
            </a-tooltip>
            <a-tooltip content="边颜色">
              <a-dropdown trigger="click">
                <a-button>
                  <template #icon>
                    <icon-palette />
                  </template>
                </a-button>
                <template #content>
                  <div class="EdgeColorPicker">
                    <div class="ColorRow">
                      <div
                        v-for="color in [
                          'default',
                          'var(--b3-font-background1)',
                          'var(--b3-font-background2)',
                          'var(--b3-font-background3)',
                          'var(--b3-font-background4)',
                          'var(--b3-font-background5)',
                          'var(--b3-font-background6)',
                        ]"
                        :key="color"
                        class="ColorItem"
                        :class="{ 'is-default': color === 'default' }"
                        :style="{
                          backgroundColor: color === 'default' ? 'var(--b3-theme-surface)' : color,
                          border: '1px solid var(--b3-border-color)',
                        }"
                        @click="onEdgeColorChange(color === 'default' ? 'var(--b3-theme-on-surface)' : color)"
                      />
                    </div>
                    <div class="ColorRow">
                      <div
                        v-for="color in [
                          'var(--b3-font-background7)',
                          'var(--b3-font-background8)',
                          'var(--b3-font-background9)',
                          'var(--b3-font-background10)',
                          'var(--b3-font-background11)',
                          'var(--b3-font-background12)',
                          'var(--b3-font-background13)',
                        ]"
                        :key="color"
                        class="ColorItem"
                        :style="{
                          backgroundColor: color,
                          border: '1px solid var(--b3-border-color)',
                        }"
                        @click="onEdgeColorChange(color)"
                      />
                    </div>
                  </div>
                </template>
              </a-dropdown>
            </a-tooltip>
            <slot name="edgeToolbarExtra" />
          </a-button-group>
        </template>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import SyIcon from '@/components/SiyuanTheme/SyIcon.vue'
import {
  Edge,
  useVueFlow,
} from '@vue-flow/core'
import {
  computed,
  ref,
  watch,
} from 'vue'

const props = defineProps<{
  showBasicControls?: boolean
  showExtraControls?: boolean
  isNodeToolbar?: boolean
  isEdgeToolbar?: boolean
  nodeId?: string
  edgeId?: string
  whiteBoardConfigData?: any
}>()

const emit = defineEmits<{
  toggleBackground: []
  fitView: []
  centerView: []
  removeNode: [nodeId: string]
  duplicateNode: [nodeId: string]
  removeEdge: [edgeId: string]
}>()

const {
  zoomIn,
  zoomOut,
  edges,
  setEdges,
  removeEdges,
} = useVueFlow()

const isEditingLabel = ref(false)
const editingLabelText = ref('')

const currentEdge = computed(() => {
  if (!props.edgeId) return null
  return edges.value.find((edge) => edge.id === props.edgeId)
})

const onFitView = () => {
  emit('fitView')
}

const onCenterView = () => {
  emit('centerView')
}

const onToggleBackground = () => {
  emit('toggleBackground')
}

const onZoomIn = () => {
  zoomIn()
}

const onZoomOut = () => {
  zoomOut()
}

const onRemoveNode = () => {
  if (props.nodeId) {
    emit('removeNode', props.nodeId)
  }
}

const onDuplicateNode = () => {
  if (props.nodeId) {
    emit('duplicateNode', props.nodeId)
  }
}

const onRemoveEdge = () => {
  if (props.edgeId) {
    const newEdges = edges.value.filter((edge) => edge.id !== props.edgeId)
    setEdges(newEdges)
  }
}

watch(currentEdge, (edge) => {
  editingLabelText.value = edge?.data?.label || ''
})

const saveLabelEdit = () => {
  if (props.edgeId) {
    const newEdges = edges.value.map((edge): Edge => {
      if (edge.id === props.edgeId) {
        const trimmedLabel = editingLabelText.value.trim()
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
  }
  isEditingLabel.value = false
}

const cancelEdit = () => {
  isEditingLabel.value = false
  editingLabelText.value = currentEdge.value?.data?.label || ''
}

const onEdgeTypeSelect = (type: string) => {
  if (!props.edgeId) return
  const newEdges = edges.value.map((edge): Edge => {
    if (edge.id === props.edgeId) {
      return {
        ...edge,
        data: {
          ...edge.data,
          edgeType: type,
        },
      }
    }
    return edge
  })
  setEdges(newEdges)
  if (props.whiteBoardConfigData) {
    props.whiteBoardConfigData.boardOptions.edges = newEdges
  }
}

const onEdgeWidthSelect = (width: string) => {
  if (!props.edgeId) return
  const newEdges = edges.value.map((edge): Edge => {
    if (edge.id === props.edgeId) {
      return {
        ...edge,
        data: {
          ...edge.data,
          width: Number.parseInt(width),
        },
      }
    }
    return edge
  })
  setEdges(newEdges)
  if (props.whiteBoardConfigData) {
    props.whiteBoardConfigData.boardOptions.edges = newEdges
  }
}

const onEdgeStyleSelect = (style: string) => {
  if (!props.edgeId) return
  const newEdges = edges.value.map((edge): Edge => {
    if (edge.id === props.edgeId) {
      return {
        ...edge,
        data: {
          ...edge.data,
          style,
        },
      }
    }
    return edge
  })
  setEdges(newEdges)
  if (props.whiteBoardConfigData) {
    props.whiteBoardConfigData.boardOptions.edges = newEdges
  }
}

const onEdgeColorChange = (color: string) => {
  if (!props.edgeId) return
  const newEdges = edges.value.map((edge): Edge => {
    if (edge.id === props.edgeId) {
      return {
        ...edge,
        data: {
          ...edge.data,
          color,
        },
      }
    }
    return edge
  })
  setEdges(newEdges)
  if (props.whiteBoardConfigData) {
    props.whiteBoardConfigData.boardOptions.edges = newEdges
  }
}

const onEdgeMarkerStartSelect = (marker: string) => {
  if (!props.edgeId) return
  const newEdges = edges.value.map((edge): Edge => {
    if (edge.id === props.edgeId) {
      return {
        ...edge,
        data: {
          ...edge.data,
          markerStart: marker,
        },
      }
    }
    return edge
  })
  setEdges(newEdges)
  if (props.whiteBoardConfigData) {
    props.whiteBoardConfigData.boardOptions.edges = newEdges
  }
}

const onEdgeMarkerEndSelect = (marker: string) => {
  if (!props.edgeId) return
  const newEdges = edges.value.map((edge): Edge => {
    if (edge.id === props.edgeId) {
      return {
        ...edge,
        data: {
          ...edge.data,
          markerEnd: marker,
        },
      }
    }
    return edge
  })
  setEdges(newEdges)
  if (props.whiteBoardConfigData) {
    props.whiteBoardConfigData.boardOptions.edges = newEdges
  }
}
</script>

<style lang="scss" scoped>
.EnWhiteBoardToolBar {
  pointer-events: all;
  --en-toolbar-base-offset: 8px;

  // 添加全局弹出菜单样式
  :deep(.arco-dropdown-menu) {
    background: var(--b3-theme-surface);
    border: 1px solid var(--b3-border-color);
    border-radius: var(--b3-border-radius);
    padding: 4px;
    box-shadow: 0 0 8px rgba(0, 0, 0, 0.1);

    .arco-dropdown-option {
      color: var(--b3-theme-on-surface);
      border-radius: var(--b3-border-radius);
      padding: 6px 8px;

      &:hover {
        background: var(--b3-theme-surface-light);
      }
    }
  }

  // 颜色选择器样式
  :deep(.arco-color-picker) {
    background: var(--b3-theme-surface);
    border: 1px solid var(--b3-border-color);
    border-radius: var(--b3-border-radius);
    box-shadow: 0 0 8px rgba(0, 0, 0, 0.1);

    .arco-color-picker-block {
      border-radius: var(--b3-border-radius);
    }

    .arco-color-picker-panel {
      background: var(--b3-theme-surface);
      border: none;

      .arco-color-picker-slider {
        background: var(--b3-theme-surface-light);
      }

      .arco-color-picker-input {
        background: var(--b3-theme-surface-light);
        color: var(--b3-theme-on-surface);
        border-color: var(--b3-border-color);
      }
    }
  }

  &:not(.is-node-toolbar):not(.is-edge-toolbar) {
    .ToolBarContent {
      .arco-btn-group {
        display: flex;
        flex-direction: column;
        background: var(--b3-theme-surface);
        border: 1px solid var(--b3-border-color);
        border-radius: var(--b3-border-radius);
        padding: 4px;
        box-shadow: 0 0 8px rgba(0, 0, 0, 0.1);

        .arco-btn {
          color: var(--b3-theme-on-surface);
          border: none;
          background: transparent;
          padding: 4px;
          border-radius: var(--b3-border-radius);

          &:not(:last-child) {
            margin-bottom: 4px;
          }

          &:hover {
            background: var(--b3-theme-surface-light);
          }
        }
      }
    }
  }

  &.is-node-toolbar,
  &.is-edge-toolbar {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    padding: var(--en-toolbar-base-offset);
    border-radius: var(--b3-border-radius);
    pointer-events: all;

    .ToolbarContent {
      background: var(--b3-theme-surface);
      border-radius: var(--b3-border-radius);
      padding: 4px;
      box-shadow: 0 0 8px rgba(0, 0, 0, 0.1);

      .arco-btn {
        color: var(--b3-theme-on-surface);
        border: none;
        background: transparent;
        padding: 4px;

        &:hover {
          background: var(--b3-theme-surface-light);
        }
      }
    }
  }
}

.LabelEditor {
  background: transparent;
  box-shadow: none;
  padding: 0;
  border-radius: 0;

  .arco-input-wrapper {
    background: transparent;
    border-color: var(--b3-border-color);
    min-width: 200px;
    height: 28px;

    .arco-input {
      color: var(--b3-theme-on-surface);
      height: 100%;
      line-height: 28px;
      &::placeholder {
        color: var(--b3-theme-on-surface-light);
      }
    }

    .arco-input-group-append {
      background: transparent;
      border: none;
      padding: 0;
      height: 100%;

      .arco-btn-group {
        height: 100%;
        display: flex;
        gap: 0;
      }
    }
  }

  .arco-btn {
    color: var(--b3-theme-on-surface);
    border: none;
    background: transparent;
    padding: 2px;
    height: 100%;
    width: 24px;
    border-radius: 0;

    &:hover {
      background: var(--b3-theme-surface-light);
    }

    &:last-child {
      border-top-right-radius: var(--b3-border-radius);
      border-bottom-right-radius: var(--b3-border-radius);
    }
  }
}

.EdgeTypeOption {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;

  svg {
    background: var(--b3-theme-surface-light);
    border-radius: var(--b3-border-radius);
    padding: 4px;
  }

  span {
    flex: 1;
  }
}

.EdgeColorPicker {
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;

  .ColorRow {
    display: flex;
    gap: 8px;

    .ColorItem {
      width: 24px;
      height: 24px;
      border-radius: var(--b3-border-radius);
      cursor: pointer;
      border: 1px solid var(--b3-border-color);
      transition: transform 0.15s ease-in-out;

      &:hover {
        transform: scale(1.1);
      }

      &.is-default {
        background: var(--b3-theme-surface);
      }
    }
  }
}
</style>
