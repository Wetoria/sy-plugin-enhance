<template>
  <Teleport
    v-for="resizer in resizerListRef"
    :key="resizer.dataset.en_loop_key"
    :to="resizer"
  >
    <div
      class="super-block-resizer-area"
    >
      <div
        class="add-button"
        :class="{
          start: resizer.classList.contains('start'),
          end: resizer.classList.contains('end'),
        }"
        title="在左侧添加列"
        @click="handleAddButtonClick"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M7 2V12M2 7H12"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </div>


      <div
        v-if="!resizer.classList.contains('start') && !resizer.classList.contains('end')"
        class="resizer-area"
        @mousedown="handleMouseDown"
        @click="handleClick"
      >
        <div
          class="resizer-indicator"
        ></div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import {
  appendBlock,
  insertBlock,
  prependBlock,
} from '@/api'
import { useProtyleList } from '@/global/ProtyleList'
import { usePlugin } from '@/main'
import {
  generateShortUUID,
  generateUUIDWithTimestamp,
  moduleEnableStatusSwitcher,
} from '@/utils'
import {
  onCountClick,
  queryAllByDom,
} from '@/utils/DOM'
import { useObserver } from '@/utils/elements/Observer'
import { useMousePostion } from '@/utils/Mouse'
import {
  SyDomNodeTypes,
  useCurrentProtyle,
} from '@/utils/Siyuan'
import { debounce } from 'lodash-es'
import { showMessage } from 'siyuan'
import {
  onBeforeUnmount,
  onMounted,
  ref,
} from 'vue'


const superBlockListRef = ref<HTMLDivElement[]>([])
const resizerListRef = ref<HTMLDivElement[]>([])

const isSyNodeInSuperBlock = (node: HTMLElement) => {
  return node.dataset.nodeId && !node.dataset.nodeId.startsWith('en-super-block-width-resizer-')
}

const generateResizerContainer = () => {
  const resizer = document.createElement('div')
  resizer.className = 'enSuperBlockWidthResizerContainer protyle-custom'
  resizer.dataset.en_loop_key = generateUUIDWithTimestamp()
  return resizer
}

// 为指定的 superBlock 插入 resizer
const insertResizerToSuperBlock = (superBlock: HTMLDivElement) => {
  // 检查是否已经有 resizer
  if (superBlock.querySelector('.enSuperBlockWidthResizerContainer')) {
    return
  }

  const childList = superBlock.children
  if (!childList.length) {
    return
  }

  const needAppendDom = []
  for (let i = 0; i < childList.length; i++) {
    const child = childList[i] as HTMLElement
    if (!isSyNodeInSuperBlock(child)) {
      continue
    }

    needAppendDom.push(child)
  }

  if (!needAppendDom.length) {
    return
  }

  needAppendDom.forEach((child: HTMLElement, index: number) => {
    const resizer = generateResizerContainer()
    const isStart = index === 0
    if (isStart) {
      resizer.classList.toggle('start', true)
      resizer.classList.toggle('first-or-last', true)
    } else {
      resizer.dataset.nodeId = `en-super-block-width-resizer-${generateShortUUID()}`
    }
    superBlock.insertBefore(resizer, child)
    resizerListRef.value.push(resizer)
  })

  const lastSyNode = needAppendDom[needAppendDom.length - 1]
  const lastSyNodeRightNode = lastSyNode.nextElementSibling as HTMLElement

  const resizer = generateResizerContainer()
  resizer.classList.toggle('first-or-last', true)
  resizer.classList.toggle('end', true)
  if (lastSyNodeRightNode) {
    superBlock.insertBefore(resizer, lastSyNodeRightNode)
    resizerListRef.value.push(resizer)
  } else {
    superBlock.appendChild(resizer)
    resizerListRef.value.push(resizer)
  }

  superBlock.classList.add('en-super-block-width-resizer-hover')
}

// 从指定的 superBlock 移除 resizer
const removeResizerFromSuperBlock = (superBlock: HTMLDivElement) => {
  const resizers = superBlock.querySelectorAll('.enSuperBlockWidthResizerContainer')
  resizerListRef.value = resizerListRef.value.filter((resizer) => ![...resizers].includes(resizer))
  resizers.forEach((resizer) => {
    resizer.remove()
  })
  superBlock.classList.remove('en-super-block-width-resizer-hover')
}

