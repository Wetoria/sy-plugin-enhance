<template>
  <div
    class="EnWhiteBoardToolBar"
    :class="{
      'is-node-toolbar': isNodeToolbar,
      'is-edge-toolbar': isEdgeToolbar,
    }"
  >
    <!-- 使用EnWhiteBoardNodeFit组件 -->
    <EnWhiteBoardNodeFit
      v-if="nodeId"
      ref="nodeFitRef"
      :nodeId="nodeId"
      :whiteBoardConfigData="whiteBoardConfigData"
    />

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
          <a-tooltip :content="nodeData?.isCollapsed ? '展开节点' : '折叠节点'">
            <a-button @click="onCollapse">
              <template #icon>
                <icon-caret-down v-if="!nodeData?.isCollapsed" />
                <icon-caret-right v-else />
              </template>
            </a-button>
          </a-tooltip>
          
          <!-- Frame节点特有的按钮，只在nodeType为frame时显示 -->
          <template v-if="nodeType === 'frame'">
            <a-tooltip :content="'编辑标题: ' + (nodeData?.label || '未命名分组')">
              <a-button @click="onEditFrameLabel">
                <template #icon>
                  <icon-edit />
                </template>
              </a-button>
            </a-tooltip>
            
            <a-tooltip :content="isLocked ? '解锁分组' : '锁定分组'">
              <a-button @click="onToggleLock" :class="{ 'active': isLocked }">
                <template #icon>
                  <icon-lock v-if="isLocked" />
                  <icon-unlock v-else />
                </template>
              </a-button>
            </a-tooltip>
          </template>
          
          <!-- 节点颜色按钮（所有节点类型通用） -->
          <a-tooltip content="节点颜色">
            <a-dropdown trigger="click">
              <a-button>
                <template #icon>
                  <icon-palette />
                </template>
              </a-button>
              <template #content>
                <div class="NodeColorPicker">
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
                      @click="onNodeColorChange(color === 'default' ? 'clear' : color)"
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
                      @click="onNodeColorChange(color)"
                    />
                  </div>
                </div>
              </template>
            </a-dropdown>
          </a-tooltip>
          
          <!-- 其他普通节点专用按钮 -->
          <template v-if="nodeType !== 'frame'">
            <a-tooltip content="节点外观">
              <a-dropdown
                trigger="click"
                @select="onNodeStyleSelect"
              >
                <a-button>
                  <template #icon>
                    <icon-skin />
                  </template>
                </a-button>
                <template #content>
                  <a-doption value="default">
                    <div class="NodeStyleOption">
                      <span>默认样式</span>
                    </div>
                  </a-doption>
                  <a-doption value="inherit">
                    <div class="NodeStyleOption">
                      <span>继承原样式</span>
                    </div>
                  </a-doption>
                </template>
              </a-dropdown>
            </a-tooltip>
            <a-tooltip content="节点类型">
              <a-dropdown
                trigger="click"
                @select="onNodeTypeSelect"
              >
                <a-button>
                  <template #icon>
                    <icon-apps />
                  </template>
                </a-button>
                <template #content>
                  <a-doption value="protyle">
                    <div class="NodeTypeOption">
                      <icon-edit />
                      <span>普通节点</span>
                    </div>
                  </a-doption>
                  <a-doption value="mindmap">
                    <div class="NodeTypeOption">
                      <icon-mind-mapping />
                      <span>思维导图</span>
                    </div>
                  </a-doption>
                  <a-doption value="text">
                    <div class="NodeTypeOption">
                      <icon-file />
                      <span>文本节点</span>
                    </div>
                  </a-doption>
                  <a-doption value="gingko">
                    <div class="NodeTypeOption">
                      <icon-branch />
                      <span>树形卡片</span>
                    </div>
                  </a-doption>
                </template>
              </a-dropdown>
            </a-tooltip>
          </template>
          
          <a-tooltip :content="isAutoHeightEnabled ? '关闭自动高度' : '自动适配高度'">
            <a-button 
              @click="onAutoFitHeight"
              @mousedown="startLongPress"
              @mouseup="clearLongPress"
              @mouseleave="clearLongPress"
              @touchstart.prevent="startLongPress"
              @touchend.prevent="clearLongPress"
              @touchcancel.prevent="clearLongPress"
              :class="{'active-button': isAutoHeightEnabled}"
            >
              <template #icon>
                <IconExpand />
              </template>
            </a-button>
          </a-tooltip>
          <slot name="nodeToolbarExtra" />
          <a-tooltip content="在侧边栏中打开">
            <a-button @click="onOpenInSidebar">
              <template #icon>
                <icon-layout />
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
          <a-tooltip content="删除节点">
            <a-button
              class="danger-button"
              @click="onRemoveNode"
            >
              <template #icon>
                <icon-delete />
              </template>
            </a-button>
          </a-tooltip>
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
                    <icon-left />
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
                    <icon-right />
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
            <a-tooltip content="删除连线">
              <a-button
                class="danger-button"
                @click="onRemoveEdge"
              >
                <template #icon>
                  <icon-delete />
                </template>
              </a-button>
            </a-tooltip>
          </a-button-group>
        </template>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import SyIcon from '@/components/SiyuanTheme/SyIcon.vue'
