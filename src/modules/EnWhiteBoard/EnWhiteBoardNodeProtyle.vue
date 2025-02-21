<template>
  <NodeToolbar
    :position="Position.Top"
    :is-visible="isSelected && !isMultipleSelected"
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
      @open-in-sidebar="handleOpenInSidebar"
      @collapse="handleCollapse"
    />
  </NodeToolbar>
  <div
    ref="containerRef"
    class="EnWhiteBoardNodeProtyleContainer"
    :class="{
      'variant-default': !nodeData.style?.variant || nodeData.style.variant === 'default',
      'variant-card': nodeData.style?.variant === 'card',
      'variant-note': nodeData.style?.variant === 'note',
      'is-collapsed': isCollapsed,
      'is-mindmap': isMindmapNode,
      ...nodeTypeClass,
    }"
    :data-en-flow-node-id="flowNode.id"
    :style="{
      '--en-card-width': `${flowNode.dimensions.width}px`,
      '--en-card-height': isCollapsed ? '30px' : `${flowNode.dimensions.height}px`,
      'backgroundColor': nodeData.style?.backgroundColor,
    }"
  >
    <!-- 思维导图模式下的添加子节点按钮 -->
    <div
      v-if="isMindmapNode"
      class="add-child-button"
    >
      <a-button
        size="mini"
        type="primary"
        shape="circle"
        @click.stop="handleAddChildNode"
      >
        <template #icon>
          <icon-plus />
        </template>
      </a-button>
    </div>

    <div class="ProtyleToolbarArea">
      <div class="infos">
        <span
          class="block-title"
          :title="displayText"
        >{{ displayText }}</span>
      </div>

      <div class="operations">
        <a-spin v-if="isMergingToSuperBlock">
          <template #icon>
            <icon-sync />
          </template>
        </a-spin>
        <a-button-group size="mini">
          <a-button
            v-if="isMindmapNode"
            :class="{ active: isMindmapNode }"
            @click="toggleMindmap"
          >
            <template #icon>
              <icon-mind-mapping />
            </template>
          </a-button>
        </a-button-group>
      </div>
    </div>
    <div
      ref="mainRef"
      class="main EnWhiteBoardNodeProtyleMain"
      :data-en-flow-node-id="flowNode.id"
      @wheel.capture="captureWheel"
      @mousedown.capture="captureMouseDown"
      @click.capture="captureClick"
    >

      <template v-if="nodeData.blockId">
        <EnProtyle
          :block-id="nodeData.blockId"
          disableEnhance
          @after="afterProtyleLoad"
        />
        <Teleport
          v-if="enWhiteBoardProtyleUtilAreaRef"
          :to="enWhiteBoardProtyleUtilAreaRef"
        >
          <div
            ref="protyleUtilAreaRef"
            :data-en-whiteboard-node-protyle-util-area="flowNode.id"
          >

          </div>
        </Teleport>
      </template>
    </div>

    <NodeResizer
      :min-width="100"
      :min-height="36"
      color="transparent"
      @resize="onResize"
    />

    <!-- 只在非思维导图节点时显示所有连接点 -->
    <template v-if="!isMindmapNode">
      <Handle
        v-for="position in ['top', 'right', 'bottom', 'left']"
        :id="position"
        :key="position"
        class="Handle"
        :class="[position.toLowerCase()]"
        type="source"
        :position="Position[position.charAt(0).toUpperCase() + position.slice(1)]"
      >
        <div class="HandleIcon">
          <component :is="handleIcons[position]" />
        </div>
      </Handle>
    </template>

    <!-- 思维导图节点只显示特定连接点 -->
    <template v-else>
      <!-- 所有思维导图节点都有右侧连接点(作为源)和左侧连接点(作为目标) -->
      <Handle
        id="right"
        class="Handle right"
        type="source"
        :position="Position.Right"
      >
        <div class="HandleIcon">
          <IconArrowRight />
        </div>
      </Handle>
      <Handle
        id="left"
        class="Handle left"
        type="target"
        :position="Position.Left"
      >
        <div class="HandleIcon">
          <IconArrowLeft />
        </div>
      </Handle>
    </template>
  </div>
</template>

<script lang="ts">
import { EN_CONSTANTS } from '@/utils/Constants'
</script>

<script setup lang="ts">
import { request } from '@/api'
import EnProtyle from '@/components/EnProtyle.vue'
import { getNewDailyNoteBlockId } from '@/modules/DailyNote/DailyNote'

