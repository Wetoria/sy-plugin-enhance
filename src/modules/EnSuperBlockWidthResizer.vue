<template>
  <Teleport
    v-for="resizer in resizerListRef"
    :key="resizer.dataset.en_loop_key"
    :to="resizer"
  >
    <div
      v-if="resizer.classList.contains('enSuperBlockWidthResizerContainer')"
      class="content"
      @mousedown="handleMouseDown"
      @click="handleClick"
    >
      <div
        class="add-button"
        title="添加内容"
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
        class="resizer"
      ></div>
    </div>

    <div
      v-else-if="resizer.classList.contains('enSuperBlockAddButtonContainer')"
      class="add-button-only"
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
// 记录上一次的 superBlock 元素，用于比较变化
const previousSuperBlockList = ref<HTMLDivElement[]>([])

const appendResizer = () => {
  resizerListRef.value = []
  superBlockListRef.value.forEach((dom) => {
    const childList = dom.children
    if (!childList.length) {
      return
    }

    const needAppendDom = []
    for (let i = 1; i < childList.length; i++) {
      const child = childList[i] as HTMLElement
      const isSyNode = child.dataset.nodeId

      if (!isSyNode) {
        continue
      }

      needAppendDom.push(child)
    }

    needAppendDom.forEach((child: HTMLElement) => {
      // if (child.dataset.en_has_resizer) {
      //   return
      // }
      const resizer = document.createElement('div')
      resizer.className = 'enSuperBlockWidthResizerContainer protyle-custom'
      resizer.dataset.en_loop_key = generateUUIDWithTimestamp()
      dom.insertBefore(resizer, child)
      resizerListRef.value.push(resizer)
      // child.dataset.en_has_resizer = 'true'
    })
  })
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
  for (let i = 1; i < childList.length; i++) {
    const child = childList[i] as HTMLElement
    const isSyNode = child.dataset.nodeId

    if (!isSyNode) {
      continue
    }

    needAppendDom.push(child)
  }

  needAppendDom.forEach((child: HTMLElement) => {
    const resizer = document.createElement('div')
    resizer.className = 'enSuperBlockWidthResizerContainer protyle-custom'
    resizer.dataset.nodeId = `en-super-block-width-resizer-${generateShortUUID()}`
    resizer.dataset.en_loop_key = generateUUIDWithTimestamp()
    superBlock.insertBefore(resizer, child)
    resizerListRef.value.push(resizer)
  })
  superBlock.classList.add('en-super-block-width-resizer-hover')
}

// 从指定的 superBlock 移除 resizer
const removeResizerFromSuperBlock = (superBlock: HTMLDivElement) => {
  const resizers = superBlock.querySelectorAll('.enSuperBlockWidthResizerContainer')
  resizers.forEach((resizer) => {
    resizer.remove()
    // 从 resizerListRef 中移除
    const index = resizerListRef.value.findIndex((r) => r === resizer)
    if (index > -1) {
      resizerListRef.value.splice(index, 1)
    }
  })
  superBlock.classList.remove('en-super-block-width-resizer-hover')
}

// 为指定的 superBlock 插入开头和结尾的加号按钮
const insertAddButtonsToSuperBlock = (superBlock: HTMLDivElement) => {
  // 检查是否已经有加号按钮
  if (superBlock.querySelector('.enSuperBlockAddButtonContainer')) {
    return
  }

  // 创建开头的加号按钮
  const startAddButton = document.createElement('div')
  startAddButton.className = 'enSuperBlockAddButtonContainer enSuperBlockAddButtonStart protyle-custom'
  startAddButton.dataset.en_loop_key = generateUUIDWithTimestamp()
  startAddButton.dataset.position = 'start'

  // 直接添加到 superBlock 中，使用绝对定位
  superBlock.appendChild(startAddButton)
  resizerListRef.value.push(startAddButton)

  // 创建结尾的加号按钮
  const endAddButton = document.createElement('div')
  endAddButton.className = 'enSuperBlockAddButtonContainer enSuperBlockAddButtonEnd protyle-custom'
  endAddButton.dataset.en_loop_key = generateUUIDWithTimestamp()
  endAddButton.dataset.position = 'end'

  // 直接添加到 superBlock 中，使用绝对定位
  superBlock.appendChild(endAddButton)
  resizerListRef.value.push(endAddButton)
}

