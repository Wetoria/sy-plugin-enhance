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
      @collapse="collapseRef?.toggleCollapse()"
    />
  </NodeToolbar>
  <EnWhiteBoardNodeCollapse
    ref="collapseRef"
    :nodeId="flowNode.id"
    :initialCollapsed="flowNode.data?.isCollapsed || false"
    :whiteBoardConfigData="embedWhiteBoardConfigData"
    @update:isCollapsed="(val) => isCollapsed = val"
  />
  <template v-if="isMindmapNode">
    <EnWhiteBoardNodeMindmap
      :nodeId="flowNode.id"
      :isCollapsed="isCollapsed"
      :displayText="displayText"
      :isMergingToSuperBlock="isMergingToSuperBlock"
      :nodeData="nodeData"
      :whiteBoardConfigData="embedWhiteBoardConfigData"
      @toggleMindmap="handleToggleMindmap"
    >
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
    </EnWhiteBoardNodeMindmap>
  </template>
  <template v-else-if="isTreeCardNode">
    <EnWhiteBoardNodeTreeCard
      :nodeId="flowNode.id"
      :isCollapsed="isCollapsed"
      :displayText="displayText"
      :isMergingToSuperBlock="isMergingToSuperBlock"
      :nodeData="nodeData"
      :whiteBoardConfigData="embedWhiteBoardConfigData"
      @toggleTreeCard="handleToggleTreeCard"
    >
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
    </EnWhiteBoardNodeTreeCard>
  </template>
  <div
    v-else
    ref="containerRef"
    class="EnWhiteBoardNodeProtyleContainer"
    :class="{
      'variant-default': !nodeData.style?.variant || nodeData.style.variant === 'default',
      'variant-card': nodeData.style?.variant === 'card',
      'variant-note': nodeData.style?.variant === 'note',
      'is-collapsed': isCollapsed,
      ...nodeTypeClass,
    }"
    :data-en-flow-node-id="flowNode.id"
    :style="{
      '--en-card-width': `${flowNode.dimensions.width}px`,
      '--en-card-height': `${flowNode.height}px`,
      '--node-color': nodeData.style?.backgroundColor || 'var(--b3-border-color)',
      'backgroundColor': nodeData.style?.backgroundColor ? 
        `color-mix(in srgb, var(--b3-theme-background) 95%, ${nodeData.style.backgroundColor})` : 
        undefined,
      'borderColor': nodeData.style?.backgroundColor || 'var(--b3-border-color)',
    }"
  >
    <EnWhiteBoardNodeFit
      :nodeId="flowNode.id"
      :whiteBoardConfigData="embedWhiteBoardConfigData"
      @height-changed="onHeightChanged"
    />
    <div v-if="isCollapsed" class="ProtyleToolbarArea">
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
      :disable-style-updates="true"
      @resize="onResize"
    />

    <!-- 只在非思维导图节点时显示所有连接点 -->
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
  </div>
</template>

<script lang="ts">
</script>

<script setup lang="ts">
import { request } from '@/api'
import EnProtyle from '@/components/EnProtyle.vue'
import {
  generateWhiteBoardNodeId,
  getWhiteBoardConfigRefById,
  useWhiteBoardModule,
} from '@/modules/EnWhiteBoard/EnWhiteBoard'
import { debounce } from '@/utils'
import {
  useSiyuanDatabaseIndexCommit,
  useSiyuanEventTransactions,
} from '@/utils/EventBusHooks'
import { EN_CONSTANTS } from '@/utils/Constants'
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
import EnWhiteBoardNodeMindmap from './EnWhiteBoardNodeMindmap.vue'
import EnWhiteBoardNodeTreeCard from './EnWhiteBoardNodeTreeCard.vue'
import EnWhiteBoardToolBar from './EnWhiteBoardToolBar.vue'
import EnWhiteBoardNodeCollapse from './components/EnWhiteBoardNodeCollapse.vue'
import EnWhiteBoardNodeFit from './components/EnWhiteBoardNodeFit.vue'

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
  setNodes,
  removeNodes,
  addNodes,
  getSelectedNodes,
  getEdges,
  setEdges,
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