import {
  generateWhiteBoardEdgeId,
  generateWhiteBoardNodeId,
  getWhiteBoardConfigRefById,
  useWhiteBoardModule,
} from '@/modules/EnWhiteBoard/EnWhiteBoard'
import { debounce } from '@/utils'
import {
  useSiyuanDatabaseIndexCommit,
  useSiyuanEventTransactions,
} from '@/utils/EventBusHooks'
import {
  IconArrowDown,
  IconArrowLeft,
  IconArrowRight,
  IconArrowUp,
} from '@arco-design/web-vue/es/icon'
import {
  Handle,
  Position,
  useKeyPress,
  useNode,
  useVueFlow,
} from '@vue-flow/core'
import {
  NodeResizer,
  OnResize,
} from '@vue-flow/node-resizer'
import { NodeToolbar } from '@vue-flow/node-toolbar'
import { Protyle } from 'siyuan'
import {
  computed,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from 'vue'
import EnWhiteBoardToolBar from './EnWhiteBoardToolBar.vue'

const props = defineProps<{
  enWhiteBoardProtyleUtilAreaRef: HTMLElement
  whiteBoardId: string
  nodeId: string
}>()

const emit = defineEmits<{
  clickCard: [element: HTMLElement]
  openInSidebar: [nodeId: string, blockId: string, blockInfo: {
    title: string
    name: string
    alias: string
    type: string
    content: string
    docName: string
  }]
}>()

const {
  moduleOptions: whiteBoardModuleOptions,
} = useWhiteBoardModule()

const {
  node: flowNode,
} = useNode()

const {
  getNodes,
  addNodes,
  removeNodes,
  getSelectedNodes,
  setNodes,
  getEdges,
  setEdges,
  edges,
  addEdges,
  onConnect,
  onConnectStart,
  onConnectEnd,
} = useVueFlow()

const nodeData = computed(() => flowNode.data)

const containerRef = ref<HTMLDivElement | null>(null)

const spaceKeyPressing = useKeyPress('Space')
const captureWheel = (event: WheelEvent) => {
  if (!event.ctrlKey && !event.altKey && !event.shiftKey && !event.metaKey && !spaceKeyPressing.value) {

    const protyleContent = mainRef.value?.querySelector('.protyle-content')

    if (!protyleContent) {
      return
    }

    const {
      scrollTop,
      scrollHeight,
      clientHeight,
    } = protyleContent
    const isAtTop = scrollTop <= 0
    const isAtBottom = scrollTop + clientHeight >= scrollHeight

    if ((event.deltaY < 0 && !isAtTop) || (event.deltaY > 0 && !isAtBottom)) {
      event.stopImmediatePropagation()
    }
  }
}

const targetProtyleUtilClassList = [
  'protyle-gutters',
  'protyle-select',
  'protyle-toolbar',
  'protyle-hint',
]
const protyleUtilAreaRef = ref<HTMLDivElement | null>(null)
const cardProtyleRef = ref<Protyle | null>(null)
const afterProtyleLoad = (protyle: Protyle) => {
  cardProtyleRef.value = protyle

  targetProtyleUtilClassList.forEach((className) => {
    const target = protyle.protyle.element.querySelector(`.${className}`)
    if (target) {
      protyleUtilAreaRef.value?.appendChild(target)
    }
  })

  // protyle?.protyle?.wysiwyg?.element?.addEventListener('mousedown', (event) => {
  //   const target = event.target as HTMLElement
  //   const mainElement = target.closest('.EnWhiteBoardNodeProtyleMain')
  //   if (mainElement && !mainElement.classList.contains('nodrag')) {
  //     event.stopImmediatePropagation()
  //     const newEvent = new MouseEvent('mousedown', {
  //       bubbles: true,
  //       cancelable: true,
  //       view: window,
  //       ...event,
  //     })
  //     mainElement.parentElement?.dispatchEvent(newEvent)
  //   }
  // }, true)
}

const captureMouseDown = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  const mainElement = target.closest('.EnWhiteBoardNodeProtyleMain')
  if (mainElement && !mainElement.classList.contains('nodrag')) {
    event.stopPropagation()
    containerRef.value?.dispatchEvent(
      new MouseEvent('mousedown', {
        bubbles: true,
        cancelable: true,
        view: window,
        clientX: event.clientX,
        clientY: event.clientY,
        screenX: event.screenX,
        screenY: event.screenY,
      }),
    )
  }
}

const captureClick = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  const protyleContent = target.closest('.protyle-content')
  const isInProtyleContent = !!protyleContent
  if (isInProtyleContent) {

    const lastRect = cardProtyleRef.value?.protyle.wysiwyg.element.lastElementChild.getBoundingClientRect()
    if (event.y > lastRect.bottom) {
      event.stopImmediatePropagation()
      const newEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        view: window,
        ...event,
      })
      const mainElement = target.closest('.EnWhiteBoardNodeProtyleMain')
      mainElement?.parentElement?.dispatchEvent(newEvent)
    }
  }
}

const mainRef = ref<HTMLDivElement | null>(null)

let offTransactionEvent = null
const bindNodeIdToEnNode = () => {
  if (!cardProtyleRef.value) {
    return
  }
  const firstNode = cardProtyleRef.value.protyle.element?.querySelector(`[data-node-id]`) as HTMLElement
  if (!firstNode) {
    return
  }
  const nodeId = firstNode.dataset.nodeId
  if (!nodeId) {
    return
  }

  nodeData.value.blockId = nodeId
}

