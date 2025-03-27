<template>
  <NodeToolbar
    :position="Position.Top"
    :is-visible="isSelected"
    :node-id="flowNode.id"
    class="EnWhiteBoardNodeToolbar"
    :style="{
      transform: 'translateY(-8px)',
    }"
  >
    <EnWhiteBoardToolBar
      :is-node-toolbar="true"
      :node-id="flowNode.id"
      :style="{ transform: 'translateY(-8px)' }"
      @remove-node="handleRemoveNode"
      @duplicate-node="handleDuplicateNode"
      @collapse="collapseRef?.toggleCollapse()"
      @edit-frame-label="editFrameLabel"
      @toggle-lock="toggleLock"
    />
  </NodeToolbar>

  <!-- 引入折叠组件 -->
  <EnWhiteBoardNodeCollapse
    ref="collapseRef"
    :nodeId="flowNode.id"
    :initialCollapsed="flowNode.data?.isCollapsed || false"
    @update:isCollapsed="(val) => isCollapsed = val"
  />

  <div
    ref="containerRef"
    class="EnWhiteBoardNodeFrameContainer"
    :class="{
      'is-collapsed': isCollapsed,
      'is-selected': isSelected,
      'is-dragging': isDragging,
      'can-drop': canDrop,
      'is-locked': isLocked,
      'is-dragover': onDragover,
    }"
    :data-en-flow-node-id="flowNode.id"
    :style="{
      '--en-frame-width': `${(flowNode as any).dimensions?.width || 0}px`,
      '--en-frame-height': `${(flowNode as any).dimensions?.height || (flowNode as any).height || 0}px`,
      '--frame-color': nodeData.style?.backgroundColor || 'var(--b3-border-color)',
      'backgroundColor': `color-mix(in srgb, ${nodeData.style?.backgroundColor || 'var(--b3-border-color)'} 15%, transparent)`,
      'borderColor': nodeData.style?.borderColor || nodeData.style?.backgroundColor || 'var(--b3-border-color)',
      'borderStyle': nodeData.style?.borderStyle || 'solid',
    }"
    @mousedown="handleMouseDown"
    @mouseup="handleMouseUp"
    @contextmenu="handleContextMenu"
    @click="handleFrameClick"
    @dragover="handleDragOver"
    @dragleave="handleDragLeave"
    @drop="handleDrop"
  >
    <!-- 添加EnWhiteBoardNodeFit组件 -->
    <EnWhiteBoardNodeFit
      :nodeId="flowNode.id"
      @height-changed="onHeightChanged"
    />
    
    <div
      class="FrameToolbarArea"
      :style="{
        transform: `translate(0, calc(-100% - 4px)) scale(${1 / (viewport?.zoom || 1)})`,
        transformOrigin: 'left bottom',
      }"
    >
      <div class="infos">
        <span 
          class="frame-title" 
          @dblclick.stop="onTitleDblClick"
        >
          <input
            v-if="isEditingTitle"
            ref="titleInputRef"
            v-model="editingTitle"
            class="frame-title-input"
            @blur="finishTitleEdit"
            @keydown.enter="finishTitleEdit"
            @keydown.esc="isEditingTitle = false"
          />
          <span v-else>{{ nodeData.label || '未命名分组' }}</span>
        </span>
        <span class="child-count">{{ childNodes.length }}</span>
        <span class="child-info" v-if="nodeData.childNodeIds && nodeData.childNodeIds.length > 0" title="嵌套节点ID列表">
          ({{ nodeData.childNodeIds.length }})
        </span>
      </div>
    </div>

    <div
      v-show="!isCollapsed"
      class="frame-content"
    >
      <slot />
    </div>

    <NodeResizer
      v-if="!isCollapsed"
      :min-width="200"
      :min-height="100"
      color="transparent"
      @resize="onResize"
    />

    <Handle
      v-for="position in ['top', 'right', 'bottom', 'left']"
      :id="position"
      :key="position"
      class="Handle"
      :class="[position]"
      type="source"
      :position="Position[position.charAt(0).toUpperCase() + position.slice(1)]"
    >
      <div class="HandleIcon">
        <component :is="handleIcons[position]" />
      </div>
    </Handle>
  </div>

  <Teleport to="body">
    <div
      v-if="contextMenuVisible"
      class="EnWhiteBoardFrameContextMenu"
      :style="{
        left: `${contextMenuPosition.x}px`,
        top: `${contextMenuPosition.y}px`,
      }"
    >
      <div class="MenuGroup">
        <div
          class="ContextMenuItem"
          @click="editFrameLabel"
        >
          <IconEdit />
          <span>编辑标题</span>
        </div>
        <div
          class="ContextMenuItem"
          @click="createNodeInFrame"
        >
          <IconPlus />
          <span>创建新节点</span>
        </div>
      </div>

      <div class="MenuGroup">
        <div
          v-if="getSelectedNodes.length > 0"
          class="ContextMenuItem"
          @click="addSelectedNodesToFrame"
        >
          <IconPlus />
          <span>添加选中节点到分组</span>
        </div>
        <div
          v-if="childNodes.length > 0"
          class="ContextMenuItem"
          @click="removeNodesFromFrame"
        >
          <IconPlus />
          <span>从分组中移除选中节点</span>
        </div>
      </div>

      <div class="MenuGroup">
        <div class="ContextMenuItem" @click="toggleLock">
          <IconLock v-if="isLocked" />
          <IconUnlock v-else />
          <span>{{ isLocked ? '解锁分组' : '锁定分组' }}</span>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { getNewDailyNoteBlockId } from '@/modules/DailyNote/DailyNote'
import {
  generateWhiteBoardNodeId,
  useWhiteBoardModule,
} from '@/modules/EnWhiteBoard/EnWhiteBoard'

import { EN_CONSTANTS, EN_EVENT_BUS_KEYS } from '@/utils/Constants'
import { enEventBus } from '@/utils/EnEventBus'
import {
  IconArrowDown,
  IconArrowLeft,
  IconArrowRight,
  IconArrowUp,
  IconPlus,
  IconLock,
  IconUnlock,
  IconCopy,
  IconToTop,
  IconToBottom,
  IconPalette,
  IconAlignLeft,
  IconAlignCenter,
  IconAlignRight,
  IconUp,
  IconMinus,
  IconDown,
  IconLeft,
  IconRight,
  IconEdit,
} from '@arco-design/web-vue/es/icon'
import {
  Handle,
  Position,
  useNode,
  useVueFlow,
  Node as VueFlowNode,
} from '@vue-flow/core'
import {
  NodeResizer,
  OnResize,
} from '@vue-flow/node-resizer'
import { NodeToolbar } from '@vue-flow/node-toolbar'
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
  onUnmounted,
} from 'vue'
import EnWhiteBoardToolBar from './EnWhiteBoardToolBar.vue'

// 导入创建块所需的函数
import { appendBlockInto } from '@/utils/Block'
import { useDailyNote, appendBlockIntoDailyNote, getAppendedDailyNoteBlockId } from '@/modules/DailyNote/DailyNote'
import { setBlockAttrs, updateBlock } from '@/api'
import EnWhiteBoardNodeCollapse from './components/EnWhiteBoardNodeCollapse.vue'

// 添加EnWhiteBoardNodeFit组件的导入
import EnWhiteBoardNodeFit from './components/EnWhiteBoardNodeFit.vue'

const handleIcons = {
  top: IconArrowUp,
  right: IconArrowRight,
  bottom: IconArrowDown,
  left: IconArrowLeft,
}

const {
  node: flowNode,
} = useNode()

const {
  addNodes,
  getSelectedNodes,
  getNodes,
  setNodes,
  removeNodes,
  viewport,
  addSelectedNodes,
  removeSelectedNodes,
  onNodeDragStop,
  onNodesChange,
} = useVueFlow()

const nodeData = computed(() => flowNode.data)
const containerRef = ref<HTMLDivElement | null>(null)

// 引用折叠组件实例
const collapseRef = ref()

// 使用ref绑定折叠状态，这个变量仍然需要，但由折叠组件通过事件更新
const isCollapsed = ref(false)

const dragStartPos = ref({
  x: 0,
  y: 0,
})
const isDragging = ref(false)
const containedNodes = ref<VueFlowNode[]>([])
const canDrop = ref(false)

// 修改子节点计算方法，确保只统计节点而不包括边
const childNodes = computed(() => {
  // 只获取节点类型的子元素，排除边
  const children = getNodes.value.filter((node) => {
    // 过滤条件1: 必须是父节点ID匹配当前Frame
    const isChild = node.data?.parentId === flowNode.id
    
    // 过滤条件2: 必须是节点，不是边
    // 所有节点都有type属性，而边没有type属性或type值不同
    const isNode = node.type && node.type.startsWith('EnWhiteBoardNode')
    
    // 同时满足这两个条件才算是子节点
    return isChild && isNode
  })
  
  // 更新frame节点的childNodeIds字段
  if (children.length > 0) {
    const childNodeIds = children.map(node => node.id)
    
    // 检查是否需要更新frame节点数据
    if (!flowNode.data.childNodeIds || 
        JSON.stringify(flowNode.data.childNodeIds) !== JSON.stringify(childNodeIds)) {
      
      // 更新节点数据
      const updatedNodes = getNodes.value.map(node => {
        if (node.id === flowNode.id) {
          return {
            ...node,
            data: {
              ...node.data,
              childNodeIds
            }
          }
        }
        return node
      })
      
      // 更新节点列表（使用nextTick避免可能的循环更新）
      nextTick(() => {
        setNodes(updatedNodes)
        
        // 更新思源中的frame块内容，将子节点以引用的形式写入
        syncFrameContent()
      })
    }
  } else if (flowNode.data.childNodeIds && flowNode.data.childNodeIds.length > 0) {
    // 如果没有子节点但childNodeIds不为空，则清空它
    const updatedNodes = getNodes.value.map(node => {
      if (node.id === flowNode.id) {
        return {
          ...node,
          data: {
            ...node.data,
            childNodeIds: []
          }
        }
      }
      return node
    })
    
    nextTick(() => {
      setNodes(updatedNodes)
      
      // 更新思源中的frame块内容，清空引用
      syncFrameContent()
    })
  }
  
  return children
})