// 获取最接近的 superBlock 元素
const getClosestSuperBlock = (element: HTMLElement): HTMLDivElement | null => {
  const superBlock = element.closest('div[data-type="NodeSuperBlock"][data-sb-layout="col"]') as HTMLDivElement
  return superBlock
}

// 移除除当前 superBlock 之外，其他所有拥有 resizer 的 superBlock 容器
const removeResizerFromOtherSuperBlocks = (currentSuperBlock: HTMLDivElement) => {
  const owners = new Set<HTMLDivElement>()
  resizerListRef.value.forEach((resizer) => {
    const owner = resizer.closest('div[data-type="NodeSuperBlock"][data-sb-layout="col"]') as HTMLDivElement
    if (owner && owner !== currentSuperBlock) {
      owners.add(owner)
    }
  })
  owners.forEach((owner) => removeResizerFromSuperBlock(owner))
}


// 处理鼠标移入事件
const handleMouseEnter = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  const superBlock = getClosestSuperBlock(target)

  if (superBlock && superBlockListRef.value.includes(superBlock)) {
    // 进入该层前移除其他层（父级/子级/兄弟）的容器
    removeResizerFromOtherSuperBlocks(superBlock)
    insertResizerToSuperBlock(superBlock)
  }
}

// 处理鼠标移出事件
const handleMouseLeave = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  const superBlock = getClosestSuperBlock(target)

  if (superBlock && superBlockListRef.value.includes(superBlock)) {
    // 延迟移除，避免拖拽时意外移除
    setTimeout(() => {
      // 检查鼠标是否真的离开了这个 superBlock
      if (!superBlock.matches(':hover')) {
        removeResizerFromSuperBlock(superBlock)
      }
    }, 100)
  }
}


const protyleList = useProtyleList()
const handler = debounce(() => {
  const targetParagraphList = queryAllByDom(
    document.body,
    `.protyle div[data-type="${SyDomNodeTypes.NodeSuperBlock}"][data-sb-layout="col"]`,
  ) as HTMLDivElement[]

  const list = protyleList.value.filter(
    (item) => item.isEditorProtyle || item.isFlashCardProtyle || item.isInDialog,
  )

  const validSuperBlocks = targetParagraphList.filter((superBlock) => {
    const protyleOfSuperBlock = superBlock.closest('.protyle')
    return list.find((item) => item.protyleEl === protyleOfSuperBlock)
  })

  // 检查 superBlock 元素是否有变化
  const hasElementChanged = () => {
    if (superBlockListRef.value.length !== validSuperBlocks.length) {
      return true
    }

    const oldHasRemoved = superBlockListRef.value.some((oldSuperBlock) => {
      return !validSuperBlocks.includes(oldSuperBlock)
    })
    if (oldHasRemoved) {
      return true
    }


    const newHasRemoved = validSuperBlocks.some((newSuperBlock) => {
      return !superBlockListRef.value.includes(newSuperBlock)
    })
    if (newHasRemoved) {
      return true
    }

    return false
  }

  // 如果元素有变化，需要重新绑定事件
  if (!hasElementChanged()) {
    return
  }

  // 清理所有现有的事件监听器
  superBlockListRef.value.forEach((superBlock) => {
    superBlock.removeEventListener('mouseover', handleMouseEnter)
    superBlock.removeEventListener('mouseleave', handleMouseLeave)
    removeResizerFromSuperBlock(superBlock)
  })


  // 为新找到的 superBlock 绑定事件
  validSuperBlocks.forEach((superBlock) => {
    if (!superBlock.dataset.en_mouse_bound) {
      superBlock.addEventListener('mouseover', handleMouseEnter)
      superBlock.addEventListener('mouseleave', handleMouseLeave)
      superBlock.dataset.en_mouse_bound = 'true'
    }
  })
  superBlockListRef.value = [...validSuperBlocks]
}, 300)


const {
  observe,
  unobserve,
} = useObserver({
  target: document.documentElement,
  callback: handler,
})

const plugin = usePlugin()

onMounted(() => {
  if (!plugin.isMobile) {
    observe()
  }
})