const removeNodeCreatedByOther = (event) => {
  const {
    detail,
  } = event
  const {
    sid,
    data,
  } = detail
  const currentProtyleId = cardProtyleRef.value?.protyle.id
  data.forEach((item) => {
    const {
      doOperations = [],
    } = item
    doOperations.forEach((operation) => {
      const {
        action,
        id: opId,
      } = operation
      const isCreate = action === 'insert'
      const isCreateByOther = sid !== currentProtyleId

      if (isCreate && isCreateByOther) {
        let timer = null
        timer = setInterval(() => {
          const wysiwygElement = cardProtyleRef.value?.protyle.wysiwyg.element
          const firstLevelChildren = wysiwygElement?.children
          const targetElement = Array.from(firstLevelChildren).find((child: HTMLElement) => {
            const childNodeId = child.dataset.nodeId
            return childNodeId && childNodeId === opId
          })
          if (targetElement) {
            targetElement.remove()
            clearInterval(timer)
          }
        }, 0)
      }
    })
  })
}

const isMergingToSuperBlock = ref(false)
const mergeTopLevelBlocksIntoSuperBlock = debounce(() => {
  if (!whiteBoardModuleOptions.value.autoMergeToSuperBlock) {
    return
  }

  const children = Array.from(cardProtyleRef.value?.protyle.wysiwyg.element?.children || [])
  // 如果只有一个子元素，则不进行合并
  if (children.length <= 1) {
    return
  }

  const protyleIns = cardProtyleRef.value?.protyle.getInstance()
  isMergingToSuperBlock.value = true
  protyleIns.turnIntoOneTransaction(children, 'BlocksMergeSuperBlock', 'row')
  const off = useSiyuanDatabaseIndexCommit(debounce(async () => {
    off()
    isMergingToSuperBlock.value = false
  }, 20))
}, whiteBoardModuleOptions.value.autoMergeToSuperBlockDelay * 1000)

onMounted(() => {
  offTransactionEvent = useSiyuanEventTransactions((event) => {
    bindNodeIdToEnNode()
    removeNodeCreatedByOther(event)
    mergeTopLevelBlocksIntoSuperBlock()
  })
  isCollapsed.value = flowNode.data?.isCollapsed || false
})
onBeforeUnmount(() => {
  if (offTransactionEvent) {
    offTransactionEvent()
  }
})

const onResize = (event: OnResize) => {
  console.log('onResize', event)
}

const handleRemoveNode = () => {
  const nodes = getNodes.value
  const currentEdges = edges.value

  // 如果是思维导图节点，需要删除所有子节点
  if (isMindmapNode.value) {
    const childrenToRemove = nodes.filter((node) => node.data?.parentId === flowNode.id)
    const nodesToRemove = [flowNode, ...childrenToRemove]
    removeNodes(nodesToRemove)

    // 删除相关的边
    const edgesToKeep = currentEdges.filter((edge) => {
      const isSourceEdge = edge.source === flowNode.id
      const isTargetEdge = edge.target === flowNode.id
      const isChildEdge = childrenToRemove.some((child) =>
        edge.source === child.id || edge.target === child.id,
      )
      return !isSourceEdge && !isTargetEdge && !isChildEdge
    })
    setEdges(edgesToKeep)

    // 立即更新白板配置
    if (embedWhiteBoardConfigData.value) {
      embedWhiteBoardConfigData.value.boardOptions.nodes = nodes.filter(
        (node) => !nodesToRemove.some((n) => n.id === node.id),
      )
      embedWhiteBoardConfigData.value.boardOptions.edges = edgesToKeep
    }

    // 如果有父节点且是思维导图节点，触发父节点的布局更新
    if (flowNode.data?.parentId) {
      const parentNode = nodes.find((node) => node.id === flowNode.data.parentId)
      if (parentNode?.data?.mindmap) {
        updateMindmapLayoutRecursively(parentNode.id)
      }
    }
  } else {
    removeNodes([flowNode])
    // 立即更新白板配置
    if (embedWhiteBoardConfigData.value) {
      embedWhiteBoardConfigData.value.boardOptions.nodes = nodes.filter(
        (node) => node.id !== flowNode.id,
      )
    }

    // 如果有父节点且是思维导图节点，触发父节点的布局更新
    if (flowNode.data?.parentId) {
      const parentNode = nodes.find((node) => node.id === flowNode.data.parentId)
      if (parentNode?.data?.mindmap) {
        updateMindmapLayoutRecursively(parentNode.id)
      }
    }
  }
}

const handleDuplicateNode = () => {
  const nodes = getNodes.value
  const sourceNode = nodes.find((node) => node.id === flowNode.id)
  if (!sourceNode) return

  const newNodeId = generateWhiteBoardNodeId()
  const newNode = {
    ...sourceNode,
    id: newNodeId,
    position: {
      x: sourceNode.position.x + 50,
      y: sourceNode.position.y + 50,
    },
    data: {
      ...sourceNode.data,
      parentId: sourceNode.data.parentId,
    },
    selected: true,
    dragging: false,
    resizing: false,
  }

  const updatedNodes = nodes.map((node) => ({
    ...node,
    selected: node.id === sourceNode.id ? false : node.selected,
  }))

  setNodes([...updatedNodes, newNode])

  // 更新白板配置
  if (embedWhiteBoardConfigData.value) {
    embedWhiteBoardConfigData.value.boardOptions.nodes = [...updatedNodes, newNode]
  }
}

