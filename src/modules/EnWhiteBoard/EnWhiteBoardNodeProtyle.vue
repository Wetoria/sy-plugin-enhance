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
    >
      <a-tooltip content="块 ID">
        <a-button>
          <EnIconTarget />
        </a-button>
        <template #content>
          <div>
            <div>
              当前绑定的块 ID:
            </div>
            <div>
              <a-input
                v-model="nodeData.blockId"
                style="width: 200px"
              />
            </div>
          </div>
        </template>
      </a-tooltip>
    </EnWhiteBoardToolBar>
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
            changeHelperPosition
            @after="afterProtyleLoad"
          />
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
            changeHelperPosition
            @after="afterProtyleLoad"
          />
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
      'backgroundColor': nodeData.style?.backgroundColor
        ? `color-mix(in srgb, var(--b3-theme-background) 95%, ${nodeData.style.backgroundColor})`
        : undefined,
      'borderColor': nodeData.style?.backgroundColor || 'var(--b3-border-color)',
    }"
  >
    <EnWhiteBoardNodeFit
      :nodeId="flowNode.id"
      :whiteBoardConfigData="embedWhiteBoardConfigData"
      @height-changed="onHeightChanged"
    />
    <div
      v-if="isCollapsed"
      class="ProtyleToolbarArea"
    >
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
          changeHelperPosition
          @after="afterProtyleLoad"
        />
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
import EnIconTarget from '@/components/EnIconTarget.vue'
import EnProtyle from '@/components/EnProtyle.vue'
import {
  generateWhiteBoardNodeId,
  getWhiteBoardConfigRefById,
  globalMergingState,
  useWhiteBoardModule,
} from '@/modules/EnWhiteBoard/EnWhiteBoard'
import { debounce } from '@/utils'
import { EN_CONSTANTS } from '@/utils/Constants'
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
import EnWhiteBoardNodeCollapse from './components/EnWhiteBoardNodeCollapse.vue'
import EnWhiteBoardNodeFit from './components/EnWhiteBoardNodeFit.vue'
import EnWhiteBoardNodeMindmap from './EnWhiteBoardNodeMindmap.vue'
import EnWhiteBoardNodeTreeCard from './EnWhiteBoardNodeTreeCard.vue'
import EnWhiteBoardToolBar from './EnWhiteBoardToolBar.vue'

const props = defineProps<{
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

    // 未滚动到卡片顶部或底部时，阻止滚动
    if ((event.deltaY < 0 && !isAtTop) || (event.deltaY > 0 && !isAtBottom)) {
      event.stopImmediatePropagation()
    }
  }
}

const cardProtyleRef = ref<Protyle | null>(null)

const blockIdCheckSuspended = ref(false)
const recentlyMergedNodeIds = ref<string[]>([])
const blockIdCheckInProgress = ref(false)

const recordAffectedNodes = () => {
  const allNodes = getNodes.value || []
  const affectedNodeIds = allNodes.map((node) => node.id)
  recentlyMergedNodeIds.value = affectedNodeIds

  blockIdCheckSuspended.value = true

  setTimeout(() => {
    blockIdCheckSuspended.value = false
    recentlyMergedNodeIds.value = []
  }, 5000)
}