// 从指定的 superBlock 移除加号按钮
const removeAddButtonsFromSuperBlock = (superBlock: HTMLDivElement) => {
  const addButtons = superBlock.querySelectorAll('.enSuperBlockAddButtonContainer')
  addButtons.forEach((button) => {
    button.remove()
    // 从 resizerListRef 中移除
    const index = resizerListRef.value.findIndex((r) => r === button)
    if (index > -1) {
      resizerListRef.value.splice(index, 1)
    }
  })
}

// 获取最接近的 superBlock 元素
const getClosestSuperBlock = (element: HTMLElement): HTMLDivElement | null => {
  const superBlock = element.closest('div[data-type="NodeSuperBlock"][data-sb-layout="col"]') as HTMLDivElement
  return superBlock
}

// 处理鼠标移入事件
const handleMouseEnter = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  const superBlock = getClosestSuperBlock(target)

  if (superBlock && superBlockListRef.value.includes(superBlock)) {
    insertResizerToSuperBlock(superBlock)
    insertAddButtonsToSuperBlock(superBlock)
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
        removeAddButtonsFromSuperBlock(superBlock)
      }
    }, 100)
  }
}


// watch(superBlockListRef, () => {
//   appendResizer()
// })

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
    if (previousSuperBlockList.value.length !== validSuperBlocks.length) {
      return true
    }

    // 比较每个元素是否相同
    for (let i = 0; i < validSuperBlocks.length; i++) {
      if (previousSuperBlockList.value[i] !== validSuperBlocks[i]) {
        return true
      }
    }

    return false
  }

  // 如果元素有变化，需要重新绑定事件
  if (hasElementChanged()) {

    // 清理所有现有的事件监听器
    superBlockListRef.value.forEach((superBlock) => {
      superBlock.removeEventListener('mouseenter', handleMouseEnter)
      superBlock.removeEventListener('mouseleave', handleMouseLeave)
      removeResizerFromSuperBlock(superBlock)
      removeAddButtonsFromSuperBlock(superBlock)
    })

    // 为所有新的 superBlock 绑定事件
    validSuperBlocks.forEach((superBlock) => {
      superBlock.addEventListener('mouseenter', handleMouseEnter)
      superBlock.addEventListener('mouseleave', handleMouseLeave)
      // 移除旧的标记，重新设置
      delete superBlock.dataset.en_mouse_bound
      superBlock.dataset.en_mouse_bound = 'true'
    })

    // 更新记录
    superBlockListRef.value = [...validSuperBlocks]
    previousSuperBlockList.value = [...validSuperBlocks]
  } else {
    // 元素没有变化，只处理新增和移除的情况
    const removedSuperBlocks = superBlockListRef.value.filter(
      (block) => !validSuperBlocks.includes(block),
    )
    removedSuperBlocks.forEach((superBlock) => {
      superBlock.removeEventListener('mouseenter', handleMouseEnter)
      superBlock.removeEventListener('mouseleave', handleMouseLeave)
      removeResizerFromSuperBlock(superBlock)
    })

    // 为新找到的 superBlock 绑定事件
    validSuperBlocks.forEach((superBlock) => {
      if (!superBlock.dataset.en_mouse_bound) {
        superBlock.addEventListener('mouseenter', handleMouseEnter)
        superBlock.addEventListener('mouseleave', handleMouseLeave)
        superBlock.dataset.en_mouse_bound = 'true'
      }
    })

    superBlockListRef.value = validSuperBlocks
  }
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
  nodeLeft: HTMLElement
  nodeRight: HTMLElement
  percentMap: Map<HTMLElement, number>
  childrenCopied: HTMLElement[]
}>(null)