const isMultipleSelected = computed(() => {
  return getSelectedNodes.value.length > 1
})

const isSelected = computed(() => {
  const selectedNodes = getSelectedNodes.value
  return selectedNodes.some((node) => node.id === flowNode.id)
})

const handleOpenInSidebar = () => {
  if (flowNode.id && nodeData.value.blockId) {
    // 传递更多信息到父组件
    emit('openInSidebar', flowNode.id, nodeData.value.blockId, {
      title: blockInfo.value.title,
      name: blockInfo.value.name,
      alias: blockInfo.value.alias,
      type: blockInfo.value.type,
      content: blockInfo.value.content,
      docName: blockInfo.value.docName,
    })
  }
}

const isCollapsed = ref(false)

const handleCollapse = () => {
  isCollapsed.value = !isCollapsed.value

  // 更新节点数据
  const nodes = getNodes.value
  const newNodes = nodes.map((node) => {
    if (node.id === flowNode.id) {
      return {
        ...node,
        data: {
          ...node.data,
          isCollapsed: isCollapsed.value,
        },
      }
    }
    return node
  })
  setNodes(newNodes)
}

// 修改块信息状态
const blockInfo = ref({
  title: '', // 文档标题
  name: '', // 块命名
  alias: '', // 块别名
  type: '', // 块类型
  content: '', // 块内容
  docName: '', // 所属文档标题
})

// 获取块信息的函数
const getBlockInfo = async (blockId: string) => {
  try {
    // 获取块信息
    const blockResponse = await request('/api/block/getBlockInfo', { id: blockId })
    if (blockResponse) {
      // 获取块所属文档信息
      const docResponse = await request('/api/block/getDocInfo', { id: blockId })

      // 如果没有标题等信息，获取第一个子块的内容
      let firstChildContent = ''
      if (!blockResponse.name && !blockResponse.alias && blockResponse.type !== 'd') {
        const childResponse = await request('/api/block/getChildBlocks', { id: blockId })
        if (childResponse?.data?.length > 0) {
          const firstChild = childResponse.data[0]
          firstChildContent = firstChild.content?.substring(0, 7) || ''
        }
      }

      blockInfo.value = {
        title: blockResponse.type === 'd' ? blockResponse.name : '',
        name: blockResponse.name || '',
        alias: blockResponse.alias || '',
        type: blockResponse.type || '',
        content: firstChildContent,
        docName: docResponse?.name || '',
      }
    }
  } catch (error) {
    console.error('获取块信息失败:', error)
  }
}

// 计算显示的文本
const displayText = computed(() => {
  // 如果是文档块，直接显示文档标题
  if (blockInfo.value.type === 'd') {
    return blockInfo.value.title || '无标题文档'
  }

  // 按优先级显示：块命名 > 块别名 > 所属文档标题 > 第一个子块内容 > 默认文本
  return blockInfo.value.name
    || blockInfo.value.alias
    || blockInfo.value.docName
    || blockInfo.value.content
    || '未命名块'
})

// 监听 blockId 变化
watch(() => nodeData.value?.blockId, async (newBlockId) => {
  if (newBlockId) {
    await getBlockInfo(newBlockId)
  }
}, { immediate: true })

// 添加思维导图相关的计算属性和方法
const nodeType = computed(() => nodeData.value?.nodeType || 'protyle')
const isMindmapNode = computed(() => nodeData.value?.mindmap === true)
const isTextNode = computed(() => nodeType.value === 'text')
const isGingkoNode = computed(() => nodeType.value === 'gingko')

// 根据节点类型更新样式
const nodeTypeClass = computed(() => ({
  'is-mindmap': isMindmapNode.value,
  'is-text': isTextNode.value,
  'is-gingko': isGingkoNode.value,
}))

// 获取子节点
const getChildNodes = () => {
  if (!isMindmapNode.value) return []
  const nodes = getNodes.value || []
  return nodes.filter((node) => node.data?.parentId === flowNode.id)
}

// 修改监听子节点数量和父节点变化的watch
watch([
  () => getChildNodes().length,
  () => flowNode.data?.parentId,
], () => {
  if (isMindmapNode.value) {
    updateNodeLayout(flowNode)
  }
})

// 监听节点变化，处理删除等操作
watch(() => getNodes.value, (newNodes, oldNodes) => {
  if (!oldNodes) return

  // 检查是否有节点被删除
  const deletedNodes = oldNodes.filter((oldNode) =>
    !newNodes.some((newNode) => newNode.id === oldNode.id),
  )

  // 如果有节点被删除，检查是否需要更新相关思维导图布局
  if (deletedNodes.length > 0) {
    deletedNodes.forEach((deletedNode) => {
      if (deletedNode.data?.parentId) {
        const parentNode = newNodes.find((node) => node.id === deletedNode.data.parentId)
        if (parentNode?.data?.mindmap) {
          updateMindmapLayoutRecursively(parentNode.id)
        }
      }
    })
  }
}, { deep: true })