const afterProtyleLoad = (protyle: Protyle) => {
  cardProtyleRef.value = protyle

  protectSiyuanRenderer(protyle)
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
  if (!whiteBoardModuleOptions.value.autoMergeToSuperBlock) {
    return
  }

  try {
    const {
      detail,
    } = event || {}

    if (!detail) {
      return
    }

    const {
      sid,
      data,
    } = detail

    if (!data || !Array.isArray(data)) {
      return
    }

    const currentProtyleId = cardProtyleRef.value?.protyle?.id
    if (!currentProtyleId) return

    data.forEach((item) => {
      if (!item) return

      const {
        doOperations = [],
      } = item

      if (!doOperations || !Array.isArray(doOperations)) {
        return
      }

      doOperations.forEach((operation) => {
        if (!operation) return

        const {
          action,
          id: opId,
        } = operation

        if (!action || !opId) return

        const isCreate = action === 'insert'
        const isCreateByOther = sid !== currentProtyleId

        if (isCreate && isCreateByOther) {
          let timer = null
          let attempts = 0
          const maxAttempts = 10

          timer = setInterval(() => {
            attempts++

            try {
              const wysiwygElement = cardProtyleRef.value?.protyle?.wysiwyg?.element
              if (!wysiwygElement) {
                clearInterval(timer)
                return
              }

              const firstLevelChildren = wysiwygElement?.children
              if (!firstLevelChildren || firstLevelChildren.length === 0) {
                if (attempts >= maxAttempts) {
                  clearInterval(timer)
                }
                return
              }

              const targetElement = Array.from(firstLevelChildren).find((child: HTMLElement) => {
                if (!child || !child.dataset) return false
                const childNodeId = child.dataset.nodeId
                return childNodeId && childNodeId === opId
              }) as HTMLElement | undefined

              if (targetElement && 'remove' in targetElement) {
                targetElement.remove()
                clearInterval(timer)
              } else if (attempts >= maxAttempts) {
                clearInterval(timer)
              }
            } catch (error) {
              console.error('移除其他创建的节点时出错:', error)
              clearInterval(timer)
            }
          }, 50)
        }
      })
    })
  } catch (error) {
    console.error('处理删除由其他用户创建的节点时出错:', error)
  }
}

const isMergingToSuperBlock = ref(false)
const mergeAttemptsCount = ref(0)
const maxMergeAttempts = 3
let mergeTimer = null

const mergeTopLevelBlocksIntoSuperBlock = debounce(() => {
  if (!whiteBoardModuleOptions.value.autoMergeToSuperBlock) {
    return
  }

  if (globalMergingState.isMerging.value || isMergingToSuperBlock.value) {
    return
  }

  if (!cardProtyleRef.value?.protyle?.wysiwyg?.element) {
    return
  }

  let children = []
  try {
    children = Array.from(cardProtyleRef.value.protyle.wysiwyg.element.children || [])
  } catch (e) {
    console.warn('获取子元素失败:', e)
    return
  }

  if (children.length <= 1) {
    mergeAttemptsCount.value = 0
    return
  }

  const validChildren = children.filter((child: HTMLElement) =>
    child.dataset && child.dataset.nodeId
    && !child.classList.contains('protyle-action'),
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

    const blockIdsToMerge = validChildren.map((child) => child.dataset?.nodeId).filter(Boolean)

    if (nodeData.value?.blockId) {
      globalMergingState.startMerging(flowNode.id, nodeData.value.blockId)

      blockIdsToMerge.forEach((id) => {
        if (id) globalMergingState.addAffectedBlockId(id)
      })
    }

    isMergingToSuperBlock.value = true
    mergeAttemptsCount.value++

    updateNodeMergingStatus(true)

    blockIdCheckSuspended.value = true

    console.log(`开始合并超级块，影响块ID: ${blockIdsToMerge.join(', ')}`)

    protyleIns.turnIntoOneTransaction(validChildren, 'BlocksMergeSuperBlock', 'row')

    const off = useSiyuanDatabaseIndexCommit(debounce(() => {
      off()
      setTimeout(() => {
        checkMergeResult()
      }, 300)
    }, 100))

    clearTimeout(mergeTimer)
    mergeTimer = setTimeout(() => {
      if (isMergingToSuperBlock.value) {
        console.warn('合并超级块操作超时，恢复状态')
        finishMergeProcess(false)
      }
    }, 5000)
  } catch (error) {
    console.error('合并超级块时出错:', error)
    finishMergeProcess(false)
  }
}, whiteBoardModuleOptions.value.autoMergeToSuperBlockDelay * 1000)