const removeNodeCreatedByOther = (event) => {
  // 仅在启用了自动合并超级块功能时执行此操作
  if (!whiteBoardModuleOptions.value.autoMergeToSuperBlock) {
    return
  }

  const {
    detail,
  } = event
  const {
    sid,
    data,
  } = detail
  const currentProtyleId = cardProtyleRef.value?.protyle.id
  if (!currentProtyleId) return

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
        let attempts = 0
        const maxAttempts = 10 // 限制尝试次数
        
        timer = setInterval(() => {
          attempts++
          const wysiwygElement = cardProtyleRef.value?.protyle.wysiwyg.element
          if (!wysiwygElement) {
            clearInterval(timer)
            return
          }
          
          const firstLevelChildren = wysiwygElement?.children
          const targetElement = Array.from(firstLevelChildren).find((child: HTMLElement) => {
            const childNodeId = child.dataset.nodeId
            return childNodeId && childNodeId === opId
          })
          
          if (targetElement) {
            targetElement.remove()
            clearInterval(timer)
          } else if (attempts >= maxAttempts) {
            // 达到最大尝试次数，停止尝试
            clearInterval(timer)
          }
        }, 50) // 增加间隔时间，减少性能消耗
      }
    })
  })
}

const isMergingToSuperBlock = ref(false)
const mergeAttemptsCount = ref(0)
const maxMergeAttempts = 3 // 最大合并尝试次数
let mergeTimer = null

const mergeTopLevelBlocksIntoSuperBlock = debounce(() => {
  if (!whiteBoardModuleOptions.value.autoMergeToSuperBlock) {
    return
  }

  // 如果已经在进行合并，则跳过
  if (isMergingToSuperBlock.value) {
    return
  }

  // 检查是否有有效的protyle实例和元素
  if (!cardProtyleRef.value?.protyle?.wysiwyg?.element) {
    return
  }

  const children = Array.from(cardProtyleRef.value.protyle.wysiwyg.element.children || [])
  // 如果只有一个子元素，则不进行合并
  if (children.length <= 1) {
    mergeAttemptsCount.value = 0 // 重置尝试计数
    return
  }

  // 检查子元素是否都是有效的块
  const validChildren = children.filter((child: HTMLElement) => 
    child.dataset && child.dataset.nodeId && 
    !child.classList.contains('protyle-action')
  )
  
  if (validChildren.length <= 1) {
    return
  }

  try {
    const protyleIns = cardProtyleRef.value?.protyle.getInstance()
    if (!protyleIns || !protyleIns.turnIntoOneTransaction) {
      console.warn('无法获取有效的protyle实例或turnIntoOneTransaction方法')
      return
    }

    isMergingToSuperBlock.value = true
    mergeAttemptsCount.value++

    // 更新节点状态，反映合并中状态
    updateNodeMergingStatus(true)
    
    // 执行合并操作
    protyleIns.turnIntoOneTransaction(validChildren, 'BlocksMergeSuperBlock', 'row')
    
    // 使用事务完成监听
    const off = useSiyuanDatabaseIndexCommit(debounce(async () => {
      off()
      // 延迟一段时间后再检查合并结果
      setTimeout(() => {
        // 检查合并结果
        checkMergeResult()
      }, 200)
    }, 50))
    
    // 设置安全超时，防止事务完成回调不触发的情况
    clearTimeout(mergeTimer)
    mergeTimer = setTimeout(() => {
      if (isMergingToSuperBlock.value) {
        console.warn('合并超级块操作超时，恢复状态')
        isMergingToSuperBlock.value = false
        updateNodeMergingStatus(false)
      }
    }, 3000) // 3秒超时保护
  } catch (error) {
    console.error('合并超级块时出错:', error)
    isMergingToSuperBlock.value = false
    updateNodeMergingStatus(false)
  }
}, whiteBoardModuleOptions.value.autoMergeToSuperBlockDelay * 1000)