// 同步Frame内容到思源
const syncFrameContent = async () => {
  // 如果frame节点没有blockId，说明还没有创建对应的思源块
  if (!flowNode.data.blockId) {
    // 如果有子节点，创建一个思源块
    if (childNodes.value.length > 0) {
      createSiyuanBlock()
    }
    return
  }
  
  try {
    // 获取当前Frame标题
    const frameLabel = flowNode.data.label || '未命名分组'
    
    // 创建超级块内容
    let content = '{{{row\n'
    
    // 标题块
    content += `# ${frameLabel}\n\n`
    
    // 列表块 - 使用列表形式呈现嵌套节点引用
    if (childNodes.value.length > 0) {
      // 为每个子节点创建一个列表项，使用块引用
      childNodes.value.forEach(node => {
        if (node.data.blockId) {
          content += `* ((${node.data.blockId} "${node.data.label || '节点'}"))\n`
        } else {
          content += `* ${node.type.replace('EnWhiteBoardNode', '')}节点\n`
        }
      })
    } else {
      // 当没有子节点时，保留一个空的列表项占位
      content += '* 该分组中的节点将显示在这里\n'
    }
    
    // 关闭超级块
    content += '}}}'
    
    // 更新思源块 - 使用正确的参数顺序
    await updateBlock(
      'markdown',
      content,
      flowNode.data.blockId
    )
    
    console.log(`Frame "${frameLabel}" 内容已同步，包含${childNodes.value.length}个子节点`)
  } catch (error) {
    console.error('同步Frame内容失败:', error)
  }
}

// 为Frame创建思源块，使用超级块的形式
const createSiyuanBlock = async () => {
  try {
    // 获取白板配置
    const { moduleOptions } = useWhiteBoardModule()
    const notebookId = moduleOptions.value.notebookId
    const targetId = moduleOptions.value.targetId
    
    // 获取当前Frame标题
    const frameLabel = flowNode.data.label || '未命名分组'
    
    // 创建超级块内容
    let content = '{{{row\n'
    
    // 标题块
    content += `# ${frameLabel}\n\n`
    
    // 列表块 - 使用列表形式呈现嵌套节点引用
    if (childNodes.value.length > 0) {
      // 为每个子节点创建一个列表项，使用块引用
      childNodes.value.forEach(node => {
        if (node.data.blockId) {
          content += `* ((${node.data.blockId} "${node.data.label || '节点'}"))\n`
        } else {
          content += `* ${node.type.replace('EnWhiteBoardNode', '')}节点\n`
        }
      })
    } else {
      // 当没有子节点时，保留一个空的列表项占位
      content += '* 该分组中的节点将显示在这里\n'
    }
    
    // 关闭超级块
    content += '}}}'
    
    // 创建块
    let blockId = ''
    
    if (notebookId && targetId) {
      blockId = await appendBlockInto(notebookId, targetId, content)
    } else {
      const daily = useDailyNote()
      const dailyNoteId = daily.moduleOptions.value.dailyNoteNotebookId
      const res = await appendBlockIntoDailyNote('markdown', content, dailyNoteId)
      blockId = getAppendedDailyNoteBlockId(res)
    }
    
    if (!blockId) {
      console.error('创建Frame块失败')
      return
    }
    
    // 设置块属性
    await setBlockAttrs(blockId, {
      'custom-en-whiteboard-frame': 'true',
      'custom-en-whiteboard-node-id': flowNode.id,
    })
    
    // 更新节点，添加blockId
    const updatedNodes = getNodes.value.map(node => {
      if (node.id === flowNode.id) {
        return {
          ...node,
          data: {
            ...node.data,
            blockId,
          }
        }
      }
      return node
    })
    
    setNodes(updatedNodes)
    
  } catch (error) {
    console.error('创建Frame块失败:', error)
  }
}

// 添加拖拽放置处理
const onDrop = ref(false)
const onDragover = ref(false)

// 添加拖拽事件处理函数
const handleDragOver = (event: DragEvent) => {
  event.preventDefault()
  // 标记当前Frame可以接收拖拽
  canDrop.value = true
  onDragover.value = true
}

const handleDragLeave = (event: DragEvent) => {
  event.preventDefault()
  // 取消标记
  canDrop.value = false
  onDragover.value = false
}

// 修改Frame的onDrop处理函数，只要节点拖入Frame就建立父子关系
const handleDrop = (event: DragEvent) => {
  event.preventDefault()
  event.stopPropagation()
  onDrop.value = true
  
  try {
    // 1. 从HTML5拖拽API获取节点ID
    const draggedNodeId = event.dataTransfer?.getData('application/vueflow/node-id')
    
    // 2. 如果成功获取到ID，建立父子关系
    if (draggedNodeId) {
      const draggedNode = getNodes.value.find(node => node.id === draggedNodeId)
      if (draggedNode) {
        updateNodeParent(draggedNodeId, flowNode.id)
        console.log(`节点 ${draggedNodeId} 已通过拖拽添加到Frame ${flowNode.id}`)
      }
    } 
    // 3. 如果没有获取到ID，尝试查找当前正在拖拽的节点
    else {
      const draggingNodes = getNodes.value.filter(node => node.dragging)
      draggingNodes.forEach(node => {
        if (node.id !== flowNode.id) {
          updateNodeParent(node.id, flowNode.id)
          console.log(`节点 ${node.id} 已通过拖拽状态添加到Frame ${flowNode.id}`)
        }
      })
    }
  } catch (error) {
    console.error('处理节点拖放时出错:', error)
  }
  
  // 重置状态
  canDrop.value = false
  onDragover.value = false
  onDrop.value = false
}

/**
 * 检查节点是否在Frame内部
 * @param {Object} node 要检查的节点
 * @param {boolean} strictCheck 是否使用严格检查(true:完全边界检查,false:中心点检查)
 * @return {boolean} 节点是否在Frame内
 */
const isNodeInside = (node, strictCheck = false) => {
  if (!node || !node.position) return false
  
  // 获取Frame的边界
  const frameX = flowNode.position.x
  const frameY = flowNode.position.y
  const frameWidth = typeof flowNode.width === 'number' ? flowNode.width : 0
  const frameHeight = typeof flowNode.height === 'number' ? flowNode.height : 0
  
  if (frameWidth === 0 || frameHeight === 0) return false
  
  // 计算Frame的边界
  const frameLeft = frameX
  const frameRight = frameX + frameWidth
  const frameTop = frameY
  const frameBottom = frameY + frameHeight
  
  // 获取节点的尺寸
  const nodeWidth = typeof node.width === 'number' ? node.width : 0
  const nodeHeight = typeof node.height === 'number' ? node.height : 0
  
  // 节点的坐标
  const nodeX = node.position.x
  const nodeY = node.position.y
  
  // 节点的边界
  const nodeLeft = nodeX
  const nodeRight = nodeX + nodeWidth
  const nodeTop = nodeY
  const nodeBottom = nodeY + nodeHeight
  
  // 计算节点中心点
  const nodeCenterX = nodeX + nodeWidth / 2
  const nodeCenterY = nodeY + nodeHeight / 2
  
  // 对于Frame类型节点的特殊处理
  if (node.type === EN_CONSTANTS.EN_WHITE_BOARD_NODE_TYPE_FRAME) {
    if (strictCheck) {
      // 计算重叠区域
      const overlapLeft = Math.max(nodeLeft, frameLeft)
      const overlapRight = Math.min(nodeRight, frameRight)
      const overlapTop = Math.max(nodeTop, frameTop)
      const overlapBottom = Math.min(nodeBottom, frameBottom)
      
      // 如果没有重叠，则返回false
      if (overlapLeft >= overlapRight || overlapTop >= overlapBottom) return false
      
      // 计算重叠面积
      const overlapArea = (overlapRight - overlapLeft) * (overlapBottom - overlapTop)
      
      // 计算节点面积
      const nodeArea = nodeWidth * nodeHeight
      
      // 如果重叠面积超过节点面积的80%，则认为它在Frame内
      return nodeArea > 0 ? (overlapArea >= nodeArea * 0.8) : false
    } else {
      // 使用中心点加部分边界检查
      return (
        nodeCenterX >= frameLeft &&
        nodeCenterX <= frameRight &&
        nodeCenterY >= frameTop &&
        nodeCenterY <= frameBottom &&
        // 至少有50%的边界在Frame内
        (
          (nodeLeft >= frameLeft || nodeRight >= frameRight) &&
          (nodeTop >= frameTop || nodeBottom >= frameBottom)
        )
      )
    }
  }
  
  // 对于普通节点
  if (strictCheck) {
    // 严格检查要求节点完全在Frame内
    return (
      nodeLeft >= frameLeft &&
      nodeRight <= frameRight &&
      nodeTop >= frameTop &&
      nodeBottom <= frameBottom
    )
  } else {
    // 非严格检查只要求节点中心点在Frame内
    return (
      nodeCenterX >= frameLeft &&
      nodeCenterX <= frameRight &&
      nodeCenterY >= frameTop &&
      nodeCenterY <= frameBottom
    )
  }
}

// 修改throttledCheck函数定义
let lastCheckTime = 0
let throttleTimer = null
const CHECK_INTERVAL = 300 // 增加到300ms，大幅降低频率

const throttledCheck = () => {
  if (throttleTimer) {
    return // 如果已经有计划中的更新，跳过
  }
  
  const now = Date.now()
  
  // 如果正在拖动或者距离上次检查时间不够长，则延迟执行
  if (isDragging.value || now - lastCheckTime < CHECK_INTERVAL) {
    // 使用setTimeout代替立即执行，按间隔执行
    throttleTimer = setTimeout(() => {
      if (!isDragging.value) { // 再次确认没有处于拖动状态
        checkNodesInFrameBoundary()
        highlightPotentialNodes()
        lastCheckTime = Date.now()
      }
      throttleTimer = null
    }, CHECK_INTERVAL)
    return
  }
  
  // 如果时间间隔足够长且不在拖动，直接执行
  if (!isDragging.value) {
    checkNodesInFrameBoundary()
    highlightPotentialNodes()
    lastCheckTime = now
  }
}