const recordDomWidthPercent = (map: Map<HTMLElement, number>, dom: HTMLElement, percent: number) => {
  const handledPercent = Math.floor(percent)
  dom.dataset.en_width_percent = `${handledPercent}%`
  map.set(dom, handledPercent)
}

const updateDomWidthPercent = (dom: HTMLElement, percent: number) => {
  const handledPercent = Math.floor(percent)
  dom.style.flex = `0 0 auto`
  dom.style.width = `${handledPercent}%`
  dom.dataset.en_width_percent = `${handledPercent}%`
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
    return child.dataset.nodeId
  })
  const childrenCopied = childNodes.map((child) => child.cloneNode(true) as HTMLElement)

  const superBlockRect = superBlock.getBoundingClientRect()
  const totalResizerWidth = 8 * (childNodes.length - 1)
  const totalContentWidth = superBlockRect.width - totalResizerWidth
  // const totalContentWidth = superBlockRect.width
  let resetUnsetContentPercent = 100 - ((totalResizerWidth / superBlockRect.width) * 100)

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
      recordDomWidthPercent(percentMap, child, childPercent)
      return
    }

    const widthPx = Number(currentWidth.replace('px', ''))
    const childPercent = (widthPx / totalContentWidth) * 100
    resetUnsetContentPercent -= childPercent
    recordDomWidthPercent(percentMap, child, childPercent)
  })

  const unsetContentSplitedPercent = resetUnsetContentPercent / unsetWidthChildren.length
  unsetWidthChildren.forEach((child) => {
    recordDomWidthPercent(percentMap, child, unsetContentSplitedPercent)
    updateDomWidthPercent(child, unsetContentSplitedPercent)
  })

  resizerInfo.value = {
    startX: event.x,
    resizer: resizerDom,
    superBlock,
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
    return child.dataset.nodeId
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
      node.style.flex = '0 0 auto'
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

    updateDomWidthPercent(resizerInfo.value.nodeLeft, nodeLeftWidthPercent)
    updateDomWidthPercent(resizerInfo.value.nodeRight, nodeRightWidthPercent)
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
  const isAddButton = target.closest('.add-button') || target.closest('.add-button-only')

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
  const isAddButton = target.closest('.add-button') || target.closest('.add-button-only')

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
    updateDomWidthPercent(resizerInfo.value.nodeLeft, splitPercent)
    updateDomWidthPercent(resizerInfo.value.nodeRight, splitPercent)
    storeSuperBlockWidth()
    return
  }

  if (count == 3) {
    const superBlock = resizerInfo.value.superBlock
    const childNodes = Array.from(superBlock.children).filter((child: HTMLElement) => {
      return child.dataset.nodeId
    })
    childNodes.forEach((child: HTMLElement) => {
      child.style.removeProperty('width')
      child.style.removeProperty('flex')
    })
    storeSuperBlockWidth()
  }
})