onBeforeUnmount(() => {
  if (!plugin.isMobile) {
    unobserve()
  }

  // 清理所有事件监听器和 resizer 元素
  superBlockListRef.value.forEach((superBlock) => {
    superBlock.removeEventListener('mouseenter', handleMouseEnter)
    superBlock.removeEventListener('mouseleave', handleMouseLeave)
    removeResizerFromSuperBlock(superBlock)
  })
})

const resizerInfo = ref<{
  startX: number
  resizer: HTMLElement
  superBlock: HTMLElement
  contentTotalWidthPercent: number
  nodeLeft: HTMLElement
  nodeRight: HTMLElement
  percentMap: Map<HTMLElement, number>
  childrenCopied: HTMLElement[]
}>(null)

const recordDomWidthPercent = (map: Map<HTMLElement, number>, dom: HTMLElement, percent: number, totalPercent: number) => {
  map.set(dom, percent)
  dom.dataset.en_width_percent = `${Number.parseFloat(((percent / totalPercent) * 100).toFixed(2))}%`
}

const updateDomWidthPercent = (dom: HTMLElement, percent: number, totalPercent: number) => {
  dom.style.flex = `1 0 auto`
  dom.style.width = `${percent}%`
  dom.dataset.en_width_percent = `${Number.parseFloat(((percent / totalPercent) * 100).toFixed(2))}%`
}


const getResizerInfoByEvent = (event: MouseEvent) => {
  const resizerDom = event.target as HTMLElement
  const resizerContainer = resizerDom.closest('.enSuperBlockWidthResizerContainer')
  if (!resizerContainer) {
    return
  }
  const superBlock = resizerDom.closest('div[data-node-id][data-type="NodeSuperBlock"]') as HTMLElement
  const nodeLeft = resizerContainer.previousElementSibling as HTMLElement
  const nodeRight = resizerContainer.nextElementSibling as HTMLElement

  const percentMap = new Map<HTMLElement, number>()

  const childNodes = Array.from(superBlock.children).filter((child: HTMLElement) => {
    return isSyNodeInSuperBlock(child)
  })
  const childrenCopied = childNodes.map((child) => child.cloneNode(true) as HTMLElement)

  const superBlockRect = superBlock.getBoundingClientRect()
  const computedStyle = window.getComputedStyle(superBlock)
  const fontSize = Number.parseFloat(computedStyle.fontSize)
  const resizerContainerWidth = fontSize * 1.5
  const totalResizerWidth = resizerContainerWidth * (childNodes.length - 1)
  const totalContentWidth = superBlockRect.width - totalResizerWidth
  // const totalContentWidth = superBlockRect.width
  let resetUnsetContentPercent = 100 - ((totalResizerWidth / superBlockRect.width) * 100)
  const contentTotalWidthPercent = resetUnsetContentPercent

  const unsetWidthChildren = []
  childNodes.forEach((child: HTMLElement) => {
    const currentWidth = child.style.width
    if (!currentWidth) {
      unsetWidthChildren.push(child)
      return
    }
    const isPercentWidth = currentWidth.includes('%')
    if (isPercentWidth) {
      const childPercent = Number(currentWidth.replace('%', ''))
      resetUnsetContentPercent -= childPercent
      recordDomWidthPercent(percentMap, child, childPercent, contentTotalWidthPercent)
      return
    }

    const widthPx = Number(currentWidth.replace('px', ''))
    const childPercent = (widthPx / totalContentWidth) * 100
    resetUnsetContentPercent -= childPercent
    recordDomWidthPercent(percentMap, child, childPercent, contentTotalWidthPercent)
  })

  const unsetContentSplitedPercent = resetUnsetContentPercent / unsetWidthChildren.length
  unsetWidthChildren.forEach((child) => {
    recordDomWidthPercent(percentMap, child, unsetContentSplitedPercent, contentTotalWidthPercent)
    updateDomWidthPercent(child, unsetContentSplitedPercent, contentTotalWidthPercent)
  })

  resizerInfo.value = {
    startX: event.x,
    resizer: resizerDom,
    superBlock,
    contentTotalWidthPercent,
    nodeLeft,
    nodeRight,
    percentMap,
    childrenCopied,
  }
}

