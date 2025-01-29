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
        <a-button-group>
          <a-tooltip content="删除连线">
            <a-button @click="onRemoveEdge">
              <template #icon>
                <icon-delete />
              </template>
            </a-button>
          </a-tooltip>
          <slot name="edgeToolbarExtra" />
        </a-button-group>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import SyIcon from '@/components/SiyuanTheme/SyIcon.vue'
import { useVueFlow } from '@vue-flow/core'

const props = defineProps<{
  showBasicControls?: boolean
  showExtraControls?: boolean
  isNodeToolbar?: boolean
  isEdgeToolbar?: boolean
  nodeId?: string
  edgeId?: string
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
} = useVueFlow()

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
    emit('removeEdge', props.edgeId)
  }
}
</script>

<style lang="scss" scoped>
.EnWhiteBoardToolBar {
  pointer-events: all;

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
    padding: 4px;
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
</style>