/**
 * 找出包含指定节点的最内层Frame
 * @param {Object} targetNode 目标节点
 * @return {string|null} 包含目标节点的最内层Frame的ID，如果没有则返回null
 */
const findContainingFrame = (targetNode) => {
  // 如果节点没有位置属性，则无法确定包含关系
  if (!targetNode.position) return null

  // 获取所有Frame类型的节点
  const allFrameNodes = getNodes.value.filter(
    node => node.type === EN_CONSTANTS.EN_WHITE_BOARD_NODE_TYPE_FRAME && node.id !== targetNode.id
  )
  
  // 如果没有其他Frame节点，则返回null
  if (allFrameNodes.length === 0) return null
  
  // 计算目标节点的中心点和边界
  const targetWidth = typeof targetNode.width === 'number' ? targetNode.width : 0
  const targetHeight = typeof targetNode.height === 'number' ? targetNode.height : 0
  
  const targetNodeBounds = {
    x: targetNode.position.x,
    y: targetNode.position.y,
    width: targetWidth,
    height: targetHeight,
    // 为了更精确，考虑所有边界
    left: targetNode.position.x,
    right: targetNode.position.x + targetWidth,
    top: targetNode.position.y,
    bottom: targetNode.position.y + targetHeight
  }
  
  // 找出所有包含该节点的Frame
  const containingFrames = allFrameNodes.filter(frameNode => {
    // 排除没有尺寸信息的Frame
    const frameWidth = typeof frameNode.width === 'number' ? frameNode.width : 0
    const frameHeight = typeof frameNode.height === 'number' ? frameNode.height : 0
    
    if (frameWidth === 0 || frameHeight === 0) return false
    
    // 获取Frame的边界
    const frameBounds = {
      left: frameNode.position.x,
      right: frameNode.position.x + frameWidth,
      top: frameNode.position.y,
      bottom: frameNode.position.y + frameHeight
    }
    
    // 检查节点是否完全位于Frame内部
    // 为Frame类型的节点，要求其80%的面积在内部
    if (targetNode.type === EN_CONSTANTS.EN_WHITE_BOARD_NODE_TYPE_FRAME) {
      // 计算重叠区域
      const overlapLeft = Math.max(targetNodeBounds.left, frameBounds.left)
      const overlapRight = Math.min(targetNodeBounds.right, frameBounds.right)
      const overlapTop = Math.max(targetNodeBounds.top, frameBounds.top)
      const overlapBottom = Math.min(targetNodeBounds.bottom, frameBounds.bottom)
      
      // 如果没有重叠，则返回false
      if (overlapLeft >= overlapRight || overlapTop >= overlapBottom) return false
      
      // 计算重叠面积
      const overlapArea = (overlapRight - overlapLeft) * (overlapBottom - overlapTop)
      // 计算目标节点面积
      const targetArea = targetWidth * targetHeight
      
      
      // 如果重叠面积超过目标节点面积的80%，则认为它在Frame内
      return targetArea > 0 ? (overlapArea >= targetArea * 0.8) : false
    } else {
      // 对于普通节点，检查节点中心点和边界是否在Frame内
      return (
        targetNodeBounds.left >= frameBounds.left &&
        targetNodeBounds.right <= frameBounds.right &&
        targetNodeBounds.top >= frameBounds.top &&
        targetNodeBounds.bottom <= frameBounds.bottom
      )
    }
  })
  
  // 如果没有包含该节点的Frame，则返回null
  if (containingFrames.length === 0) return null
  
  // 按照面积从小到大排序，找出最内层的Frame
  containingFrames.sort((a, b) => {
    const aWidth = typeof a.width === 'number' ? a.width : 0
    const aHeight = typeof a.height === 'number' ? a.height : 0
    const bWidth = typeof b.width === 'number' ? b.width : 0
    const bHeight = typeof b.height === 'number' ? b.height : 0
    
    const areaA = aWidth * aHeight
    const areaB = bWidth * bHeight
    return areaA - areaB
  })
  
  // 返回最内层Frame的ID
  return containingFrames[0].id
}

/**
 * 检查节点是否在Frame边界内
 * 此函数用于确定其他节点与当前Frame的父子关系
 */
const checkNodesInFrameBoundary = () => {
  // 获取所有节点，排除当前Frame及锁定的节点
  const otherNodes = getNodes.value.filter(
    node => node.id !== flowNode.id && !node.data?.locked
  )
  
  if (otherNodes.length === 0) return
  
  // 遍历检查每个节点
  for (const node of otherNodes) {
    // 对于Frame类型节点的特殊处理
    if (node.type === EN_CONSTANTS.EN_WHITE_BOARD_NODE_TYPE_FRAME) {
      // 检查该Frame是否在此Frame内
      const isInside = isNodeInside(node, true)
      
      // 找到该Frame当前的父Frame(如果有)
      const containingFrameId = findContainingFrame(node)
      
      // 如果视觉上在此Frame内，且当前不是其父节点，则设置父子关系
      if (isInside && containingFrameId === flowNode.id && node.data?.parentId !== flowNode.id) {
        console.log(`嵌套Frame ${node.id} 加入Frame ${flowNode.id}`)
        updateNodeParent(node.id, flowNode.id)
      }
      // 如果视觉上不在此Frame内，但当前是其父节点，则移除父子关系
      else if (!isInside && node.data?.parentId === flowNode.id) {
        console.log(`嵌套Frame ${node.id} 离开Frame ${flowNode.id}`)
        updateNodeParent(node.id, null)
      }
      continue // 处理完Frame类型后继续下一个节点
    }
    
    // 普通节点处理
    const isNodeInsideFrame = isNodeInside(node, true)
    
    // 找到该节点当前的父Frame(如果有)
    const containingFrameId = findContainingFrame(node)
    
    // 如果节点在此Frame内，且当前不是其父节点
    if (isNodeInsideFrame && containingFrameId === flowNode.id && node.data?.parentId !== flowNode.id) {
      console.log(`节点 ${node.id} 加入Frame ${flowNode.id}`)
      updateNodeParent(node.id, flowNode.id)
    }
    // 如果节点不在此Frame内，但当前是其父节点
    else if (!isNodeInsideFrame && node.data?.parentId === flowNode.id) {
      console.log(`节点 ${node.id} 离开Frame ${flowNode.id}`)
      updateNodeParent(node.id, null)
    }
  }
}

// 添加一个缓存变量用于存储拖拽过程中的子节点ID
const dragChildNodesCache = ref<string[]>([])

// 修改鼠标按下事件处理函数，在拖拽开始时预先获取所有子节点
const handleMouseDown = (event: MouseEvent) => {
  // 如果已锁定，则不允许拖动
  if (isLocked.value) {
    event.stopPropagation()
    return
  }

  // 阻止事件冒泡，确保不会触发其他节点的选择
  event.stopPropagation()

  // 记录当前拖拽的起始位置
  dragStartPos.value = {
    x: event.clientX,
    y: event.clientY
  }
  
  // 选中Frame本身，但不影响其他已选中的节点
  // 这样可以避免在操作Frame时意外取消其他选择
  setNodes(nodes => 
    nodes.map(node => {
      if (node.id === flowNode.id) {
        return { ...node, selected: true }
      }
      return node
    })
  )
  
  // 设置拖拽状态
  isDragging.value = true
  
  // 在拖拽开始时获取所有需要移动的子节点ID（包括嵌套节点）
  getAllChildNodeIds()
  
  // 添加拖拽期间的鼠标移动监听
  document.addEventListener('mousemove', handleFrameDrag)
  
  // 设置鼠标抬起时的事件处理
  document.addEventListener('mouseup', handleMouseUpGlobal)
}

// 添加获取所有子节点ID的函数，仅在拖拽开始时调用一次
const getAllChildNodeIds = () => {
  // 清空缓存
  dragChildNodesCache.value = []
  
  // 获取所有节点
  const nodes = getNodes.value
  // 获取当前节点的直接子节点ID列表
  const directChildIds = flowNode.data.childNodeIds || []
  
  // 使用一个Set来存储所有子节点ID，避免重复
  const allChildIds = new Set<string>()
  
  // 递归获取所有子节点ID的函数
  const collectChildIds = (parentIds: string[]) => {
    // 如果没有子节点，直接返回
    if (parentIds.length === 0) return
    
    // 将直接子节点ID添加到结果集合中
    parentIds.forEach(id => allChildIds.add(id))
    
    // 查找子节点中的Frame节点
    const childFrames = nodes.filter(node => 
      parentIds.includes(node.id) && 
      node.type === EN_CONSTANTS.EN_WHITE_BOARD_NODE_TYPE_FRAME
    )
    
    // 收集所有子Frame的子节点ID
    const nextLevelChildIds: string[] = []
    childFrames.forEach(frame => {
      const frameChildIds = frame.data.childNodeIds || []
      frameChildIds.forEach(id => {
        if (!allChildIds.has(id)) {
          nextLevelChildIds.push(id)
        }
      })
    })
    
    // 递归处理下一级子节点
    if (nextLevelChildIds.length > 0) {
      collectChildIds(nextLevelChildIds)
    }
  }
  
  // 开始递归处理
  collectChildIds(directChildIds)
  
  // 将Set转换为数组
  dragChildNodesCache.value = Array.from(allChildIds)
}

// 修改全局鼠标抬起事件处理
const handleMouseUpGlobal = (event: MouseEvent) => {
  // 如果没有处于拖拽状态，直接返回
  if (!isDragging.value) return
  
  // 移除临时添加的事件监听
  document.removeEventListener('mousemove', handleFrameDrag)
  document.removeEventListener('mouseup', handleMouseUpGlobal)
  
  // 结束拖拽状态
  isDragging.value = false
  
  // 清空子节点缓存
  dragChildNodesCache.value = []
  
  // 延迟执行边界检测，避免卡顿
  setTimeout(() => {
    checkNodesInFrameBoundary()
  }, 100)
}