const currentProtyle = useCurrentProtyle()
const storeSuperBlockWidth = () => {
  if (!resizerInfo.value) {
    return
  }

  const superBlock = resizerInfo.value.superBlock
  const childNodes = Array.from(superBlock.children).filter((child: HTMLElement) => {
    delete child.dataset.en_width_percent
    return isSyNodeInSuperBlock(child)
  })
  const copiedNodes = resizerInfo.value.childrenCopied


  const protyleWysiwyg = superBlock.closest('.protyle-wysiwyg') as HTMLElement
  if (!protyleWysiwyg) {
    showMessage('叶归｜超级块宽度调整失败，未找到思源编辑器')
    return
  }
  // 点击一次思源编辑器，放置 currentProtyle 获取失败
  protyleWysiwyg.click()
  const protyleInstance = currentProtyle.value.getInstance()
  protyleInstance.updateBatchTransaction(copiedNodes, (node) => {
    const target = childNodes.find((child: HTMLElement) => child.dataset.nodeId === node.dataset.nodeId) as HTMLElement

    if (!target) {
      return
    }

    const newWidth = target.style.width
    if (newWidth) {
      node.style.width = newWidth
      node.style.flex = '1 0 auto'
    } else {
      node.style.removeProperty('width')
      node.style.removeProperty('flex')
    }
  })
  resizerInfo.value = null
}

const {
  bindEvent,
  unbindEvent,
} = useMousePostion({
  immediate: false,
  wait: 200,
  onMouseMoveStart(event) {
    getResizerInfoByEvent(event)

    if (!resizerInfo.value) {
      return
    }

    resizerInfo.value.resizer.parentElement.classList.add('resizing')
    resizerInfo.value.superBlock.classList.add('resizing')
    document.body.classList.add('enResizingSuperBlock')
  },
  onMouseMove(event) {
    if (!resizerInfo.value) {
      return
    }

    const newX = event.x
    const isLeft = newX < resizerInfo.value.startX
    const deltaX = Math.abs(newX - resizerInfo.value.startX)
    const superBlockRect = resizerInfo.value.superBlock.getBoundingClientRect()

    const deltaXPercent = (deltaX / superBlockRect.width) * 100

    let nodeLeftWidthPercent = resizerInfo.value.percentMap.get(resizerInfo.value.nodeLeft)
    let nodeRightWidthPercent = resizerInfo.value.percentMap.get(resizerInfo.value.nodeRight)
    const totalPercent = nodeLeftWidthPercent + nodeRightWidthPercent

    if (isLeft) {
      nodeLeftWidthPercent -= deltaXPercent
      nodeRightWidthPercent += deltaXPercent
    } else {
      nodeLeftWidthPercent += deltaXPercent
      nodeRightWidthPercent -= deltaXPercent
    }

    if (nodeLeftWidthPercent <= 5) {
      nodeLeftWidthPercent = 5
      nodeRightWidthPercent = totalPercent - 5
    }

    if (nodeRightWidthPercent <= 5) {
      nodeRightWidthPercent = 5
      nodeLeftWidthPercent = totalPercent - 5
    }

    updateDomWidthPercent(resizerInfo.value.nodeLeft, nodeLeftWidthPercent, resizerInfo.value.contentTotalWidthPercent)
    updateDomWidthPercent(resizerInfo.value.nodeRight, nodeRightWidthPercent, resizerInfo.value.contentTotalWidthPercent)
  },
  onMouseUp() {

    if (!resizerInfo.value) {
      return
    }

    resizerInfo.value.resizer.parentElement.classList.remove('resizing')
    resizerInfo.value.superBlock.classList.remove('resizing')
    document.body.classList.remove('enResizingSuperBlock')
    storeSuperBlockWidth()
    unbindEvent()
  },
})


const handleMouseDown = (event) => {
  // 检查是否点击的是加号按钮
  const target = event.target as HTMLElement
  const isAddButton = target.closest('.add-button')

  if (isAddButton) {
    return // 如果是加号按钮，不处理 resize 事件
  }

  event.stopImmediatePropagation()
  event.preventDefault()
  bindEvent()
}