const checkMergeResult = () => {
  if (!cardProtyleRef.value?.protyle?.wysiwyg?.element) {
    finishMergeProcess(false)
    return
  }

  try {
    const element = cardProtyleRef.value.protyle.wysiwyg.element

    if (!element || typeof element.querySelectorAll !== 'function') {
      console.warn('无法安全访问渲染元素')
      finishMergeProcess(false)
      return
    }

    let children = []
    try {
      children = Array.from(element.children || [])
    } catch (e) {
      console.warn('获取子元素失败:', e)
      finishMergeProcess(false)
      return
    }

    let superBlock = null
    try {
      superBlock = children.find((child: HTMLElement) =>
        child.dataset && child.dataset.type === 'NodeSuperBlock',
      )
    } catch (e) {
      console.warn('查找超级块失败:', e)
    }

    if (superBlock) {
      console.log('成功合并为超级块')

      try {
        if (superBlock instanceof HTMLElement) {
          superBlock.setAttribute('data-protected-superblock', 'true')
          superBlock.setAttribute('data-rendered', 'true')

          const newBlockId = superBlock.dataset.nodeId
          if (newBlockId) {
            updateBlockIdAfterMerge(newBlockId)
          }
        }
      } catch (e) {
        console.warn('为超级块添加保护属性失败:', e)
      }

      setTimeout(() => {
        try {
          bindNodeIdToEnNode()
        } catch (error) {
          console.error('合并后绑定节点ID出错:', error)
        }

        finishMergeProcess(true)
      }, 300)

      mergeAttemptsCount.value = 0
    } else if (mergeAttemptsCount.value < maxMergeAttempts) {
      console.warn(`合并超级块失败，尝试重新合并 (${mergeAttemptsCount.value}/${maxMergeAttempts})`)
      setTimeout(() => {
        mergeTopLevelBlocksIntoSuperBlock()
      }, 500)
    } else {
      console.error('多次尝试合并超级块失败，放弃操作')
      finishMergeProcess(false)
      mergeAttemptsCount.value = 0
    }
  } catch (error) {
    console.error('检查合并结果时出错:', error)
    finishMergeProcess(false)
  }
}

const updateNodeMergingStatus = (merging: boolean) => {
  const nodes = getNodes.value
  const updatedNodes = nodes.map((node) => {
    if (node.id === flowNode.id) {
      return {
        ...node,
        data: {
          ...node.data,
          isMergingToSuperBlock: merging,
        },
      }
    }
    return node
  })
  setNodes(updatedNodes)
}

// 缓存上一次的块ID
const lastCheckedBlockId = ref<string | null>(null)

// 块ID变更检测
const detectBlockIdChange = () => {
  if (!nodeData.value?.blockId) return

  // 检查块ID是否发生变化
  if (lastCheckedBlockId.value && lastCheckedBlockId.value !== nodeData.value.blockId) {
    console.log(`检测到块ID变更: ${lastCheckedBlockId.value} -> ${nodeData.value.blockId}`)

    // 更新视图内容
    updateProtyleContent()
  }

  // 更新上一次检查的块ID
  lastCheckedBlockId.value = nodeData.value.blockId
}

// 更新Protyle内容
const updateProtyleContent = () => {
  if (!cardProtyleRef.value?.protyle || !nodeData.value?.blockId) return

  try {
    const protyle = cardProtyleRef.value.protyle
    if (typeof protyle.reloadValue === 'function') {
      protyle.reloadValue(nodeData.value.blockId)
      console.log('重新加载Protyle内容，块ID:', nodeData.value.blockId)
    } else if (protyle.getInstance && typeof protyle.getInstance().reloadBlock === 'function') {
      protyle.getInstance().reloadBlock(nodeData.value.blockId)
      console.log('重新加载块内容，块ID:', nodeData.value.blockId)
    }
  } catch (error) {
    console.error('更新Protyle内容时出错:', error)
  }
}

// 增强的块ID检查函数
const checkBlockIdValidity = debounce(async () => {
  // 检测并处理块ID变更
  detectBlockIdChange()

  // 跳过检查的条件
  if (
    globalMergingState.isMerging.value
    || globalMergingState.isNodeMerging(flowNode.id)
    || (nodeData.value?.blockId && globalMergingState.isBlockAffected(nodeData.value.blockId))
    || blockIdCheckSuspended.value
    || !nodeData.value?.blockId
    || blockIdCheckInProgress.value
  ) { return
  }

  blockIdCheckInProgress.value = true

  try {
    // 使用思源API检查块是否存在
    const response = await request('/api/block/getBlockInfo', {
      id: nodeData.value.blockId,
    })

    // 如果块不存在且不在全局合并状态中，标记为无效
    if (response.code === -1 || !response.data) {
      // 再次检查是否处于全局合并状态，防止在API请求期间状态变化
      if (
        !globalMergingState.isMerging.value
        && !globalMergingState.isBlockAffected(nodeData.value.blockId)
      ) {
        console.warn(`块ID无效: ${nodeData.value.blockId}，尝试恢复`)
        await handleInvalidBlockId()
      } else {
        console.log(`块ID ${nodeData.value.blockId} 在合并过程中暂时无效，跳过恢复`)
      }
    }
  } catch (error) {
    console.error('检查块ID有效性时出错:', error)
  } finally {
    blockIdCheckInProgress.value = false
  }
}, 5000)