// 修改拖拽处理函数，使用缓存的子节点数据
const handleFrameDrag = (event: MouseEvent) => {
  if (!isDragging.value) return
  
  // 计算位移，并根据视口缩放进行调整
  const scale = viewport.value?.zoom || 1
  const dx = (event.clientX - dragStartPos.value.x) / scale
  const dy = (event.clientY - dragStartPos.value.y) / scale
  
  // 只有完全没有移动时才跳过更新
  if (dx === 0 && dy === 0) return

  // 更新起始位置，记录本次鼠标位置
  dragStartPos.value = {
    x: event.clientX,
    y: event.clientY
  }
  
  // 查找当前Frame节点
  const currentNodes = getNodes.value
  const frameNode = currentNodes.find(node => node.id === flowNode.id)
  
  if (!frameNode) return
  
  // 使用更新后的位移计算新位置
  const updatedFrameNode = {
    ...frameNode,
    position: {
      x: frameNode.position.x + dx,
      y: frameNode.position.y + dy
    }
  }
  
  // 使用缓存的子节点ID获取所有需要更新的子节点
  const childNodesToUpdate = currentNodes.filter(node => 
    dragChildNodesCache.value.includes(node.id)
  )
  
  // 更新所有子节点的位置
  const updatedChildNodes = childNodesToUpdate.map(node => ({
    ...node,
    position: {
      x: node.position.x + dx,
      y: node.position.y + dy
    }
  }))
  
  // 优化性能：合并所有需要更新的节点
  const nodesToUpdate = [updatedFrameNode, ...updatedChildNodes]
  const nodeIdsToUpdate = new Set([flowNode.id, ...dragChildNodesCache.value])
  
  // 批量更新节点位置
  setNodes(nodes => 
    nodes.map(node => 
      nodeIdsToUpdate.has(node.id) 
        ? nodesToUpdate.find(n => n.id === node.id) || node 
        : node
    )
  )
  
  // 防止事件冒泡和默认行为
  event.stopPropagation()
  event.preventDefault()
}

// 修改handleMouseUp不再需要复杂处理，因为我们使用了全局的handleMouseUpGlobal
const handleMouseUp = () => {
  // 这个函数保留但简化，主要逻辑已移至handleMouseUpGlobal
}

// 添加右键菜单状态
const contextMenuVisible = ref(false)
const contextMenuPosition = ref({
  x: 0,
  y: 0,
})
const clickPosition = ref({
  x: 0,
  y: 0,
})

// 处理右键菜单
const handleContextMenu = (event: MouseEvent) => {
  event.preventDefault()
  event.stopPropagation()

  // 记录点击位置(相对于 Frame)
  const frameRect = containerRef.value.getBoundingClientRect()
  clickPosition.value = {
    x: event.clientX - frameRect.left,
    y: event.clientY - frameRect.top,
  }

  // 设置菜单位置(相对于视口)
  contextMenuPosition.value = {
    x: event.clientX,
    y: event.clientY,
  }

  contextMenuVisible.value = true
}

// 关闭右键菜单
const closeContextMenu = () => {
  contextMenuVisible.value = false
}

// 在 Frame 中创建新节点
const createNodeInFrame = async () => {
  const blockId = await getNewDailyNoteBlockId()
  const newNodeId = generateWhiteBoardNodeId()

  // 创建新节点
  const newNode = {
    id: newNodeId,
    type: EN_CONSTANTS.EN_WHITE_BOARD_NODE_TYPE_PROTYLE,
    data: {
      blockId,
      parentId: flowNode.id, // 设置父节点为当前 Frame
    },
    // 使用点击位置作为节点位置
    position: {
      x: flowNode.position.x + clickPosition.value.x,
      y: flowNode.position.y + clickPosition.value.y,
    },
    width: moduleWhiteBoardOptions.value.cardWidthDefault,
    height: moduleWhiteBoardOptions.value.cardHeightDefault,
    connectable: true,
    draggable: true,
    selectable: true,
  }

  addNodes([newNode])
  closeContextMenu()
}

const { moduleOptions: moduleWhiteBoardOptions } = useWhiteBoardModule()

// 添加一个计算属性来显示可能成为子节点的节点
const potentialChildNodes = computed(() => {
  return getNodes.value.filter((node) => {
    if (node.id === flowNode.id || node.data?.parentId) return false
    return isNodeInside(node)
  })
})

// 在样式中添加视觉提示
const highlightPotentialNodes = () => {
  potentialChildNodes.value.forEach((node) => {
    const nodeEl = document.querySelector(`[data-en-flow-node-id="${node.id}"]`)
    if (nodeEl) {
      nodeEl.classList.add('potential-frame-child')
    }
  })
}

const clearPotentialNodesHighlight = () => {
  document.querySelectorAll('.potential-frame-child').forEach((el) => {
    el.classList.remove('potential-frame-child')
  })
}

// 监听其他节点的移动
watch(() => getNodes.value, (newNodes, oldNodes) => {
  if (!oldNodes || isDragging.value) return

  // 检查每个节点的变化
  let hasChanges = false
  
  newNodes.forEach((node, index) => {
    const oldNode = oldNodes[index]
    if (!oldNode) {
      hasChanges = true
      return
    }

    // 只关注位置或尺寸的明显变化
    if (
      Math.abs(node.position.x - oldNode.position.x) > 5 ||
      Math.abs(node.position.y - oldNode.position.y) > 5 ||
      Math.abs((node.dimensions?.width || 0) - (oldNode.dimensions?.width || 0)) > 5 ||
      Math.abs((node.dimensions?.height || 0) - (oldNode.dimensions?.height || 0)) > 5
    ) {
      hasChanges = true
    }
  })
  
  // 只在有明显变化时触发检测
  if (hasChanges) {
    throttledCheck()
  }
}, {
  deep: true,
  immediate: false // 设置为false，仅在变化后触发
})

// 优化Frame自身变化的监听，减少不必要的检测
watch(() => ({
  x: flowNode.position.x,
  y: flowNode.position.y,
  width: (flowNode as any).dimensions?.width,
  height: (flowNode as any).dimensions?.height,
  dragging: flowNode.dragging,
}), (newVal, oldVal) => {
  if (!oldVal || isDragging.value) return
  
  // 只在有明显变化时触发
  if (
    Math.abs(newVal.x - oldVal.x) > 5 ||
    Math.abs(newVal.y - oldVal.y) > 5 ||
    Math.abs((newVal.width || 0) - (oldVal.width || 0)) > 5 ||
    Math.abs((newVal.height || 0) - (oldVal.height || 0)) > 5
  ) {
    throttledCheck()
  }
}, {
  deep: true,
  immediate: false
})

// 在组件挂载时添加全局鼠标移动监听
onMounted(() => {
  document.addEventListener('click', handleGlobalClick)
  
  // 移除mouseup事件，因为我们现在在拖拽期间动态添加和移除监听
  document.addEventListener('mouseup', () => {
    // 只在非拖拽状态下执行检测
    if (!isDragging.value) {
      setTimeout(() => {
        checkNodesInFrameBoundary()
        highlightPotentialNodes()
      }, 300)
    }
  })
  
  // 初始检测
  nextTick(() => {
    detectNodesInFrame()
    highlightPotentialNodes()
    
    // 确保Frame节点始终在底层
    ensureFrameAtBottom()

    // 确保Frame节点尺寸正确设置到DOM
    if (flowNode && flowNode.dimensions) {
      // 显式触发一次节点尺寸更新
      const nodes = getNodes.value
      const newNodes = nodes.map((node) => {
        if (node.id === flowNode.id) {
          return {
            ...node,
            dimensions: {
              width: flowNode.dimensions.width || 400,
              height: flowNode.dimensions.height || 300
            }
          }
        }
        return node
      })
      setNodes(newNodes)
    }
  })
  
  // 初始化状态
  isLocked.value = nodeData.value?.isLocked || false
  frameColor.value = nodeData.value?.style?.backgroundColor || ''
  frameBorderColor.value = nodeData.value?.style?.borderColor || ''
  frameBorderStyle.value = nodeData.value?.style?.borderStyle || 'solid'
  frameOpacity.value = nodeData.value?.style?.opacity || 0.3

  // 如果是新创建的节点，确保初始保存一次
  setTimeout(() => {
    updateNodeData()
  }, 100)

  // 监听同步Frame内容的事件
  enEventBus.on(EN_EVENT_BUS_KEYS.WHITEBOARD_SYNC_FRAME_CONTENT, (frameId) => {
    // 如果是当前Frame，执行同步
    if (frameId === flowNode.id) {
      syncFrameContent()
    }
  })
})

// 添加函数确保Frame节点始终处于最底层 - 通过调整数组顺序
const ensureFrameAtBottom = () => {
  const nodes = getNodes.value
  
  // 分离Frame节点和普通节点
  const frameNodes = nodes.filter(node => 
    node.type === EN_CONSTANTS.EN_WHITE_BOARD_NODE_TYPE_FRAME
  )
  
  const normalNodes = nodes.filter(node => 
    node.type !== EN_CONSTANTS.EN_WHITE_BOARD_NODE_TYPE_FRAME
  )
  
  // 重新排序：将Frame节点放在前面（数组开头），这样Vue Flow会先渲染Frame，后渲染普通节点
  // 在SVG渲染中，后渲染的元素会显示在上方
  if (frameNodes.length > 0 && normalNodes.length > 0) {
    const newNodes = [...frameNodes, ...normalNodes]
    setNodes(newNodes)
  }
}

// 在各种关键场景下调用ensureFrameAtBottom
// 监听节点数组变化，确保Frame始终在底层
watch(() => getNodes.value.length, () => {
  // 当节点数量变化时，确保Frame在底层
  ensureFrameAtBottom()
})

// 处理全局点击事件
const handleGlobalClick = (event: MouseEvent) => {
  // 如果点击的不是右键菜单内的元素，则关闭菜单
  const menuEl = document.querySelector('.EnWhiteBoardFrameContextMenu')
  if (menuEl && !menuEl.contains(event.target as Node)) {
    closeContextMenu()
  }
}

