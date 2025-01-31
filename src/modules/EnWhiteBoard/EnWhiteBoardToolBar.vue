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
              @keyup.esc="cancelLabelEdit"
            >
              <template #append>
                <a-button-group>
                  <a-button @click="saveLabelEdit">
                    <template #icon>
                      <icon-check />
                    </template>
                  </a-button>
                  <a-button @click="cancelLabelEdit">
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
              <a-button @click="isEditingLabel = true">
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
                    平滑阶梯
                  </a-doption>
                  <a-doption value="step">
                    阶梯
                  </a-doption>
                  <a-doption value="straight">
                    直线
                  </a-doption>
                  <a-doption value="bezier">
                    贝塞尔曲线
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
                    细
                  </a-doption>
                  <a-doption value="2">
                    中
                  </a-doption>
                  <a-doption value="3">
                    粗
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
                    实线
                  </a-doption>
                  <a-doption value="dashed">
                    虚线
                  </a-doption>
                  <a-doption value="dotted">
                    点线
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
                    无
                  </a-doption>
                  <a-doption value="circle-solid">
                    实心圆点
                  </a-doption>
                  <a-doption value="line">
                    横线
                  </a-doption>
                  <a-doption value="circle-hollow">
                    空心圆点
                  </a-doption>
                  <a-doption value="arrow-start">
                    箭头
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
                    无
                  </a-doption>
                  <a-doption value="circle-solid">
                    实心圆点
                  </a-doption>
                  <a-doption value="line">
                    横线
                  </a-doption>
                  <a-doption value="circle-hollow">
                    空心圆点
                  </a-doption>
                  <a-doption value="arrow">
                    箭头
                  </a-doption>
                </template>
              </a-dropdown>
            </a-tooltip>
            <a-tooltip content="边动画">
              <a-dropdown
                trigger="click"
                @select="onEdgeAnimationSelect"
              >
                <a-button>
                  <template #icon>
                    <icon-play-circle />
                  </template>
                </a-button>
                <template #content>
                  <a-doption value="none">
                    无
                  </a-doption>
                  <a-doption value="flow">
                    流动
                  </a-doption>
                  <a-doption value="pulse">
                    脉冲
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
                  <a-color-picker @change="onEdgeColorChange" />
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

const saveLabelEdit = () => {
  if (props.edgeId && editingLabelText.value) {
    const newEdges = edges.value.map((edge): Edge => {
      if (edge.id === props.edgeId) {
        return {
          ...edge,
          data: {
            ...edge.data,
            label: editingLabelText.value,
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
  isEditingLabel.value = false
}

const cancelLabelEdit = () => {
  isEditingLabel.value = false
  editingLabelText.value = ''
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

const onEdgeAnimationSelect = (animation: string) => {
  if (!props.edgeId) return
  const newEdges = edges.value.map((edge): Edge => {
    if (edge.id === props.edgeId) {
      return {
        ...edge,
        data: {
          ...edge.data,
          animation,
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

watch(currentEdge, (edge) => {
  if (edge?.data?.label) {
    editingLabelText.value = edge.data.label
  }
})
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
</style>