// 检查合并结果
const checkMergeResult = () => {
  if (!cardProtyleRef.value?.protyle?.wysiwyg?.element) {
    isMergingToSuperBlock.value = false
    updateNodeMergingStatus(false)
    return
  }

  const children = Array.from(cardProtyleRef.value.protyle.wysiwyg.element.children || [])
  const superBlock = children.find((child: HTMLElement) => 
    child.dataset && child.dataset.type === 'NodeSuperBlock'
  )

  if (superBlock) {
    // 合并成功
    console.log('成功合并为超级块')
    // 绑定新的块ID
    bindNodeIdToEnNode()
    isMergingToSuperBlock.value = false
    updateNodeMergingStatus(false)
    mergeAttemptsCount.value = 0 // 重置尝试计数
  } else if (mergeAttemptsCount.value < maxMergeAttempts) {
    // 合并失败但未达到最大尝试次数，重试
    console.warn(`合并超级块失败，尝试重新合并 (${mergeAttemptsCount.value}/${maxMergeAttempts})`)
    setTimeout(() => {
      mergeTopLevelBlocksIntoSuperBlock()
    }, 500)
  } else {
    // 达到最大尝试次数，放弃合并
    console.error('多次尝试合并超级块失败，放弃操作')
    isMergingToSuperBlock.value = false
    updateNodeMergingStatus(false)
    mergeAttemptsCount.value = 0 // 重置尝试计数
  }
}

// 更新节点的合并状态
const updateNodeMergingStatus = (merging: boolean) => {
  // 更新当前节点的数据
  const nodes = getNodes.value
  const updatedNodes = nodes.map((node) => {
    if (node.id === flowNode.id) {
      return {
        ...node,
        data: {
          ...node.data,
          isMergingToSuperBlock: merging
        }
      }
    }
    return node
  })
  setNodes(updatedNodes)
}

// 检查块ID有效性
const checkBlockIdValidity = debounce(async () => {
  if (!nodeData.value.blockId) return
  
  try {
    // 使用思源API检查块是否存在
    const response = await request('/api/block/getBlockInfo', {
      id: nodeData.value.blockId
    })
    
    // 如果块不存在，标记为无效
    if (response.code === -1 || !response.data) {
      console.warn(`块ID无效: ${nodeData.value.blockId}，尝试恢复`)
      handleInvalidBlockId()
    }
  } catch (error) {
    console.error('检查块ID有效性时出错:', error)
  }
}, 5000)

// 处理无效的块ID
const handleInvalidBlockId = async () => {
  // 方案1: 尝试在节点中创建新的块
  try {
    const protyleIns = cardProtyleRef.value?.protyle.getInstance()
    if (!protyleIns) return
    
    // 创建一个新的段落块
    protyleIns.insert('\n', 'paragraph')
    
    // 稍后重新绑定ID
    setTimeout(() => {
      bindNodeIdToEnNode()
    }, 200)
  } catch (error) {
    console.error('创建新块时出错:', error)
  }
}

// 加强版的bindNodeIdToEnNode函数
const bindNodeIdToEnNode = () => {
  if (!cardProtyleRef.value) {
    return
  }
  
  const wysiwygElement = cardProtyleRef.value.protyle.wysiwyg.element
  if (!wysiwygElement) return
  
  // 查找第一个有效的块
  const firstNode = wysiwygElement.querySelector(`[data-node-id]`) as HTMLElement
  if (!firstNode) {
    return
  }
  
  const nodeId = firstNode.dataset.nodeId
  if (!nodeId) {
    return
  }

  // 检查新旧ID是否不同
  if (nodeData.value.blockId !== nodeId) {
    console.log(`更新节点块ID: ${nodeData.value.blockId} -> ${nodeId}`)
    nodeData.value.blockId = nodeId
    
    // 更新节点数据
    const nodes = getNodes.value
    const updatedNodes = nodes.map((node) => {
      if (node.id === flowNode.id) {
        return {
          ...node,
          data: {
            ...node.data,
            blockId: nodeId
          }
        }
      }
      return node
    })
    setNodes(updatedNodes)
  }
}