// 处理加号按钮点击
const handleAddButtonClick = (event: MouseEvent) => {
  event.stopPropagation()
  event.stopImmediatePropagation()
  event.preventDefault()

  const target = event.target as HTMLElement
  const addButtonContainer = target.closest('.enSuperBlockWidthResizerContainer') || target.closest('.enSuperBlockAddButtonContainer')

  if (!addButtonContainer) {
    return
  }

  const superBlock = addButtonContainer.closest('div[data-node-id][data-type="NodeSuperBlock"]') as HTMLElement

  // 区分三种情况
  if (addButtonContainer.classList.contains('enSuperBlockAddButtonStart')) {
    // 情况1：点击的是开头的加号按钮
    handleStartButtonClick(superBlock)
  } else if (addButtonContainer.classList.contains('enSuperBlockAddButtonEnd')) {
    // 情况2：点击的是结尾的加号按钮
    handleEndButtonClick(superBlock)
  } else if (addButtonContainer.classList.contains('enSuperBlockWidthResizerContainer')) {
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
const handleMiddleButtonClick = async (superBlock: HTMLElement, resizerContainer: Element) => {
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
      return child.dataset.nodeId
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

    &[data-en_enabled_module~="isMobile"] {
      .protyle {
        [data-node-id].sb {
          & > div[data-node-id] {
            width: unset !important;
          }
        }
      }
    }

    &:not([data-en_enabled_module~="isMobile"]) {
      .protyle {
        [data-node-id].sb[data-sb-layout=col] {
          position: relative;

          --en-sb-resizer-width: 8px;
          --en-sb-add-btn-size: 20px;
          --en-sb-add-btn-gap: 20px;
          column-gap: var(--en-sb-resizer-width);

          &.en-super-block-width-resizer-hover {
            column-gap: 0;

            .enSuperBlockAddButtonContainer {
              opacity: 0.7;
            }
          }

          .enSuperBlockWidthResizerContainer {
            flex: unset;
            width: var(--en-sb-resizer-width);

            padding-left: 2px;
          }

          .enSuperBlockAddButtonContainer {
            position: absolute;
            width: var(--en-sb-add-btn-size);
            height: var(--en-sb-add-btn-size);
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            opacity: 0.7;
            transition: opacity 0.2s ease;
            border-radius: 50%;
            background-color: var(--b3-theme-primary);
            color: white;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
            z-index: 10;

            &:hover {
              opacity: 1;
            }

            svg {
              width: 14px;
              height: 14px;
            }

            &.enSuperBlockAddButtonStart {
              top: calc(-0.5 * var(--en-sb-add-btn-size));
              left: -10px;
            }

            &.enSuperBlockAddButtonEnd {
              top: calc(-0.5 * var(--en-sb-add-btn-size));
              right: -10px;
            }
          }

          &.resizing {
            & > div[data-node-id] {
              &::before {
                content: attr(data-en_width_percent);
                position: absolute;
                font-size: 9px;
                top: 0;
                right: 0;
                color: var(--b3-theme-on-surface);
                background-color: var(--b3-theme-surface);
                padding: 4px;
                border-radius: var(--b3-border-radius);
              }
            }
          }
        }
      }

      body.enResizingSuperBlock {
        * {
          cursor: col-resize;
        }

        .protyle-gutters,
        .protyle-select,
        .protyle-toolbar,
        .protyle-hint {
          display: none;
        }
      }
    }
  }
}
</style>

<style lang="scss" scoped>
.content {
  width: 100%;
  height: 100%;

  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 6px;

  position: relative;
  cursor: col-resize;

  z-index: 10;

  .resizer {
    width: 5px;
    border-radius: 3px;
    height: calc(100% - (var(--en-sb-add-btn-size) + var(--en-sb-add-btn-gap)));
    margin-top: calc(var(--en-sb-add-btn-size) + var(--en-sb-add-btn-gap));
    background-color: var(--b3-theme-primary);
    opacity: 0.7;
  }

  .add-button {
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    width: var(--en-sb-add-btn-size);
    height: var(--en-sb-add-btn-size);
    border-radius: 50%;
    background-color: var(--b3-theme-primary);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    opacity: 0.7;
    transition: opacity 0.2s ease, transform 0.2s ease;
    z-index: 10;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);

    &:hover {
      opacity: 1;
      transform: translateX(-50%) scale(1.1);
    }
  }

  &:hover,
  &.resizing {
    .resizer {
      opacity: 1;
    }
  }
}

.add-button-only {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0.7;
  transition: opacity 0.2s ease;
  border-radius: 50%;
  background-color: var(--b3-theme-primary);
  color: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);

  &:hover {
    opacity: 1;
  }

  svg {
    width: 14px;
    height: 14px;
  }
}
</style>