let invalidBlockIdHandling = false
const handleInvalidBlockId = async () => {
  if (invalidBlockIdHandling) {
    return
  }

  invalidBlockIdHandling = true

  try {
    const protyleIns = cardProtyleRef.value?.protyle?.getInstance?.()
    if (!protyleIns) {
      console.warn('无法获取 protyle 实例')
      return
    }

    if (typeof protyleIns.insert !== 'function') {
      console.warn('protyle 实例中没有 insert 方法或不是函数')
      return
    }

    protyleIns.insert('\n', 'paragraph')

    await new Promise((resolve) => setTimeout(resolve, 500))

    try {
      bindNodeIdToEnNode()
    } catch (e) {
      console.error('绑定新节点ID时出错:', e)
    }
  } catch (error) {
    console.error('创建新块时出错:', error)
    if (error instanceof Error) {
      console.error('错误详情:', error.message, error.stack)
    }
  } finally {
    setTimeout(() => {
      invalidBlockIdHandling = false
    }, 2000)
  }
}

let bindNodeIdQueue = []
let bindNodeIdProcessing = false

const processBindNodeIdQueue = async () => {
  if (bindNodeIdProcessing || bindNodeIdQueue.length === 0) {
    return
  }

  bindNodeIdProcessing = true

  try {
    await bindNodeIdToEnNodeImpl()
  } catch (error) {
    console.error('处理节点ID绑定队列时出错:', error)
  } finally {
    bindNodeIdQueue.shift()
    bindNodeIdProcessing = false

    if (bindNodeIdQueue.length > 0) {
      setTimeout(processBindNodeIdQueue, 100)
    }
  }
}

const bindNodeIdToEnNode = () => {
  bindNodeIdQueue.push(Date.now())
  if (!bindNodeIdProcessing) {
    processBindNodeIdQueue()
  }
}

const bindNodeIdToEnNodeImpl = async () => {
  try {
    await new Promise((resolve) => setTimeout(resolve, 10))

    if (!cardProtyleRef.value) {
      return
    }

    const protyle = cardProtyleRef.value.protyle
    if (!protyle || !protyle.wysiwyg) {
      console.warn('无法获取 protyle.wysiwyg')
      return
    }

    const wysiwygElement = protyle.wysiwyg.element
    if (!wysiwygElement) {
      console.warn('无法获取 wysiwyg.element')
      return
    }

    const firstNode = wysiwygElement.querySelector(`[data-node-id]`) as HTMLElement
    if (!firstNode) {
      console.warn('无法找到有效的块元素')
      return
    }

    const nodeId = firstNode.dataset?.nodeId
    if (!nodeId) {
      console.warn('找到的块元素没有 nodeId')
      return
    }

    if (!nodeData.value) {
      console.warn('nodeData.value 不存在')
      return
    }

    if (nodeData.value.blockId !== nodeId) {
      console.log(`更新节点块ID: ${nodeData.value.blockId} -> ${nodeId}`)
      nodeData.value.blockId = nodeId

      const nodes = getNodes.value
      if (!nodes || !flowNode || !flowNode.id) {
        console.warn('nodes 或 flowNode 不存在')
        return
      }

      const updatedNodes = nodes.map((node) => {
        if (node.id === flowNode.id) {
          return {
            ...node,
            data: {
              ...node.data,
              blockId: nodeId,
            },
          }
        }
        return node
      })
      setNodes(updatedNodes)
    }
  } catch (error) {
    console.error('绑定节点ID时出错:', error)
    if (error instanceof Error) {
      console.error('错误详情:', error.message, error.stack)
    }
  }
}

// 添加事务处理计数和日志
const eventLogEnabled = ref(false)
const transactionCount = ref(0)
let offTransactionEvent = null // 定义事务监听清理函数