// 从 Frame 中移除节点
const removeNodesFromFrame = () => {
  const selectedNodes = getSelectedNodes.value
  if (selectedNodes.length === 0) return

  // 获取当前frame的子节点ID列表
  const currentChildNodeIds = flowNode.data.childNodeIds || []
  // 获取要移除的节点ID列表
  const nodeIdsToRemove = selectedNodes
    .filter(node => node.data?.parentId === flowNode.id)
    .map(node => node.id)
  
  if (nodeIdsToRemove.length === 0) return
  
  // 计算移除后的子节点ID列表
  const updatedChildNodeIds = currentChildNodeIds.filter(id => !nodeIdsToRemove.includes(id))

  const updatedNodes = getNodes.value.map((node) => {
    // 更新被移除的节点，移除其parentId属性
    if (selectedNodes.find((n) => n.id === node.id) && node.data?.parentId === flowNode.id) {
      const {
        parentId,
        ...restData
      } = node.data
      return {
        ...node,
        data: restData,
      }
    }
    // 更新当前frame节点的childNodeIds属性
    else if (node.id === flowNode.id) {
      return {
        ...node,
        data: {
          ...node.data,
          childNodeIds: updatedChildNodeIds
        }
      }
    }
    return node
  })

  setNodes(updatedNodes)
  
  // 调用同步方法更新思源块内容
  // 确保在节点移除后同步更新引用
  nextTick(() => {
    syncFrameContent()
  })
  
  closeContextMenu()
}

// 锁定功能
const toggleLock = () => {
  isLocked.value = !isLocked.value
  
  // 更新节点数据
  const nodes = getNodes.value
  const newNodes = nodes.map((node) => {
    if (node.id === flowNode.id) {
      return {
        ...node,
        data: {
          ...node.data,
          isLocked: isLocked.value,
        },
        // 设置节点是否可拖动
        draggable: !isLocked.value,
      }
    }
    return node
  })
  setNodes(newNodes)
}

// 复制Frame
const duplicateFrame = () => {
  // 复制 Frame 和其中的所有子节点
  const nodes = getNodes.value
  const frameNode = nodes.find((node) => node.id === flowNode.id)
  const childrenNodes = nodes.filter((node) => node.data?.parentId === flowNode.id)
  
  if (!frameNode) return
  
  // 创建新 ID
  const newFrameId = generateWhiteBoardNodeId()
  
  // 复制 Frame
  const offsetX = 50
  const offsetY = 50
  const newFrameNode = {
    ...frameNode,
    id: newFrameId,
    position: {
      x: frameNode.position.x + offsetX,
      y: frameNode.position.y + offsetY,
    },
    data: {
      ...frameNode.data,
    },
    selected: true,
  }
  
  // 复制子节点
  const newChildNodes = childrenNodes.map((child) => {
    const newChildId = generateWhiteBoardNodeId()
    return {
      ...child,
      id: newChildId,
      position: {
        x: child.position.x + offsetX,
        y: child.position.y + offsetY,
      },
      data: {
        ...child.data,
        parentId: newFrameId,
      },
      selected: true,
    }
  })
  
  // 添加新节点
  const updatedNodes = nodes.map((node) => ({
    ...node,
    selected: false,
  }))
  setNodes(updatedNodes)
  addNodes([newFrameNode, ...newChildNodes])
  closeContextMenu()
}

// 更新颜色相关函数
const updateFrameColor = () => {
  const nodes = getNodes.value
  const newNodes = nodes.map((node) => {
    if (node.id === flowNode.id) {
      return {
        ...node,
        data: {
          ...node.data,
          style: {
            ...node.data?.style,
            backgroundColor: frameColor.value,
          },
        },
      }
    }
    return node
  })
  setNodes(newNodes)
  showColorPicker.value = false
}

const updateFrameBorderColor = () => {
  const nodes = getNodes.value
  const newNodes = nodes.map((node) => {
    if (node.id === flowNode.id) {
      return {
        ...node,
        data: {
          ...node.data,
          style: {
            ...node.data?.style,
            borderColor: frameBorderColor.value,
          },
        },
      }
    }
    return node
  })
  setNodes(newNodes)
}

const updateFrameBorderStyle = (style: string) => {
  frameBorderStyle.value = style
  const nodes = getNodes.value
  const newNodes = nodes.map((node) => {
    if (node.id === flowNode.id) {
      return {
        ...node,
        data: {
          ...node.data,
          style: {
            ...node.data?.style,
            borderStyle: style,
          },
        },
      }
    }
    return node
  })
  setNodes(newNodes)
  showColorPicker.value = false
}

const updateFrameOpacity = () => {
  const nodes = getNodes.value
  const newNodes = nodes.map((node) => {
    if (node.id === flowNode.id) {
      return {
        ...node,
        data: {
          ...node.data,
          style: {
            ...node.data?.style,
            opacity: frameOpacity.value,
          },
        },
      }
    }
    return node
  })
  setNodes(newNodes)
}

// 对齐函数
const alignChildNodes = (alignment) => {
  if (childNodes.value.length <= 1) return
  
  const nodes = getNodes.value
  const frameNode = nodes.find((node) => node.id === flowNode.id)
  if (!frameNode) return
  
  const frameLeft = frameNode.position.x
  const frameTop = frameNode.position.y
  const frameWidth = (frameNode as any).dimensions?.width || (frameNode as any).width || 0
  const frameHeight = (frameNode as any).dimensions?.height || (frameNode as any).height || 0
  
  const newNodes = nodes.map((node) => {
    if (node.data?.parentId === flowNode.id) {
      const nodeWidth = (node as any).dimensions?.width || (node as any).width || 0
      const nodeHeight = (node as any).dimensions?.height || (node as any).height || 0
      
      let newX = node.position.x
      let newY = node.position.y
      
      switch (alignment) {
        case 'left':
          newX = frameLeft + 10 // 边距
          break
        case 'center':
          newX = frameLeft + (frameWidth - nodeWidth) / 2
          break
        case 'right':
          newX = frameLeft + frameWidth - nodeWidth - 10 // 边距
          break
        case 'top':
          newY = frameTop + 10 // 边距
          break
        case 'middle':
          newY = frameTop + (frameHeight - nodeHeight) / 2
          break
        case 'bottom':
          newY = frameTop + frameHeight - nodeHeight - 10 // 边距
          break
      }
      
      return {
        ...node,
        position: {
          x: newX,
          y: newY,
        },
      }
    }
    return node
  })
  
  setNodes(newNodes)
  closeContextMenu()
}

// 均分分布函数
const distributeChildNodes = (direction) => {
  if (childNodes.value.length <= 2) return
  
  const nodes = getNodes.value
  const frameNode = nodes.find((node) => node.id === flowNode.id)
  if (!frameNode) return
  
  const frameLeft = frameNode.position.x
  const frameTop = frameNode.position.y
  const frameWidth = (frameNode as any).dimensions?.width || (frameNode as any).width || 0
  const frameHeight = (frameNode as any).dimensions?.height || (frameNode as any).height || 0
  
  const children = childNodes.value
  
  // 根据方向排序子节点
  const sortedChildren = [...children].sort((a, b) => {
    if (direction === 'horizontal') {
      return a.position.x - b.position.x
    } else {
      return a.position.y - b.position.y
    }
  })
  
  if (direction === 'horizontal') {
    // 计算总宽度
    const totalWidth = sortedChildren.reduce((sum, node) => {
      const width = (node as any).dimensions?.width || (node as any).width || 0
      return sum + width
    }, 0)
    
    // 计算间距
    const availableSpace = frameWidth - totalWidth
    const gap = availableSpace / (sortedChildren.length + 1)
    
    // 更新位置
    let currentX = frameLeft + gap
    const newNodes = nodes.map((node) => {
      if (sortedChildren.find((child) => child.id === node.id)) {
        const width = (node as any).dimensions?.width || (node as any).width || 0
        const position = {
          x: currentX,
          y: node.position.y,
        }
        currentX += width + gap
        return {
          ...node,
          position,
        }
      }
      return node
    })
    
    setNodes(newNodes)
  } else {
    // 计算总高度
    const totalHeight = sortedChildren.reduce((sum, node) => {
      const height = (node as any).dimensions?.height || (node as any).height || 0
      return sum + height
    }, 0)
    
    // 计算间距
    const availableSpace = frameHeight - totalHeight
    const gap = availableSpace / (sortedChildren.length + 1)
    
    // 更新位置
    let currentY = frameTop + gap
    const newNodes = nodes.map((node) => {
      if (sortedChildren.find((child) => child.id === node.id)) {
        const height = (node as any).dimensions?.height || (node as any).height || 0
        const position = {
          x: node.position.x,
          y: currentY,
        }
        currentY += height + gap
        return {
          ...node,
          position,
        }
      }
      return node
    })
    
    setNodes(newNodes)
  }
  
  closeContextMenu()
}

// 添加新的状态变量
const isLocked = ref(false)
const frameColor = ref(nodeData.value?.style?.backgroundColor || '')
const frameBorderColor = ref(nodeData.value?.style?.borderColor || '')
const frameBorderStyle = ref(nodeData.value?.style?.borderStyle || 'solid')
const frameOpacity = ref(nodeData.value?.style?.opacity || 0.3)
const colorPickerVisible = ref(false)
const showColorPicker = ref(false)

// Frame 节点移动时的处理
const handleFrameMove = () => {
  // 该函数不再需要，但保留空实现以避免引用错误
}

// 处理Frame点击事件
const handleFrameClick = (event: MouseEvent) => {
  // 避免点击事件与拖拽冲突
  if (isDragging.value) return
  
  // 当点击Frame时，只选中Frame本身，不再选择内部节点
  // 这样可以确保工具栏能够显示
  const updatedNodes = getNodes.value.map((node) => ({
    ...node,
    selected: node.id === flowNode.id
  }))
  setNodes(updatedNodes)
  
  // 阻止事件冒泡，确保不会影响其他节点或父Frame
  event.stopPropagation()
}