// 改进的事务监听函数
let offTransactionEvent = null
onMounted(() => {
  // 初始检查块ID有效性
  checkBlockIdValidity()
  
  // 监听事务
  offTransactionEvent = useSiyuanEventTransactions((event) => {
    bindNodeIdToEnNode()
    removeNodeCreatedByOther(event)
    
    // 仅当未处于合并状态时才触发合并操作
    if (!isMergingToSuperBlock.value) {
      mergeTopLevelBlocksIntoSuperBlock()
    }
    
    // 定期检查块ID有效性
    checkBlockIdValidity()
  })
})

onBeforeUnmount(() => {
  if (offTransactionEvent) {
    offTransactionEvent()
  }
  clearTimeout(mergeTimer)
})

const onResize = (event: OnResize) => {
  // 立即更新DOM元素样式以实现实时视觉反馈
  const nodeElement = document.querySelector(`[data-en-flow-node-id='${flowNode.id}']`)
  if (nodeElement) {
    const htmlElement = nodeElement as HTMLElement
    htmlElement.style.transition = 'none'
    htmlElement.style.width = `${flowNode.dimensions?.width}px`
    htmlElement.style.height = `${flowNode.height}px`
  }
  
  // 直接更新节点数据，不使用延迟
  const nodes = getNodes.value;
  const currentNode = nodes.find(node => node.id === flowNode.id);
  
  if (currentNode) {
    // 保存内容区域的高度，不包括工具栏高度
    const newNodes = nodes.map((node) => {
      if (node.id === flowNode.id) {
        return {
          ...node,
          data: {
            ...node.data,
            originalHeight: currentNode.height, // 保存调整后的高度
          },
        };
      }
      return node;
    });
    setNodes(newNodes);
  }
}

const handleRemoveNode = () => {
  removeNodes([flowNode])
  // 更新白板配置
  if (embedWhiteBoardConfigData.value) {
    embedWhiteBoardConfigData.value.boardOptions.nodes = getNodes.value.filter(
      (node) => node.id !== flowNode.id,
    )
  }
}