import { IconExpand } from '@arco-design/web-vue/es/icon'
import {
  Edge,
  useVueFlow,
} from '@vue-flow/core'
import {
  computed,
  ref,
  watch,
  onBeforeUnmount,
} from 'vue'
import { EN_CONSTANTS } from '@/utils/Constants'
import { debounce } from '@/utils'
import EnWhiteBoardNodeFit from './components/EnWhiteBoardNodeFit.vue'

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
  openInSidebar: [nodeId: string]
  collapse: []
  editFrameLabel: [nodeId: string]
  toggleLock: [nodeId: string]
}>()

const {
  zoomIn,
  zoomOut,
  edges,
  setEdges,
  removeEdges,
  getNodes,
  setNodes,
} = useVueFlow()

const isEditingLabel = ref(false)
const editingLabelText = ref('')
const isCollapsed = ref(false)

const currentEdge = computed(() => {
  if (!props.edgeId) return null
  return edges.value.find((edge) => edge.id === props.edgeId)
})

const nodeData = computed(() => {
  if (!props.nodeId) return null
  const node = getNodes.value.find((node) => node.id === props.nodeId)
  return node?.data
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
    emit('removeEdge', props.edgeId)
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

const onNodeStyleSelect = (style: string) => {
  if (!props.nodeId) return

  const nodes = getNodes.value
  const newNodes = nodes.map((node) => {
    if (node.id === props.nodeId) {
      return {
        ...node,
        data: {
          ...node.data,
          style: {
            ...node.data?.style,
            variant: style,
          },
        },
      }
    }
    return node
  })

  setNodes(newNodes)
  if (props.whiteBoardConfigData) {
    props.whiteBoardConfigData.boardOptions.nodes = newNodes
  }
}

const onNodeColorChange = (color: string) => {
  if (!props.nodeId) return

  const nodes = getNodes.value
  const newNodes = nodes.map((node) => {
    if (node.id === props.nodeId) {
      // 检查是否为Frame节点
      const isFrame = node.type === EN_CONSTANTS.EN_WHITE_BOARD_NODE_TYPE_FRAME
      const newData = {
        ...node.data,
        style: {
          ...node.data?.style,
        },
      }

      if (color === 'clear') {
        delete newData.style.backgroundColor
      } else {
        newData.style.backgroundColor = color
        
        // 如果是Frame节点，同时更新边框颜色
        if (isFrame) {
          newData.style.borderColor = color
        }
      }

      return {
        ...node,
        data: newData,
      }
    }
    return node
  })

  setNodes(newNodes)
  if (props.whiteBoardConfigData) {
    props.whiteBoardConfigData.boardOptions.nodes = newNodes
  }
}

const onOpenInSidebar = () => {
  if (props.nodeId) {
    emit('openInSidebar', props.nodeId)
  }
}

const onCollapse = () => {
  emit('collapse')
}

const onNodeTypeSelect = (type: string) => {
  if (!props.nodeId) return

  const nodes = getNodes.value
  const newNodes = nodes.map((node) => {
    if (node.id === props.nodeId) {
      return {
        ...node,
        data: {
          ...node.data,
          nodeType: type,
          mindmap: type === 'mindmap', // 兼容现有的 mindmap 标记
          treecard: type === 'gingko', // 添加对树形卡片的支持
          class: type === 'gingko' ? 'treecard-node-transition' : '', // 添加过渡动画类
        },
      }
    }
    return node
  })

  setNodes(newNodes)
  if (props.whiteBoardConfigData) {
    props.whiteBoardConfigData.boardOptions.nodes = newNodes
  }
  
  // 如果切换为树形卡片类型，需要更新布局
  if (type === 'gingko') {
    const currentNode = nodes.find(node => node.id === props.nodeId)
    if (currentNode) {
      // 延迟执行以确保节点类型已更新
      setTimeout(() => {
        updateTreeCardLayout(props.nodeId, nodes)
      }, 50)
    }
  }
}

// 添加更新树形卡片布局的函数
const updateTreeCardLayout = (nodeId, nodes) => {
  const node = nodes.find(n => n.id === nodeId)
  if (!node) return
  
  // 查找所有相关的树形卡片节点
  const relatedNodes = new Set()
  
  // 向上查找父节点
  const findParents = (currentId) => {
    const current = nodes.find(n => n.id === currentId)
    if (!current) return
    
    if (current.data?.parentId) {
      const parent = nodes.find(n => n.id === current.data.parentId)
      if (parent && parent.data?.treecard) {
        relatedNodes.add(parent.id)
        findParents(parent.id)
      }
    }
  }
  
  // 向下查找子节点
  const findChildren = (currentId) => {
    const children = nodes.filter(n => n.data?.parentId === currentId)
    children.forEach(child => {
      if (child.data?.treecard) {
        relatedNodes.add(child.id)
        findChildren(child.id)
      }
    })
  }
  
  // 收集所有相关节点
  relatedNodes.add(nodeId)
  findParents(nodeId)
  findChildren(nodeId)
  
  // 更新所有相关节点的布局
  // 使用自定义事件触发布局更新
  Array.from(relatedNodes).forEach(id => {
    // 触发自定义事件，让相应的组件处理布局更新
    const event = new CustomEvent('update-treecard-layout', { 
      detail: { nodeId: id } 
    })
    document.dispatchEvent(event)
  })
}

// 添加长按相关的状态变量
const longPressTimer = ref(null)
const longPressDuration = 800 // 长按触发时间（毫秒）
const isLongPressing = ref(false) // 是否正在长按
const longPressCompleted = ref(false) // 长按是否已完成

// 引用节点高度适配组件
const nodeFitRef = ref(null)

// 自动高度状态改为使用nodeFit组件的状态
const isAutoHeightEnabled = computed(() => {
  return nodeFitRef.value?.isAutoHeightEnabled?.value || false
})

// 清除长按状态
const clearLongPress = () => {
  // 如果长按已完成且仍在长按状态，触发开关切换
  if (isLongPressing.value && longPressCompleted.value) {
    // 切换自动高度状态
    nodeFitRef.value?.toggleAutoHeight()
  } else if (isLongPressing.value && !longPressCompleted.value) {
    // 如果是短按，执行一次高度调整，但不改变自动高度状态
    nodeFitRef.value?.adjustNodeHeight()
  }
  
  // 重置长按状态
  if (longPressTimer.value) {
    clearTimeout(longPressTimer.value)
    longPressTimer.value = null
  }
  isLongPressing.value = false
  longPressCompleted.value = false
}

// 长按开始
const startLongPress = () => {
  // 先清除可能存在的定时器
  if (longPressTimer.value) {
    clearTimeout(longPressTimer.value)
    longPressTimer.value = null
  }
  
  // 设置长按状态
  isLongPressing.value = true
  longPressCompleted.value = false
  
  // 设置长按定时器
  longPressTimer.value = setTimeout(() => {
    // 标记长按已完成
    longPressCompleted.value = true
  }, longPressDuration)
}

// 自动适配高度函数 - 现在只处理单击情况
const onAutoFitHeight = () => {
  // 忽略事件处理，真正的逻辑由 mousedown/up 或 touchstart/end 事件处理
  // 这里什么也不做，因为Vue会自动触发这个点击事件
}

// 组件卸载时清理
onBeforeUnmount(() => {
  // 清理长按定时器
  if (longPressTimer.value) {
    clearTimeout(longPressTimer.value)
    longPressTimer.value = null
  }
})

// 添加Frame节点相关的属性
const nodeType = computed(() => {
  const node = getNodes.value.find((n) => n.id === props.nodeId)
  return node?.type === EN_CONSTANTS.EN_WHITE_BOARD_NODE_TYPE_FRAME ? 'frame' : 'normal'
})

// Frame节点的锁定状态
const isLocked = computed(() => {
  const node = getNodes.value.find((n) => n.id === props.nodeId)
  return node?.data?.isLocked || false
})

// Frame节点编辑标题方法
const onEditFrameLabel = () => {
  emit('editFrameLabel', props.nodeId)
}

// Frame节点锁定/解锁方法
const onToggleLock = () => {
  emit('toggleLock', props.nodeId)
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
        
        &.active-button {
          background-color: var(--b3-theme-primary-light) !important;
          color: var(--b3-theme-on-primary) !important;
        }
      }
    }
  }

  // 添加删除按钮的危险样式
  .danger-button {
    color: var(--b3-theme-error) !important;

    &:hover {
      background: var(--b3-theme-error-light) !important;
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
      display: flex;
      align-items: center;
      justify-content: center;

      &:hover {
        transform: scale(1.1);
      }

      &.is-clear {
        background: var(--b3-theme-surface);
        color: var(--b3-theme-on-surface);
      }
    }
  }
}

.NodeStyleOption,
.NodeTemplateOption {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;

  span {
    flex: 1;
  }
}

.NodeColorPicker {
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
      display: flex;
      align-items: center;
      justify-content: center;

      &:hover {
        transform: scale(1.1);
      }

      &.is-clear {
        background: var(--b3-theme-surface);
        color: var(--b3-theme-on-surface);
      }
    }
  }
}

.main {
  &.collapsed {
    height: 0;
    overflow: hidden;
  }
}
</style>