// 修改detectNodesInFrame函数，使其更高效
const detectNodesInFrame = () => {
  // 如果正在拖动，不执行检测
  if (isDragging.value) return
  
  const nodes = getNodes.value
  
  // 性能优化：限制要检查的节点数量
  const maxNodesToCheck = Math.min(nodes.length, 30)
  const nodesToCheck = nodes.slice(0, maxNodesToCheck)

  // 找出所有在Frame范围内的节点
  const nodesInFrame = nodesToCheck.filter((node) => {
    // 跳过自身和Frame类型节点
    if (node.id === flowNode.id || node.type === EN_CONSTANTS.EN_WHITE_BOARD_NODE_TYPE_FRAME) return false
    
    // 使用简化版检测，提高性能
    return isNodeInsideSimple(node)
  })

  // 更新这些节点的父子关系
  if (nodesInFrame.length > 0) {
    const updatedNodes = nodes.map((node) => {
      if (nodesInFrame.find((n) => n.id === node.id)) {
        return {
          ...node,
          data: {
            ...node.data,
            parentId: flowNode.id,
          },
        }
      }
      return node
    })
    setNodes(updatedNodes)
  }
}

// 更新节点的父子关系，优化性能
const updateNodeParent = (nodeId: string, parentId: string | null) => {
  // 如果正在拖拽，延迟执行以避免性能问题
  if (isDragging.value) {
    return
  }
  
  const nodes = getNodes.value
  const targetNode = nodes.find((node) => node.id === nodeId)
  if (!targetNode) return

  // 查找新的父节点
  const parentNode = parentId ? nodes.find(node => node.id === parentId) : null
  // 查找旧的父节点
  const oldParentId = targetNode.data?.parentId
  const oldParentNode = oldParentId ? nodes.find(node => node.id === oldParentId) : null

  // 检查旧父节点是否是一个Frame，并且只有当前节点作为子节点
  let isRemovingLastNodeFromOldFrame = false
  if (oldParentNode && oldParentNode.type === EN_CONSTANTS.EN_WHITE_BOARD_NODE_TYPE_FRAME) {
    const oldParentChildNodeIds = oldParentNode.data?.childNodeIds || []
    // 如果只有这一个子节点，且即将被移除
    isRemovingLastNodeFromOldFrame = oldParentChildNodeIds.length === 1 && oldParentChildNodeIds[0] === nodeId
  }

  // 计算相对位置（如果有父节点）
  let newPosition = { ...targetNode.position }
  if (parentNode) {
    // 保留节点在画布中的绝对位置，只是更新父子关系
    // 这样可以避免节点位置的突然变化
    newPosition = {
      x: targetNode.position.x,
      y: targetNode.position.y
    }
  }

  // 更新节点状态
  const newNodes = nodes.map((node) => {
    // 更新目标节点
    if (node.id === nodeId) {
      const newData = { ...node.data }
      
      // 更新或移除parentId属性
      if (parentId) {
        newData.parentId = parentId
      } else if (newData.parentId) {
        // 如果要移除父节点关系，创建新对象，确保删除parentId属性
        const { parentId: _, ...restData } = newData
        return {
          ...node,
          data: restData,
          position: newPosition
        }
      }

      return {
        ...node,
        data: newData,
        position: newPosition
      }
    }
    // 更新新父节点的childNodeIds
    else if (node.id === parentId) {
      const currentChildNodeIds = node.data?.childNodeIds || []
      // 添加新的子节点ID（如果不存在）
      if (!currentChildNodeIds.includes(nodeId)) {
        return {
          ...node,
          data: {
            ...node.data,
            childNodeIds: [...currentChildNodeIds, nodeId]
          }
        }
      }
    }
    // 更新旧父节点的childNodeIds
    else if (oldParentNode && node.id === oldParentId) {
      const currentChildNodeIds = node.data?.childNodeIds || []
      // 从旧父节点的childNodeIds中移除此节点ID
      return {
        ...node,
        data: {
          ...node.data,
          childNodeIds: currentChildNodeIds.filter(id => id !== nodeId)
        }
      }
    }
    return node
  })
  
  // 批量更新节点状态
  setNodes(newNodes)
  
  // 保存需要同步更新的Frame ID列表
  const framesToSync = new Set<string>()
  
  // 如果是添加到当前Frame或从当前Frame移除，同步更新思源块内容
  if (parentId === flowNode.id || oldParentId === flowNode.id) {
    framesToSync.add(flowNode.id)
  }
  
  // 如果是添加到其他Frame或从其他Frame移除，也需要同步那个Frame的内容
  if ((parentId && parentId !== flowNode.id) || (oldParentId && oldParentId !== flowNode.id)) {
    const otherFrameId = parentId || oldParentId
    if (otherFrameId) {
      framesToSync.add(otherFrameId)
    }
  }
  
  // 如果是移除最后一个节点，确保旧Frame的内容也更新为空列表
  if (isRemovingLastNodeFromOldFrame && oldParentId) {
    framesToSync.add(oldParentId)
  }

  // 查找所有需要同步的父Frame
  const findParentFrames = (frameId: string) => {
    const frame = nodes.find(node => node.id === frameId)
    if (!frame || frame.type !== EN_CONSTANTS.EN_WHITE_BOARD_NODE_TYPE_FRAME) return
    
    const parentFrameId = frame.data?.parentId
    if (parentFrameId) {
      framesToSync.add(parentFrameId)
      findParentFrames(parentFrameId)
    }
  }
  
  // 查找所有需要同步的子Frame
  const findChildFrames = (frameId: string) => {
    const frame = nodes.find(node => node.id === frameId)
    if (!frame || frame.type !== EN_CONSTANTS.EN_WHITE_BOARD_NODE_TYPE_FRAME) return
    
    const childNodeIds = frame.data?.childNodeIds || []
    childNodeIds.forEach(childId => {
      const childNode = nodes.find(node => node.id === childId)
      if (childNode?.type === EN_CONSTANTS.EN_WHITE_BOARD_NODE_TYPE_FRAME) {
        framesToSync.add(childId)
        findChildFrames(childId)
      }
    })
  }
  
  // 为新旧Frame查找所有需要同步的父Frame和子Frame
  if (parentId) {
    findParentFrames(parentId)
    findChildFrames(parentId)
  }
  if (oldParentId) {
    findParentFrames(oldParentId)
    findChildFrames(oldParentId)
  }
  
  // 在下一个tick同步所有需要更新的Frame
  nextTick(() => {
    // 如果当前Frame需要同步，直接调用
    if (framesToSync.has(flowNode.id)) {
      syncFrameContent()
    }
    
    // 对其他需要同步的Frame，发出事件通知
    framesToSync.forEach(frameId => {
      if (frameId !== flowNode.id) {
        // 发出全局事件，通知其他Frame组件更新
        enEventBus.emit(EN_EVENT_BUS_KEYS.WHITEBOARD_SYNC_FRAME_CONTENT, frameId)
      }
    })
  })
}

// 添加isSelected和isMultipleSelected计算属性
const isSelected = computed(() => {
  return getNodes.value.some(node => node.id === flowNode.id && node.selected)
})

const isMultipleSelected = computed(() => {
  const selectedNodes = getSelectedNodes.value
  return selectedNodes.length > 1
})

// 更新isNodeInsideSimple函数，适应Frame嵌套
const isNodeInsideSimple = (node: VueFlowNode) => {
  // 快速边界检查，使用中心点判断
  const frameLeft = flowNode.position.x
  const frameTop = flowNode.position.y
  const frameRight = frameLeft + ((flowNode as any).dimensions?.width || 0)
  const frameBottom = frameTop + ((flowNode as any).dimensions?.height || 0)
  
  const nodeWidth = ((node as any).dimensions?.width || (node as any).width || 0)
  const nodeHeight = ((node as any).dimensions?.height || (node as any).height || 0)
  const nodeX = node.position.x + nodeWidth / 2
  const nodeY = node.position.y + nodeHeight / 2
  
  // 使用节点中心点进行简单判断
  return nodeX > frameLeft && 
         nodeX < frameRight && 
         nodeY > frameTop && 
         nodeY < frameBottom
}

// 添加缺失的处理函数
const handleRemoveNode = () => {
  // 移除当前Frame节点
  removeNodes([flowNode.id])
}

const handleDuplicateNode = () => {
  // 复制Frame (使用已有的duplicateFrame函数)
  duplicateFrame()
}

// 修复OnResize类型
// 添加缺失的onResize处理
const onResize = (resizeEvent) => {
  // 更新节点尺寸
  const nodes = getNodes.value
  const newNodes = nodes.map((node) => {
    if (node.id === flowNode.id) {
      return {
        ...node,
        dimensions: {
          width: resizeEvent.width,
          height: resizeEvent.height,
        },
      }
    }
    return node
  })
  setNodes(newNodes)
  
  // 更新后检查边界
  throttledCheck()
}

// 将节点添加到Frame
const addSelectedNodesToFrame = () => {
  const selectedNodes = getSelectedNodes.value.filter(node => 
    node.id !== flowNode.id && !node.data?.parentId
  )
  
  if (selectedNodes.length === 0) return

  // 获取当前frame的子节点ID列表
  const currentChildNodeIds = flowNode.data.childNodeIds || []
  // 获取要添加的节点ID列表
  const nodeIdsToAdd = selectedNodes.map(node => node.id)
  
  // 计算添加后的子节点ID列表（去重）
  const updatedChildNodeIds = [...new Set([...currentChildNodeIds, ...nodeIdsToAdd])]

  // 更新节点的parentId和当前frame的childNodeIds
  const updatedNodes = getNodes.value.map((node) => {
    // 更新被添加的节点，设置其parentId属性
    if (selectedNodes.some(n => n.id === node.id)) {
      return {
        ...node,
        data: {
          ...node.data,
          parentId: flowNode.id,
        },
      }
    }
    // 更新当前frame节点的childNodeIds属性
    else if (node.id === flowNode.id) {
      return {
        ...node,
        data: {
          ...node.data,
          childNodeIds: updatedChildNodeIds
        }
      }
    }
    return node
  })
  
  setNodes(updatedNodes)
  
  // 调用同步方法更新思源块内容
  // 确保在节点添加后同步更新引用
  nextTick(() => {
    syncFrameContent()
  })
  
  closeContextMenu()
}