// 计算节点及其子树的总高度
const calculateSubtreeHeight = (node, nodes) => {
  // 获取节点自身的高度
  const nodeHeight = node.dimensions?.height || whiteBoardModuleOptions.value.cardHeightDefault

  // 获取所有直接子节点
  const childNodes = nodes.filter((n) => n.data?.parentId === node.id)

  if (childNodes.length === 0) {
    return nodeHeight
  }

  // 递归计算每个子节点的子树高度
  const childrenHeights = childNodes.map((child) => calculateSubtreeHeight(child, nodes))

  // 计算子树的总高度(包含固定间距)
  const verticalSpacing = 20 // 减小垂直间距使布局更紧凑
  const totalChildrenHeight = childrenHeights.reduce((sum, height, index) => {
    return sum + height + (index < childrenHeights.length - 1 ? verticalSpacing : 0)
  }, 0)

  // 返回子树总高度和节点自身高度的较大值
  return Math.max(nodeHeight, totalChildrenHeight)
}

// 修改 updateNodeLayout 函数
const updateNodeLayout = async (node, level = 0) => {
  const nodes = getNodes.value
  const currentEdges = edges.value
  const horizontalSpacing = 80 // 减小水平间距
  const verticalSpacing = 20 // 减小垂直间距

  // 找到所有以当前节点为父节点的子节点
  const childNodes = nodes.filter((n) => n.data?.parentId === node.id)

  if (childNodes.length === 0) {
    return
  }

  // 等待节点尺寸准备好
  const dimensionsReady = await waitForNodeDimensions([node, ...childNodes])
  if (!dimensionsReady) {
    console.warn('节点尺寸未准备好,使用默认尺寸')
  }

  // 获取父节点的右边界
  const parentRightEdge = node.position.x + (node.dimensions?.width || whiteBoardModuleOptions.value.cardWidthDefault)

  // 计算每个子节点的子树高度
  const childrenHeights = await Promise.all(childNodes.map(async (child) => {
    const subtreeHeight = calculateSubtreeHeight(child, nodes)
    return subtreeHeight
  }))

  // 计算总高度（包含间距）
  const totalHeight = childrenHeights.reduce((sum, height, index) => {
    return sum + height + (index < childrenHeights.length - 1 ? verticalSpacing : 0)
  }, 0)

  // 计算第一个子节点的起始Y坐标
  let currentY = node.position.y - (totalHeight / 2) + (node.dimensions?.height || 0) / 2

  // 更新每个子节点及其子树的位置
  for (let i = 0; i < childNodes.length; i++) {
    const child = childNodes[i]
    const childHeight = childrenHeights[i]
    const childY = currentY + (childHeight - (child.dimensions?.height || 0)) / 2

    // 计算子节点的x坐标，根据层级增加间距
    const childX = parentRightEdge + horizontalSpacing + (level * 10) // 每层增加一点间距

    // 更新当前子节点的位置
    const updatedNodes = nodes.map((n) => {
      if (n.id === child.id) {
        return {
          ...n,
          position: {
            x: childX,
            y: childY,
          },
        }
      }
      return n
    })
    setNodes(updatedNodes)

    // 递归更新子节点的子树，传递层级信息
    await updateNodeLayout(child, level + 1)

    // 更新下一个子节点的起始Y坐标
    currentY += childHeight + verticalSpacing
  }

  // 更新白板配置
  if (embedWhiteBoardConfigData.value) {
    embedWhiteBoardConfigData.value.boardOptions.nodes = getNodes.value
    embedWhiteBoardConfigData.value.boardOptions.edges = currentEdges
  }
}