// 均分宽度
const handleClick = onCountClick((count, event) => {
  // 检查是否点击的是加号按钮
  const target = event.target as HTMLElement
  const isAddButton = target.closest('.add-button')

  if (isAddButton) {
    return // 如果是加号按钮，不处理均分功能
  }

  unbindEvent()
  event.stopImmediatePropagation()
  event.preventDefault()

  getResizerInfoByEvent(event)
  if (!resizerInfo.value) {
    return
  }

  if (count == 2) {


    const nodeLeftWidthPercent = resizerInfo.value.percentMap.get(resizerInfo.value.nodeLeft)
    const nodeRightWidthPercent = resizerInfo.value.percentMap.get(resizerInfo.value.nodeRight)
    const totalPercent = nodeLeftWidthPercent + nodeRightWidthPercent
    const splitPercent = totalPercent / 2
    updateDomWidthPercent(resizerInfo.value.nodeLeft, splitPercent, resizerInfo.value.contentTotalWidthPercent)
    updateDomWidthPercent(resizerInfo.value.nodeRight, splitPercent, resizerInfo.value.contentTotalWidthPercent)
    storeSuperBlockWidth()
    return
  }

  if (count == 3) {
    const superBlock = resizerInfo.value.superBlock
    equalizeAllBlocks(superBlock)
  }
})

// 处理加号按钮点击
const handleAddButtonClick = (event: MouseEvent) => {
  event.stopPropagation()
  event.stopImmediatePropagation()
  event.preventDefault()

  const target = event.target as HTMLElement
  const addButtonContainer = target.closest('.add-button')

  if (!addButtonContainer) {
    return
  }

  const superBlock = addButtonContainer.closest('div[data-node-id][data-type="NodeSuperBlock"]') as HTMLElement

  // 区分三种情况
  if (addButtonContainer.classList.contains('start')) {
    // 情况1：点击的是开头的加号按钮
    handleStartButtonClick(superBlock)
  } else if (addButtonContainer.classList.contains('end')) {
    // 情况2：点击的是结尾的加号按钮
    handleEndButtonClick(superBlock)
  } else {
    // 情况3：点击的是中间区域的加号按钮（resizer 中的按钮）
    handleMiddleButtonClick(superBlock, addButtonContainer)
  }
}

// 处理开头按钮点击
const handleStartButtonClick = async (superBlock: HTMLElement) => {
  try {
    const superBlockId = superBlock.dataset.nodeId
    if (!superBlockId) {
      console.error('无法获取 superBlock 的 ID')
      return
    }

    // 调用 prependBlock API
    await prependBlock('markdown', '', superBlockId)

    // 插入成功后，均分所有块的宽度
    await equalizeAllBlocks(superBlock)
  } catch (error) {
    console.error('开头插入失败:', error)
  }
}

// 处理结尾按钮点击
const handleEndButtonClick = async (superBlock: HTMLElement) => {
  try {
    const superBlockId = superBlock.dataset.nodeId
    if (!superBlockId) {
      console.error('无法获取 superBlock 的 ID')
      return
    }

    // 调用 appendBlock API
    await appendBlock('markdown', '', superBlockId)

    // 插入成功后，均分所有块的宽度
    await equalizeAllBlocks(superBlock)
  } catch (error) {
    console.error('结尾插入失败:', error)
  }
}

// 处理中间按钮点击
const handleMiddleButtonClick = async (superBlock: HTMLElement, addButtonContainer: Element) => {

  const resizerContainer = addButtonContainer.closest('.enSuperBlockWidthResizerContainer')

  // 获取 resizer 两侧的节点信息
  const nodeLeft = resizerContainer.previousElementSibling as HTMLElement | null

  try {
    if (!nodeLeft) {
      console.error('无法获取左侧节点')
      return
    }

    const leftNodeId = nodeLeft.dataset.nodeId
    if (!leftNodeId) {
      console.error('无法获取左侧节点的 ID')
      return
    }

    // 调用 insertBlock API，previousID 为左侧元素的 id
    await insertBlock('markdown', '', undefined, leftNodeId)

    // 插入成功后，均分所有块的宽度
    await equalizeAllBlocks(superBlock)
  } catch (error) {
    console.error('中间插入失败:', error)
  }
}