// 记录事务日志
const logTransaction = (operation: string, data: any) => {
  if (!eventLogEnabled.value) return
  console.log(`[事务${transactionCount.value}] ${operation}:`, data)
}

// 处理思源事务
const handleTransaction = (event) => {
  return
  try {
    transactionCount.value++
    const detail = event?.detail

    // 记录事务详情
    logTransaction('接收事务', {
      sid: detail?.sid,
      dataCount: detail?.data?.length || 0,
    })

    // 忽略空事务
    if (!detail || !detail.data || !Array.isArray(detail.data) || detail.data.length === 0) {
      return
    }

    // 检查是否有块操作
    const operations = []
    let hasNodeChange = false

    detail.data.forEach((item) => {
      if (item?.doOperations && Array.isArray(item.doOperations)) {
        item.doOperations.forEach((op) => {
          if (op && op.action) {
            operations.push(op)
            if (['update', 'insert', 'delete', 'moveBlock', 'foldHeading'].includes(op.action)) {
              hasNodeChange = true
            }
          }
        })
      }
    })

    // 记录操作类型
    logTransaction('操作类型', operations.map((op) => op.action))

    // 检测全局合并状态
    const inGlobalMerging = globalMergingState.isMerging.value
    const inLocalMerging = isMergingToSuperBlock.value

    logTransaction('合并状态', {
      全局合并: inGlobalMerging,
      局部合并: inLocalMerging,
      节点ID: flowNode.id,
      块ID: nodeData.value?.blockId,
    })

    // 先检测块ID变更，这个操作总是安全的
    detectBlockIdChange()

    // 如果没有节点变化，不需要继续处理
    if (!hasNodeChange) {
      return
    }

    // 根据合并状态决定执行的操作
    if (!inGlobalMerging) {
      // 只有在非全局合并状态下才执行绑定和移除操作
      bindNodeIdToEnNode()

      // 移除其他创建的节点
      removeNodeCreatedByOther(event)

      // 在非全局和非局部合并状态下，执行合并和检查
      if (!inLocalMerging) {
        // 检查是否需要触发合并
        mergeTopLevelBlocksIntoSuperBlock()

        // 检查块ID有效性
        checkBlockIdValidity()
      }
    } else {
      logTransaction('跳过操作', '当前处于全局合并状态')
    }
  } catch (error) {
    console.error('处理思源事务时出错:', error)
  }
}

// 设置事务监听
onMounted(() => {
  // 延迟初始检查，确保组件已完全加载
  setTimeout(() => {
    checkBlockIdValidity()
  }, 1000)

  // 监听思源事务
  offTransactionEvent = useSiyuanEventTransactions(handleTransaction)
})

onBeforeUnmount(() => {
  if (offTransactionEvent) {
    offTransactionEvent()
  }
  clearTimeout(mergeTimer)

  // 确保全局合并状态结束
  if (globalMergingState.isNodeMerging(flowNode.id)) {
    globalMergingState.endMerging()
  }
})

const onResize = (event: OnResize) => {
  const nodeElement = document.querySelector(`[data-en-flow-node-id='${flowNode.id}']`)
  if (nodeElement) {
    const htmlElement = nodeElement as HTMLElement
    htmlElement.style.transition = 'none'
    htmlElement.style.width = `${flowNode.dimensions?.width}px`
    htmlElement.style.height = `${flowNode.height}px`
  }

  const nodes = getNodes.value
  const currentNode = nodes.find((node) => node.id === flowNode.id)

  if (currentNode) {
    const newNodes = nodes.map((node) => {
      if (node.id === flowNode.id) {
        return {
          ...node,
          data: {
            ...node.data,
            originalHeight: currentNode.height,
          },
        }
      }
      return node
    })
    setNodes(newNodes)
  }
}