// 在setup阶段注册节点拖拽结束事件监听
onNodeDragStop((params) => {
  // 获取被拖拽的节点
  const draggedNode = params.node
  
  // 排除当前Frame本身
  if (draggedNode.id === flowNode.id) return
  
  // 检查节点是否位于当前Frame内
  const isInside = isNodeInside(draggedNode, true)
  
  // 特殊处理Frame类型节点的嵌套关系
  if (draggedNode.type === EN_CONSTANTS.EN_WHITE_BOARD_NODE_TYPE_FRAME) {
    if (isInside && draggedNode.data?.parentId !== flowNode.id) {
      // 查找所有包含该Frame的Frame
      const containingFrameId = findContainingFrame(draggedNode)
      
      // 只有当当前Frame是最内层包含该Frame的Frame时，才建立关系
      if (containingFrameId === flowNode.id) {
        console.log(`嵌套Frame ${draggedNode.id} 已被拖入上层Frame ${flowNode.id}`)
        updateNodeParent(draggedNode.id, flowNode.id)
      }
    } 
    else if (!isInside && draggedNode.data?.parentId === flowNode.id) {
      console.log(`嵌套Frame ${draggedNode.id} 已被拖出上层Frame ${flowNode.id}`)
      updateNodeParent(draggedNode.id, null)
    }
  }
  // 普通节点处理
  else {
    // 如果节点在Frame内且不是其子节点，则添加关系
    if (isInside && draggedNode.data?.parentId !== flowNode.id) {
      // 查找包含该节点的最内层Frame
      const containingFrameId = findContainingFrame(draggedNode)
      
      if (containingFrameId === flowNode.id) {
        console.log(`节点拖拽结束: ${draggedNode.id} 已被拖入Frame ${flowNode.id}`)
        updateNodeParent(draggedNode.id, flowNode.id)
      }
    } 
    // 如果节点是Frame的子节点但不在Frame内，则移除关系
    else if (!isInside && draggedNode.data?.parentId === flowNode.id) {
      console.log(`节点拖拽结束: ${draggedNode.id} 已被拖出Frame ${flowNode.id}`)
      updateNodeParent(draggedNode.id, null)
    }
  }
})

// 添加回被错误移除的onBeforeUnmount钩子
onBeforeUnmount(() => {
  document.removeEventListener('click', handleGlobalClick)
  document.removeEventListener('mouseup', throttledCheck)
  clearPotentialNodesHighlight()
})

// 添加更新白板数据的方法
const updateNodeData = () => {
  // 模拟数据更新，实际上我们已经通过UI更新了数据
  console.log("Frame data updated", flowNode.id);
}

// 在handleCreateFrame方法中创建思源块
const handleCreateFrame = async () => {
  try {
    // 生成唯一ID
    const frameId = generateWhiteBoardNodeId()
    
    // 获取白板模块配置
    const { moduleOptions } = useWhiteBoardModule()
    const { notebookId, targetId } = moduleOptions.value
    
    // 创建Frame的思源块
    let blockId = ''
    const frameName = '新分组' // 可以考虑随机生成或者根据日期命名
    
    // 创建一个标题块作为Frame的表示
    const frameContent = `## ${frameName}\n\n这是一个白板分组，包含以下内容：`
    
    if (notebookId && targetId) {
      blockId = await appendBlockInto(notebookId, targetId, frameContent)
    } else {
      blockId = await getNewDailyNoteBlockId(frameContent)
    }
    
    if (!blockId) {
      console.error('创建Frame块失败')
      return
    }
    
    // 设置块属性
    await setBlockAttrs(blockId, {
      'custom-en-whiteboard-frame': 'true',
      'custom-en-whiteboard-node-id': frameId,
    })
    
    // 定义位置和尺寸
    const position = clickPosition.value
    const frameWidth = 400
    const frameHeight = 300
    
    // 创建Frame节点
    const newFrame = {
      id: frameId,
      type: EN_CONSTANTS.EN_WHITE_BOARD_NODE_TYPE_FRAME,
      data: {
        blockId, // 保存思源块ID
        label: frameName,
        childNodeIds: [], // 初始化子节点ID列表
        style: {
          backgroundColor: 'var(--b3-theme-surface-light)',
        },
      },
      position,
      dimensions: {
        width: frameWidth,
        height: frameHeight,
      },
      width: frameWidth,
      height: frameHeight,
      connectable: true,
      draggable: true,
      selectable: true,
    }
    
    // 添加到白板
    addNodes([newFrame])
    closeContextMenu()
  } catch (error) {
    console.error('创建Frame节点失败:', error)
  }
}

// 更新Frame块内容，添加对子节点的引用
const updateFrameBlockContent = async () => {
  try {
    // 确保当前frame节点有关联的思源块
    if (!flowNode.data.blockId) {
      // 如果没有关联块，则创建一个
      await createFrameBlock()
      return
    }
    
    // 获取子节点列表
    const children = childNodes.value
    
    // 准备Frame块内容
    const frameLabel = flowNode.data.label || '未命名分组'
    let content = `## ${frameLabel}\n\n这是一个白板分组，包含以下内容：\n\n`
    
    // 如果有子节点，添加引用列表
    if (children.length > 0) {
      // 创建引用列表
      content += children.map(node => {
        // 仅为具有blockId的节点创建引用
        if (node.data.blockId) {
          return `- ((${node.data.blockId} "${node.data.label || '节点'}"))`
        }
        return `- ${node.type.replace('EnWhiteBoardNode', '')}节点`
      }).join('\n')
    } else {
      // 当没有子节点时，保留列表结构，但内容为空
      content += '- '
    }
    
    // 更新思源块内容，修正调用方式
    await updateBlock(
      'markdown',
      content,
      flowNode.data.blockId
    )
  } catch (error) {
    console.error('更新Frame块内容失败:', error)
  }
}

// 创建Frame关联的思源块
const createFrameBlock = async () => {
  try {
    // 获取白板模块配置
    const { moduleOptions } = useWhiteBoardModule()
    const { notebookId, targetId } = moduleOptions.value
    
    // 准备Frame块内容
    const frameLabel = flowNode.data.label || '未命名分组'
    const content = `## ${frameLabel}\n\n这是一个白板分组，包含以下内容：\n\n- `
    
    // 创建思源块
    let blockId = ''
    
    // 根据配置决定在哪里创建块
    if (notebookId && targetId) {
      blockId = await appendBlockInto(notebookId, targetId, content)
    } else {
      // 使用dailyNote模式创建块
      const res = await appendBlockIntoDailyNote(
        'markdown',
        content,
        useDailyNote().moduleOptions.value.dailyNoteNotebookId
      )
      blockId = getAppendedDailyNoteBlockId(res)
    }
    
    if (!blockId) {
      console.error('创建Frame块失败')
      return
    }
    
    // 设置块属性
    await setBlockAttrs(blockId, {
      'custom-en-whiteboard-frame': 'true',
      'custom-en-whiteboard-node-id': flowNode.id,
    })
    
    // 更新节点数据，添加blockId
    const updatedNodes = getNodes.value.map(node => {
      if (node.id === flowNode.id) {
        return {
          ...node,
          data: {
            ...node.data,
            blockId,
          }
        }
      }
      return node
    })
    
    // 更新节点列表
    setNodes(updatedNodes)
  } catch (error) {
    console.error('创建Frame关联块失败:', error)
  }
}

// 添加标题更新方法，当Frame标题（label）改变时，同步更新思源块
const updateFrameLabel = async (newLabel: string) => {
  if (!flowNode.data.blockId) return
  
  // 更新节点数据
  const updatedNodes = getNodes.value.map(node => {
    if (node.id === flowNode.id) {
      return {
        ...node,
        data: {
          ...node.data,
          label: newLabel
        }
      }
    }
    return node
  })
  
  setNodes(updatedNodes)
  
  // 同步更新思源块内容
  await syncFrameContent()
}

// 在toolbar中添加标题编辑功能
// 可以在现有的handleContextMenu函数中添加相关逻辑
const editFrameLabel = async () => {
  // 直接触发双击事件
  onTitleDblClick(new MouseEvent('dblclick'))
}

// 组件卸载时，移除事件监听
onUnmounted(() => {
  enEventBus.off(EN_EVENT_BUS_KEYS.WHITEBOARD_SYNC_FRAME_CONTENT, undefined)
})

// Frame标题编辑相关变量和函数
const isEditingTitle = ref(false)
const editingTitle = ref('')
const titleInputRef = ref<HTMLInputElement | null>(null)

// 处理标题双击事件
const onTitleDblClick = async (event: MouseEvent) => {
  event.stopPropagation()
  isEditingTitle.value = true
  editingTitle.value = nodeData.value.label || '未命名分组'
  
  // 等待DOM更新后聚焦输入框
  nextTick(() => {
    titleInputRef.value?.focus()
    titleInputRef.value?.select()
  })
}

// 处理标题编辑完成
const finishTitleEdit = () => {
  const newLabel = editingTitle.value.trim()
  if (newLabel && newLabel !== nodeData.value.label) {
    // 更新节点数据
    const nodes = getNodes.value
    const newNodes = nodes.map((node) => {
      if (node.id === flowNode.id) {
        return {
          ...node,
          data: {
            ...node.data,
            label: newLabel
          }
        }
      }
      return node
    })
    setNodes(newNodes)
    
    // 如果有关联的思源块，同步更新思源块内容
    if (flowNode.data.blockId) {
      syncFrameContent()
    }
  }
  
  isEditingTitle.value = false
}

// 添加高度变化处理函数
const onHeightChanged = (height: number) => {
  // 在这里可以添加额外的处理逻辑
  console.log('Frame节点高度已更新:', height)
}
</script>