// 均分所有块的宽度
const equalizeAllBlocks = async (superBlock: HTMLElement) => {
  try {
    // 等待一小段时间，确保 DOM 更新完成
    await new Promise((resolve) => setTimeout(resolve, 100))

    // 获取所有有 nodeId 的子节点
    const childNodes = Array.from(superBlock.children).filter((child: HTMLElement) => {
      return isSyNodeInSuperBlock(child)
    })

    // 移除所有子节点的 width 和 flex 样式，让它们均分宽度
    childNodes.forEach((child: HTMLElement) => {
      child.style.removeProperty('width')
      child.style.removeProperty('flex')
    })

    // 保存 superBlock 的宽度设置
    storeSuperBlockWidth()
  } catch (error) {
    console.error('均分宽度失败:', error)
  }
}

onMounted(() => {
  moduleEnableStatusSwitcher('en-super-block-width-resizer', true)
})
onBeforeUnmount(() => {
  moduleEnableStatusSwitcher('en-super-block-width-resizer', false)
})

</script>

<style lang="scss">
html {
  &[data-en_enabled_module~="en-super-block-width-resizer"] {


    // 移动端纵向排布超级块，取消所有宽度设置
    &[data-en_enabled_module~="isMobile"] {
      .protyle {
        [data-node-id].sb {
          & > div[data-node-id] {
            width: unset !important;
          }
        }
      }
    }


    // 桌面端 resizer 相关的样式
    &:not([data-en_enabled_module~="isMobile"]) {
      .protyle {
        [data-node-id].sb[data-sb-layout=col] {

          --en-sb-resizer-width: 1.5em;



          // 鼠标未移入超级块，用滑杆宽度作为列间距
          column-gap: var(--en-sb-resizer-width);

          // 鼠标移入超级块时，取消列间距
          &.en-super-block-width-resizer-hover {
            column-gap: 0;
          }



          .enSuperBlockWidthResizerContainer {
            flex: unset;
            height: auto;
            padding: unset;
            margin: unset;
            width: 0px;
            min-width: 0px;


            &:not(.first-or-last) {
              width: var(--en-sb-resizer-width);
            }
          }


          // 超级块正在调整宽度时，显示宽度百分比
          &.resizing {
            & > div[data-node-id] {
              &::before {
                content: attr(data-en_width_percent);
                position: absolute;
                font-size: 9px;
                top: 4px;
                right: 4px;
                color: var(--b3-theme-on-surface);
                background-color: var(--b3-theme-surface);
                padding: 4px;
                border-radius: var(--b3-border-radius);
              }
            }
          }
        }
      }

    }

    // 正在调整宽度
    body.enResizingSuperBlock {

      // 显示鼠标
      * {
        cursor: col-resize;
      }


      // 隐藏块标
      .protyle-gutters,
      .protyle-select,
      .protyle-toolbar,
      .protyle-hint {
        display: none;
      }
    }
  }
}
</style>

<style lang="scss" scoped>
.super-block-resizer-area {
  width: 100%;
  height: 100%;

  position: relative;


  --en-super-block-resizer-color: var(--b3-theme-primary);

  --en-super-block-add-btn-size: 20px;
  --en-sb-add-btn-offset: 4px;
  --en-sb-resizer-btn-gap: 8px;

  .add-button {
    position: absolute;
    left: 50%;
    top: calc(-1 * var(--en-super-block-add-btn-size) + var(--en-sb-add-btn-offset));
    transform: translateX(-50%);

    width: var(--en-super-block-add-btn-size);
    height: var(--en-super-block-add-btn-size);
    border-radius: 50%;
    background-color: var(--en-super-block-resizer-color);

    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: opacity 0.2s ease, transform 0.2s ease;

    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);

    &:hover {
      transform: translateX(-50%) scale(1.1);
    }
  }

  .resizer-area {
    position: relative;
    cursor: col-resize;

    width: 100%;
    height: calc(100% - var(--en-sb-add-btn-offset) - var(--en-sb-resizer-btn-gap));
    top: calc(var(--en-sb-resizer-btn-gap) + var(--en-sb-add-btn-offset));

    display: flex;
    justify-content: center;


    .resizer-indicator {
      width: 4px;
      border-radius: 3px;
      height: 100%;
      background-color: var(--en-super-block-resizer-color);
      opacity: 0.7;
    }
  }



  opacity: 0;
  &:hover {
    opacity: 1;
    .resizer-area,
    .add-button {
      opacity: 0.7;

      &:hover {
        opacity: 1;
      }
    }
  }
}
</style>