// 修改 handleAddChildNode 函数
const handleAddChildNode = async () => {
  const blockId = await getNewDailyNoteBlockId()
  const newNodeId = generateWhiteBoardNodeId()

  // 获取当前节点的所有子节点
  const siblings = getNodes.value.filter((node) => node.data?.parentId === flowNode.id)
  const horizontalSpacing = 80 // 减小水平间距
  const verticalSpacing = 20 // 减小垂直间距

  // 获取父节点的右边界
  const parentRightEdge = flowNode.position.x + (flowNode.dimensions?.width || whiteBoardModuleOptions.value.cardWidthDefault)

  // 计算新节点的初始位置 - 放在所有子节点的下方
  const lastSibling = siblings[siblings.length - 1]
  const initialY = lastSibling
    ? lastSibling.position.y + (lastSibling.dimensions?.height || whiteBoardModuleOptions.value.cardHeightDefault) + verticalSpacing
    : flowNode.position.y

  // 创建新节点
  const newNode = {
    id: newNodeId,
    type: EN_CONSTANTS.EN_WHITE_BOARD_NODE_TYPE_PROTYLE,
    data: {
      blockId,
      parentId: flowNode.id,
      mindmap: true,
    },
    position: {
      x: parentRightEdge + horizontalSpacing,
      y: initialY,
    },
    width: whiteBoardModuleOptions.value.cardWidthDefault,
    height: whiteBoardModuleOptions.value.cardHeightDefault,
    connectable: true,
    draggable: true,
    selectable: true,
  }

  // 更新节点
  const updatedNodes = [...getNodes.value, newNode]
  setNodes(updatedNodes)

  // 根据最下方子节点的连线颜色来决定新连线的颜色
  let edgeColor = presetColors[0] // 默认使用第一个颜色
  if (siblings.length > 0) {
    // 获取所有连接到当前节点的边
    const currentEdges = edges.value.filter((edge) => edge.source === flowNode.id)
    // 按照目标节点的 y 坐标排序，找到最下方的边
    const sortedEdges = currentEdges.sort((a, b) => {
      const nodeA = getNodes.value.find((node) => node.id === a.target)
      const nodeB = getNodes.value.find((node) => node.id === b.target)
      return (nodeB?.position.y || 0) - (nodeA?.position.y || 0)
    })

    if (sortedEdges.length > 0) {
      const lastEdge = sortedEdges[0]
      // 找到最下方边的颜色在预设颜色中的索引
      const lastColorIndex = presetColors.findIndex((color) => color === lastEdge.data?.color)
      if (lastColorIndex !== -1) {
        // 使用下一个颜色，如果是最后一个颜色则回到第一个
        edgeColor = presetColors[(lastColorIndex + 1) % presetColors.length]
      }
    }
  }

  // 创建连接线
  const newEdge = {
    id: generateWhiteBoardEdgeId(),
    type: EN_CONSTANTS.EN_WHITE_BOARD_EDGE_TYPE_BASE,
    source: flowNode.id,
    target: newNodeId,
    sourceHandle: 'right',
    targetHandle: 'left',
    data: {
      label: '',
      edgeType: 'bezier', // 使用贝塞尔曲线使连线更流畅
      width: 2,
      style: 'solid',
      color: edgeColor,
      markerEnd: 'arrow',
      markerStart: undefined,
    },
  }

  // 更新边
  const currentEdges = edges.value || []
  currentEdges.push(newEdge as any)
  setEdges([...currentEdges])

  // 等待节点渲染完成
  await waitForNodeDimensions([newNode])

  // 等待一帧以确保状态更新完成
  await new Promise((resolve) => requestAnimationFrame(resolve))

  // 更新布局 - 使用递归更新以确保父节点和所有子节点都正确更新
  await updateMindmapLayoutRecursively(flowNode.id)

  // 更新白板配置
  if (embedWhiteBoardConfigData.value) {
    embedWhiteBoardConfigData.value.boardOptions.nodes = getNodes.value
    embedWhiteBoardConfigData.value.boardOptions.edges = edges.value
  }
}

const handleIcons = {
  top: IconArrowUp,
  right: IconArrowRight,
  bottom: IconArrowDown,
  left: IconArrowLeft,
}

const {
  embedWhiteBoardConfigData,
} = getWhiteBoardConfigRefById(props.whiteBoardId, props.nodeId)

// 添加预设颜色数组
const presetColors = [
  'var(--b3-font-background1)',
  'var(--b3-font-background2)',
  'var(--b3-font-background3)',
  'var(--b3-font-background4)',
  'var(--b3-font-background5)',
  'var(--b3-font-background6)',
  'var(--b3-font-background7)',
  'var(--b3-font-background8)',
  'var(--b3-font-background9)',
  'var(--b3-font-background10)',
  'var(--b3-font-background11)',
  'var(--b3-font-background12)',
  'var(--b3-font-background13)',
]

// 检查节点尺寸是否已准备好
const isNodeDimensionsReady = (node) => {
  return node.dimensions?.width && node.dimensions?.height
}

// 等待节点尺寸准备好
const waitForNodeDimensions = (nodes, maxAttempts = 5) => {
  return new Promise((resolve) => {
    let attempts = 0
    const check = () => {
      attempts++
      const allReady = nodes.every(isNodeDimensionsReady)
      if (allReady || attempts >= maxAttempts) {
        resolve(allReady)
      } else {
        setTimeout(check, 100) // 每100ms检查一次
      }
    }
    check()
  })
}

// 修改 updateMindmapLayoutRecursively 函数为异步
const updateMindmapLayoutRecursively = async (nodeId) => {
  const nodes = getNodes.value
  const node = nodes.find((n) => n.id === nodeId)
  if (!node) return

  // 如果有父节点,先更新父节点的布局
  if (node.data?.parentId) {
    await updateMindmapLayoutRecursively(node.data.parentId)
  }

  // 更新当前节点的布局
  const currentNode = nodes.find((n) => n.id === nodeId)
  if (currentNode && currentNode.data?.mindmap) {
    await updateNodeLayout(currentNode)
  }
}

// 添加思维导图工具栏按钮
const toggleMindmap = () => {
  const nodes = getNodes.value || []
  const newNodes = nodes.map((node) => {
    if (node.id === flowNode.id) {
      return {
        ...node,
        data: {
          ...node.data,
          mindmap: !isMindmapNode.value,
        },
      }
    }
    return node
  })
  setNodes(newNodes)
  if (!isMindmapNode.value) {
    updateNodeLayout(flowNode)
  }
}
</script>