<style lang="scss" scoped>
.EnWhiteBoardNodeFrameContainer {
  display: flex;
  flex-direction: column;
  width: var(--en-frame-width);
  height: var(--en-frame-height);
  box-sizing: border-box;
  position: relative;
  border: 2px solid var(--frame-color, var(--b3-border-color));
  border-radius: var(--b3-border-radius);
  padding: unset;
  background-color: color-mix(in srgb, var(--frame-color, var(--b3-border-color)) 15%, transparent);
  backdrop-filter: none;
  cursor: move;
  z-index: -1 !important;

  // 使用CSS变量动态设置颜色
  --frame-color: var(--b3-border-color);

  &:hover,
  &.is-selected {
    border-style: solid;
    border-color: var(--frame-color);
    box-shadow: 0 0 0 1px var(--frame-color);
    z-index: -1 !important;

    .frame-content {
      background-color: var(--frame-color);
      opacity: 0.05;
    }
  }

  &.is-selected {
    border-color: var(--frame-color);
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--frame-color) 50%, transparent);
    z-index: -1 !important;
  }

  &.is-dragging {
    cursor: grabbing;
    z-index: -1 !important;
  }

  &.can-drop {
    border-style: solid;
    border-color: var(--frame-color);
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--frame-color) 50%, transparent);
  }
  
  &.is-locked {
    cursor: not-allowed;
    --frame-color: var(--b3-theme-error-light);
     
    &:hover {
      border-color: var(--b3-theme-error);
    }
     
    .Handle {
      display: none;
    }
     
    :deep(.vue-flow__resize-control) {
      display: none;
    }
  }

  &.is-dragover {
    border-style: solid;
    border-color: var(--frame-color);
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--frame-color) 50%, transparent);
    background-color: color-mix(in srgb, var(--frame-color) 20%, transparent);
  }

  .EnWhiteBoardNodeFrameContainer {
    background-color: color-mix(in srgb, var(--frame-color, var(--b3-border-color)) 75%, transparent);
    opacity: 0.9;
    
    box-shadow: inset 0 0 8px rgba(0, 0, 0, 0.05);
    
    border-color: color-mix(in srgb, var(--frame-color, var(--b3-border-color)) 90%, var(--b3-border-color) 10%);
  }

  .FrameToolbarArea {
    position: absolute;
    top: -4px;
    left: -2px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    box-sizing: border-box;
    padding: 4px 8px 4px 8px;
    background: var(--frame-color, var(--b3-border-color));
    border: 2px solid var(--frame-color, var(--b3-border-color));
    border-radius: var(--b3-border-radius);
    white-space: nowrap;
    z-index: 10;
    pointer-events: all;
    transition: all 0.2s ease;

    &:hover {
      background: var(--frame-color, var(--b3-border-color));
    }

    .infos {
      flex: 1;
      overflow: hidden;
      display: flex;
      align-items: center;
      gap: 8px;

      .frame-title {
        font-weight: 500;
        font-size: 12px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 150px;
        color: var(--b3-theme-on-surface);
        cursor: pointer;
        
        &:hover {
          color: var(--b3-theme-primary);
          text-decoration: underline;
        }
        
        .frame-title-input {
          width: 100%;
          height: 100%;
          font-size: 12px;
          font-weight: 500;
          padding: 0;
          margin: 0;
          border: none;
          background: transparent;
          color: var(--b3-theme-on-surface);
          outline: none;
          cursor: text;
          
          &:focus {
            color: var(--b3-theme-primary);
          }
        }
      }

      .child-count {
        color: var(--b3-theme-on-background);
        text-align: center;
        height: 18px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
    }

    .operations {
      flex-shrink: 0;
      opacity: 0.6;
      transition: opacity 0.2s ease;
      cursor: default;

      &:hover {
        opacity: 1;
      }

      .arco-btn {
        color: var(--b3-theme-on-surface);
        transition: all 0.2s ease;
        cursor: pointer;

        &:hover {
          color: var(--b3-theme-primary);
          background-color: var(--b3-border-color);
        }
      }
    }
  }

  .frame-content {
    flex: 1;
    position: relative;
    overflow: visible;
    padding: var(--en-gap);
    min-height: 100px;
    cursor: default;
    background-size: 20px 20px;
    background-color: transparent;
    opacity: 0.1;
  }

  &.is-collapsed {
    height: var(--en-frame-height, 30px) !important; 
    min-height: var(--en-frame-height, 30px) !important;
    max-height: var(--en-frame-height, 30px) !important;
    transition: all 0.3s ease-in-out;

    .frame-content {
      display: none;
    }

    .Handle {
      display: none;
    }

    :deep(.vue-flow__resize-control) {
      display: none;
    }

    .FrameToolbarArea {
      border-bottom: none;
      border-radius: var(--b3-border-radius);
      left: -2px;
      padding: 4px 8px 4px 10px;
    }
  }

  .Handle {
    width: 21px;
    height: 21px;
    z-index: 10;
    opacity: 0;
    border-color: var(--b3-border-color);
    background-color: var(--b3-theme-background);
    color: var(--b3-border-color);
    transition: opacity 0.2s ease, background-color 0.2s ease;
    cursor: crosshair;

    &:hover {
      background-color: var(--b3-border-color);
      color: var(--b3-theme-on-primary);
      opacity: 1;
    }

    .HandleIcon {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      pointer-events: none;
    }

    &.top {
      top: -16px;
    }
    &.bottom {
      bottom: -16px;
    }
    &.left {
      left: -16px;
    }
    &.right {
      right: -16px;
    }
  }

  :deep(.vue-flow__resize-control) {
    &.handle {
      background-color: var(--b3-border-color);
      border: 2px solid var(--b3-theme-background);
      box-shadow: 0 0 0 1px var(--b3-theme-primary);
      opacity: 0;
      transition: opacity 0.2s ease;
      cursor: nwse-resize;

      &:hover {
        opacity: 1;
      }
    }

    &.line {
      background-color: var(--b3-border-color);
      opacity: 0;
      transition: opacity 0.2s ease;

      &:hover {
        opacity: 1;
      }
    }
  }

  :deep(.potential-frame-child) {
    outline: 2px dashed var(--b3-border-color) !important;
    outline-offset: 4px !important;
    transition: outline 0.2s ease;
  }
}

.EnWhiteBoardNodeToolbar {
  :deep(.vue-flow__node-toolbar) {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    padding: 8px;
    border-radius: 8px;
    background: var(--b3-theme-surface);
    border: 1px solid var(--b3-border-color);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
}

.EnWhiteBoardFrameContextMenu {
  position: fixed;
  z-index: 1000;
  background: var(--b3-theme-surface);
  border: 1px solid var(--b3-border-color);
  border-radius: var(--b3-border-radius);
  padding: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  min-width: 160px;

  .MenuGroup {
    &:not(:last-child) {
      border-bottom: 1px solid var(--b3-border-color);
      margin-bottom: 4px;
      padding-bottom: 4px;
    }
  }

  .ContextMenuItem {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 8px;
    cursor: pointer;
    border-radius: var(--b3-border-radius);
    color: var(--b3-theme-on-surface);
    font-size: 13px;

    &:hover {
      background: var(--b3-theme-surface-light);
    }

    .arco-icon {
      font-size: 14px;
    }
  }
}

.AdditionalToolbar {
  display: flex;
  gap: 4px;
  margin-left: 8px;
  border-left: 1px solid var(--b3-border-color);
  padding-left: 8px;
  
  .ToolbarBtn {
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    background-color: transparent;
    cursor: pointer;
    transition: all 0.2s ease;
    
    &:hover {
      background-color: var(--b3-theme-surface-light);
    }
    
    &.active {
      color: var(--b3-theme-primary);
      background-color: var(--b3-border-color);
    }
    
    &.color-picker {
      position: relative;
      overflow: hidden;
      
      input[type="color"] {
        position: absolute;
        width: 30px;
        height: 30px;
        top: -3px;
        left: -3px;
        padding: 0;
        border: none;
        opacity: 0;
        cursor: pointer;
      }
    }
  }
}

.ColorPickerModal {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 1100;
  width: 300px;
  background-color: var(--b3-theme-surface);
  border-radius: var(--b3-border-radius);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  
  .ColorPickerHeader {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    border-bottom: 1px solid var(--b3-border-color);
    
    span {
      font-weight: 500;
      font-size: 14px;
    }
    
    .CloseBtn {
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      border-radius: 50%;
      
      &:hover {
        background-color: var(--b3-theme-surface-light);
      }
    }
  }
  
  .ColorPickerContent {
    padding: 16px;
    
    .ColorPickerItem {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;
      
      &:last-child {
        margin-bottom: 0;
      }
      
      span {
        font-size: 13px;
      }
      
      input[type="color"] {
        width: 30px;
        height: 30px;
        padding: 0;
        border: 1px solid var(--b3-border-color);
        border-radius: 4px;
        cursor: pointer;
      }
      
      select {
        padding: 4px 8px;
        border: 1px solid var(--b3-border-color);
        border-radius: 4px;
        background-color: var(--b3-theme-background);
        color: var(--b3-theme-on-background);
      }
      
      input[type="range"] {
        width: 150px;
      }
    }
  }
}

.ColorPickerContainer {
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  
  input[type="color"] {
    width: 100%;
    height: 30px;
    padding: 0;
    border: 1px solid var(--b3-border-color);
    border-radius: 4px;
    cursor: pointer;
  }
  
  .BorderStylePicker {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
}

:deep(.vue-flow__node) {
  &.EnWhiteBoardNodeFrameContainer {
    z-index: -1 !important;
    
    .EnWhiteBoardNodeFrameContainer {
      z-index: -1 !important;
    }
  }
  
  &:not(.EnWhiteBoardNodeFrameContainer) {
    z-index: 2 !important;
  }
}

:deep(.vue-flow__node.selected) {
  &.EnWhiteBoardNodeFrameContainer {
    z-index: -1 !important;
  }
}
</style>

<style lang="scss">
/* 全局样式：确保Frame节点即使在选中状态下z-index也保持为-1 */
.vue-flow__node.vue-flow__node-EnWhiteBoardNodeFrame {
  z-index: -1 !important;
  
  &.selected {
    z-index: -1 !important;
  }
  
  &.nopan {
    z-index: -1 !important;
  }
  
  &.dragging {
    z-index: -1 !important;
  }
  
  &.draggable {
    z-index: -1 !important;
  }
  
  &.selectable {
    z-index: -1 !important;
  }
}
</style>