const handleRemoveNode = () => {
  removeNodes([flowNode])
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

const collapseRef = ref()

const blockInfo = ref({
  title: '',
  name: '',
  alias: '',
  type: '',
  content: '',
  docName: '',
})

const getBlockInfo = async (blockId: string) => {
  try {
    const blockResponse = await request('/api/block/getBlockInfo', { id: blockId })
    if (blockResponse) {
      const docResponse = await request('/api/block/getDocInfo', { id: blockId })

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

const displayText = computed(() => {
  if (blockInfo.value.type === 'd') {
    return blockInfo.value.title || '无标题文档'
  }

  return blockInfo.value.name
    || blockInfo.value.alias
    || blockInfo.value.docName
    || blockInfo.value.content
    || '未命名块'
})

watch(() => nodeData.value?.blockId, async (newBlockId) => {
  if (newBlockId) {
    await getBlockInfo(newBlockId)
  }
}, { immediate: true })

const isMindmapNode = computed(() => nodeData.value?.mindmap === true)

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

const nodeType = computed(() => {
  return isMindmapNode.value ? 'EnWhiteBoardNodeMindmap' : 'EnWhiteBoardNodeProtyle'
})

const updateNodeType = () => {
  if (!flowNode) return

  if (flowNode.type === nodeType.value) return

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

const isTreeCardNode = computed(() => nodeData.value?.treecard === true)

const handleToggleTreeCard = () => {
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

const nodeClass = computed(() => {
  return {
    'is-selected': isSelected.value,
    'is-collapsed': isCollapsed.value,
    'is-mindmap': isMindmapNode.value,
    'is-treecard': isTreeCardNode.value,
  }
})

const getNodeType = () => {
  if (isMindmapNode.value) {
    return 'EnWhiteBoardNodeMindmap'
  } else if (isTreeCardNode.value) {
    return 'EnWhiteBoardNodeTreeCard'
  } else {
    return 'EnWhiteBoardNodeProtyle'
  }
}

const onHeightChanged = (height: number) => {
  console.log('节点高度已更新:', height)
}

const protectSiyuanRenderer = (protyle) => {
  if (!protyle || !protyle.protyle || !protyle.protyle.wysiwyg || !protyle.protyle.wysiwyg.element) {
    return
  }

  const element = protyle.protyle.wysiwyg.element

  const setupSuperBlockProtection = () => {
    try {
      const superBlocks = element.querySelectorAll('[data-type="NodeSuperBlock"]')
      superBlocks.forEach((block) => {
        block.setAttribute('data-protected-superblock', 'true')
        block.setAttribute('data-rendered', 'true')
      })
    } catch (error) {
      console.warn('设置超级块保护时出错:', error)
    }
  }

  setupSuperBlockProtection()

  element.addEventListener('mouseover', (e) => {
    try {
      const target = e.target
      if (target && (
        target.getAttribute('data-type') === 'NodeSuperBlock'
        || target.closest('[data-type="NodeSuperBlock"]')
      )) {
        target.setAttribute('data-protected', 'true')

        const superBlock = target.closest('[data-type="NodeSuperBlock"]')
        if (superBlock) {
          superBlock.setAttribute('data-protected-superblock', 'true')
          superBlock.setAttribute('data-rendered', 'true')
        }
      }
    } catch (error) {
      console.warn('处理mouseover事件时出错:', error)
    }
  }, true)

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        setupSuperBlockProtection()
      }
    }
  })

  observer.observe(element, {
    childList: true,
    subtree: true,
  })

  window.addEventListener('error', (event) => {
    if (event.error
      && event.error.stack
      && (event.error.stack.includes('render')
        || event.error.stack.includes('querySelector'))) {
      console.warn('已拦截思源渲染错误:', event.error.message)
      event.preventDefault()
      event.stopPropagation()
      return true
    }
  }, true)
}

const finishMergeProcess = (success = true) => {
  isMergingToSuperBlock.value = false
  updateNodeMergingStatus(false)

  setTimeout(() => {
    blockIdCheckSuspended.value = false
    globalMergingState.endMerging()

    if (success) {
      console.log('超级块合并过程完成')
    }
  }, 500)
}

const updateBlockIdAfterMerge = (newBlockId: string) => {
  if (!newBlockId || !nodeData.value) return

  if (nodeData.value.blockId !== newBlockId) {
    console.log(`合并后更新节点块ID: ${nodeData.value.blockId} -> ${newBlockId}`)
    nodeData.value.blockId = newBlockId

    const nodes = getNodes.value
    if (!nodes || !flowNode || !flowNode.id) return

    const updatedNodes = nodes.map((node) => {
      if (node.id === flowNode.id) {
        return {
          ...node,
          data: {
            ...node.data,
            blockId: newBlockId,
          },
        }
      }
      return node
    })
    setNodes(updatedNodes)
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