const handleDuplicateNode = () => {
  const nodes = getNodes.value
  const sourceNode = nodes.find((node) => node.id === flowNode.id)
  if (!sourceNode) return

  const newNode = {
    ...sourceNode,
    id: generateWhiteBoardNodeId(),
    position: {
      x: sourceNode.position.x + 50,
      y: sourceNode.position.y + 50,
    },
    data: {
      ...sourceNode.data,
    },
    selected: true,
    dragging: false,
    resizing: false,
  }

  const updatedNodes = nodes.map((node) => ({
    ...node,
    selected: node.id === sourceNode.id ? false : node.selected,
  }))
  setNodes(updatedNodes)
  addNodes([newNode])
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

// 引用折叠组件实例
const collapseRef = ref()

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
const isMindmapNode = computed(() => nodeData.value?.mindmap === true)

// 根据节点类型更新样式
const nodeTypeClass = computed(() => ({
  'is-mindmap': isMindmapNode.value,
}))

const handleIcons = {
  top: IconArrowUp,
  right: IconArrowRight,
  bottom: IconArrowDown,
  left: IconArrowLeft,
}

const {
  embedWhiteBoardConfigData,
} = getWhiteBoardConfigRefById(props.whiteBoardId, props.nodeId)

// 获取节点类型
const nodeType = computed(() => {
  return isMindmapNode.value ? 'EnWhiteBoardNodeMindmap' : 'EnWhiteBoardNodeProtyle'
})

// 更新节点类型
const updateNodeType = () => {
  if (!flowNode) return
  
  // 如果节点类型已经正确，则不需要更新
  if (flowNode.type === nodeType.value) return
  
  // 更新节点类型
  const nodes = getNodes.value || []
  const newNodes = nodes.map((node) => {
    if (node.id === flowNode.id) {
      return {
        ...node,
        type: nodeType.value,
      }
    }
    return node
  })
  setNodes(newNodes)
}

// 监听思维导图状态变化，更新节点类型
watch(isMindmapNode, (newValue) => {
  updateNodeType()
}, { immediate: true })

const handleToggleMindmap = () => {
  const nodes = getNodes.value || []
  const newNodes = nodes.map((node) => {
    if (node.id === flowNode.id) {
      return {
        ...node,
        type: !isMindmapNode.value ? 'EnWhiteBoardNodeMindmap' : 'EnWhiteBoardNodeProtyle',
        data: {
          ...node.data,
          mindmap: !isMindmapNode.value,
        },
      }
    }
    return node
  })
  setNodes(newNodes)
}

// 添加TreeCard节点类型的判断
const isTreeCardNode = computed(() => nodeData.value?.treecard === true)

// 添加TreeCard节点的模板部分
const handleToggleTreeCard = () => {
  // 切换节点类型
  const newNodes = getNodes.value.map((node) => {
    if (node.id === flowNode.id) {
      return {
        ...node,
        type: !isTreeCardNode.value ? EN_CONSTANTS.EN_WHITE_BOARD_NODE_TYPE_TREECARD : EN_CONSTANTS.EN_WHITE_BOARD_NODE_TYPE_PROTYLE,
        data: {
          ...node.data,
          treecard: !isTreeCardNode.value,
        },
      }
    }
    return node
  })
  setNodes(newNodes)
}

// 节点类名
const nodeClass = computed(() => {
  return {
    'is-selected': isSelected.value,
    'is-collapsed': isCollapsed.value,
    'is-mindmap': isMindmapNode.value,
    'is-treecard': isTreeCardNode.value,
  }
})

// 获取节点类型
const getNodeType = () => {
  if (isMindmapNode.value) {
    return 'EnWhiteBoardNodeMindmap'
  } else if (isTreeCardNode.value) {
    return 'EnWhiteBoardNodeTreeCard'
  } else {
    return 'EnWhiteBoardNodeProtyle'
  }
}

// 添加高度变化处理函数
const onHeightChanged = (height: number) => {
  // 这里可以添加额外的处理逻辑，例如在高度变化时更新其他组件
  // 或者触发事件等
  console.log('节点高度已更新:', height)
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
  border: var(--en-whiteboard-node-protyle-border-width) solid var(--node-color, var(--b3-border-color));
  border-radius: var(--en-whiteboard-card-radius);

  padding: unset;

  .main {
    flex: 1;
    display: flex;
    flex-direction: column;
    position: relative;
    overflow: hidden;

    &:not(.nodrag) {
      opacity: 1;

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
    border-color: var(--node-color, var(--b3-theme-primary-light));
    background-color: var(--b3-theme-background);
    color: var(--node-color, var(--b3-theme-primary-light));
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
    border: var(--en-whiteboard-node-protyle-border-width) solid var(--node-color, var(--b3-border-color));
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
    transition: all 0.3s ease-in-out;
    height: var(--en-card-height) !important; 
    min-height: var(--en-card-height) !important;
    max-height: var(--en-card-height) !important;

    .main {
      display: none;
    }

    .ProtyleToolbarArea {
      border-bottom: none;
      border-radius: var(--b3-border-radius);
      background-color: color-mix(in srgb, var(--b3-theme-surface) 65%, var(--node-color, var(--b3-border-color)));
    }

    .Handle,
    :deep(.vue-flow__resize-control) {
      display: none;
    }

    &.variant-default {
      border: 1px solid var(--node-color, var(--b3-border-color));
    }

    &.variant-card {
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
    }
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
  flex-shrink: 0;
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

  /* 确保在白板环境中protyle-content没有底部padding */
  .protyle-content {
    padding-bottom: 0 !important;
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
      border-color: var(--node-color, var(--b3-theme-primary-light));
    }
  }
}

.vue-flow__node-EnWhiteBoardNodeMindmap {
  --en-whiteboard-mindmap-cursor: default;
  
  &.selected {
    .EnWhiteBoardNodeMindmapContainer {
      border-color: var(--b3-theme-primary);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
  }

  &.dragging {
    .EnWhiteBoardNodeMindmapContainer {
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
    }
  }
}

.EnProtyleContainer > .protyle {
  background-color: inherit;
}
</style>