<style lang="scss" scoped>
.EnWhiteBoardNodeProtyleContainer {
  display: flex;
  flex-direction: column;
  justify-content: center;

  width: 100%;
  height: 100%;
  box-sizing: border-box;

  position: relative;
  --en-whiteboard-node-protyle-border-width: 2px;
  border: var(--en-whiteboard-node-protyle-border-width) solid var(--b3-border-color);
  border-radius: var(--en-whiteboard-card-radius);

  padding: unset;

  .main {
    flex: 1;
    display: flex;
    flex-direction: column;


    position: relative;

    overflow: hidden;

    &:not(.nodrag) {
      opacity: 0.7;

      :deep(.protyle-wysiwyg) {
        cursor: var(--en-whiteboard-card-cursor);
      }
    }

    :deep(.protyle-wysiwyg) {
      padding-bottom: 16px !important;
    }

  }

  .ProtyleToolbarArea {
    width: 100%;
    height: 30px;
    flex-shrink: 0;
    background-color: color-mix(in srgb, var(--b3-theme-surface) 65%, transparent);

    display: flex;
    align-items: center;
    justify-content: space-between;

    box-sizing: border-box;
    padding: var(--en-gap);

    .infos {
      flex: 1;
      overflow: hidden;
      margin-right: var(--en-gap);

      .block-title {
        font-size: 12px;
        color: var(--b3-theme-on-surface);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        display: block;
      }
    }

    .operations {
      flex-shrink: 0;
    }
  }

  :deep(.vue-flow__resize-control) {
    opacity: 0;
    &:hover {
      opacity: 1;
    }

    &.line {
      box-sizing: border-box;
      border: unset;
      top: unset;
      bottom: unset;
      left: unset;
      right: unset;

      &.top,
      &.bottom {
        left: 0px;
        height: var(--en-whiteboard-resizer-width);
      }

      &.left,
      &.right {
        top: 0px;
        width: var(--en-whiteboard-resizer-width);
      }

      &.top {
        top: calc(0px - (var(--en-whiteboard-node-protyle-border-width) / 2));
      }
      &.bottom {
        bottom: 0px;
        transform: translateY(
          calc(0px + (var(--en-whiteboard-resizer-width) / 2) + (var(--en-whiteboard-node-protyle-border-width) / 2))
        );
      }
      &.left {
        left: calc(0px - (var(--en-whiteboard-node-protyle-border-width) / 2));
      }
      &.right {
        top: 0px;
        right: 0px;
        transform: translateX(
          calc(0px + (var(--en-whiteboard-resizer-width) / 2) + (var(--en-whiteboard-node-protyle-border-width) / 2))
        );
      }

      &::before {
        content: '';
        background-color: var(--en-whiteboard-resizer-color);
        border-radius: var(--en-whiteboard-resizer-width);
        position: absolute;
        --en-line-vertical-width: min(max(8px, calc(var(--en-card-width) * 0.2)), 30px);
        --en-line-horizontal-height: min(max(8px, calc(var(--en-card-height) * 0.2)), 30px);
      }


      // 调整大小
      &.top::before,
      &.bottom::before {
        width: var(--en-line-vertical-width);
        height: var(--en-whiteboard-resizer-width);
      }

      &.left::before,
      &.right::before {
        width: var(--en-whiteboard-resizer-width);
        height: var(--en-line-horizontal-height);
      }

      // 调整位置
      &.top::before {
        top: 0px;
        left: calc(50% - var(--en-line-vertical-width) / 2);
      }
      &.bottom::before {
        bottom: 0px;
        left: calc(50% - var(--en-line-vertical-width) / 2);
      }
      &.left::before {
        top: calc(50% - var(--en-line-horizontal-height) / 2);
        left: 0px;
      }
      &.right::before {
        top: calc(50% - var(--en-line-horizontal-height) / 2);
        right: 0px;
      }
    }

    &.handle {
      border: unset;

      --en-handle-base-width: min(var(--en-card-width), var(--en-card-height));
      --en-handle-width: min(max(12px, calc(var(--en-handle-base-width) * 0.3)), 36px);
      width: var(--en-handle-width);
      height: var(--en-handle-width);
      transform: unset;
      top: unset;
      bottom: unset;
      left: unset;
      right: unset;

      &::after,
      &::before {
        content: '';
        background-color: var(--en-whiteboard-resizer-color);
        border-radius: var(--en-whiteboard-card-radius);
        position: absolute;
      }

      &::before {
        width: 100%;
        height: var(--en-whiteboard-resizer-width);
      }
      &::after {
        width: var(--en-whiteboard-resizer-width);
        height: 100%;
      }


      &.top.left {
        top: 0;
        bottom: unset;
        left: 0;
        right: unset;
        transform: translate(
          calc(0px - (var(--en-whiteboard-resizer-width) / 2) - (var(--en-whiteboard-node-protyle-border-width) / 2)),
          calc(0px - (var(--en-whiteboard-resizer-width) / 2) - (var(--en-whiteboard-node-protyle-border-width) / 2))
        );

        &::before,
        &::after {
          top: 0;
          left: 0;
        }
      }

      &.top.right {
        top: 0px;
        bottom: unset;
        left: unset;
        right: 0px;
        transform: translate(
          calc(0px + (var(--en-whiteboard-resizer-width) / 2) + (var(--en-whiteboard-node-protyle-border-width) / 2)),
          calc(0px - (var(--en-whiteboard-resizer-width) / 2) - (var(--en-whiteboard-node-protyle-border-width) / 2))
        );

        &::before,
        &::after {
          top: 0;
          right: 0;
        }
      }
      &.bottom.left {
        top: unset;
        bottom: 0;
        left: 0;
        right: unset;
        transform: translate(
          calc(0px - (var(--en-whiteboard-resizer-width) / 2) - (var(--en-whiteboard-node-protyle-border-width) / 2)),
          calc(0px + (var(--en-whiteboard-resizer-width) / 2) + (var(--en-whiteboard-node-protyle-border-width) / 2))
        );

        &::before,
        &::after {
          bottom: 0;
          left: 0;
        }
      }
      &.bottom.right {
        top: unset;
        bottom: 0;
        left: unset;
        right: 0;
        transform: translate(
          calc(0px + (var(--en-whiteboard-resizer-width) / 2) + (var(--en-whiteboard-node-protyle-border-width) / 2)),
          calc(0px + (var(--en-whiteboard-resizer-width) / 2) + (var(--en-whiteboard-node-protyle-border-width) / 2))
        );

        &::after,
        &::before {
          bottom: 0;
          right: 0;
        }
      }
    }
  }

  .Handle {
    width: 21px;
    height: 21px;
    z-index: -1;
    opacity: 0;
    border-color: var(--b3-theme-primary-light);
    background-color: var(--b3-theme-background);
    color: var(--b3-theme-primary-light);
    position: absolute;

    &:hover {
      background-color: var(--b3-border-color);
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

  &.variant-default {
    border: var(--en-whiteboard-node-protyle-border-width) solid var(--b3-border-color);
    border-radius: var(--en-whiteboard-card-radius);
  }

  &.variant-card {
    border: none;
    border-radius: var(--en-whiteboard-card-radius);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  }

  &.variant-note {
    border: none;
    border-radius: 0;
    box-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
    background-color: #fefabc;
    transform: rotate(2deg);

    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 20px;
      width: 20px;
      height: 30px;
      background-color: rgba(0,0,0,0.1);
      border-radius: 0 0 20px 20px;
    }
  }

  &.is-collapsed {
    height: 30px !important;
    min-height: 30px !important;
    transition: height 0.3s ease-in-out;

    .main {
      display: none;
    }

    .ProtyleToolbarArea {
      border-bottom: none;
      border-radius: var(--b3-border-radius);
      background-color: var(--b3-theme-surface);
      height: 100%;
    }

    .Handle,
    :deep(.vue-flow__resize-control) {
      display: none;
    }

    &.variant-default {
      border: 1px solid var(--b3-border-color);
    }

    &.variant-card {
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
    }

    &.variant-note {
      &::before {
        display: none;
      }
    }
  }

  &.is-mindmap {
    border-color: var(--b3-theme-primary-light);
    background-color: var(--b3-theme-background-light);

    .add-child-button {
      position: absolute;
      right: -16px;
      top: 50%;
      transform: translateY(-50%);
      z-index: 10;
      opacity: 0;
      transition: opacity 0.2s ease;

      .arco-btn {
        width: 24px;
        height: 24px;
        padding: 0;
        font-size: 14px;
        background-color: var(--b3-theme-primary);
        border-color: var(--b3-theme-primary);
        color: var(--b3-theme-on-primary);

        &:hover {
          background-color: var(--b3-theme-primary-hover);
          border-color: var(--b3-theme-primary-hover);
        }
      }
    }

    &:hover .add-child-button {
      opacity: 1;
    }
  }

  &.is-text {
    border: none;
    background-color: transparent;
    box-shadow: none;
  }

  &.is-gingko {
    border-color: var(--b3-theme-success);
    background-color: var(--b3-theme-background-light);
  }
}

.EnWhiteBoardNodeToolbar {
  :deep(.vue-flow__node-toolbar) {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    padding: 8px;
    border-radius: 8px;
  }
}

.operations {
  .active {
    color: var(--b3-theme-primary);
    background: var(--b3-theme-primary-light);
  }
}
</style>

<style lang="scss">
.vue-flow__node-EnWhiteBoardNodeProtyle {
  --en-whiteboard-card-cursor: grab;
  --en-whiteboard-card-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  transition: box-shadow 0.3s ease;

  .EnWhiteBoardNodeProtyleContainer {
    transition: box-shadow 0.3s ease;
  }

  &.dragging {
    --en-whiteboard-card-cursor: grabbing;

    .EnWhiteBoardNodeProtyleContainer {
      box-shadow: var(--en-whiteboard-card-shadow);
      transform: translateY(-2px);
      transition: box-shadow 0.3s ease, transform 0.3s ease;
    }
  }

  &.selected {
    .EnWhiteBoardNodeProtyleContainer {
      border-color: var(--b3-theme-primary-light);
    }
  }
}
</style>
