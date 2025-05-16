<template>
  <Teleport
    v-for="resizer in resizerListRef"
    :key="resizer.dataset.en_loop_key"
    :to="resizer"
  >
    <div class="content">
      <div
        class="resizer"
        @mousedown="handleMouseDown"
        @click="handleClick"
      ></div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { useProtyleList } from '@/global/ProtyleList'
import { usePlugin } from '@/main'
import { generateUUIDWithTimestamp } from '@/utils'
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
  watch,
} from 'vue'


const superBlockListRef = ref<HTMLDivElement[]>([])
const resizerListRef = ref<HTMLDivElement[]>([])

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


watch(superBlockListRef, () => {
  appendResizer()
})

const protyleList = useProtyleList()
const handler = debounce(() => {
  const targetParagraphList = queryAllByDom(
    document.body,
    `.protyle div[data-type="${SyDomNodeTypes.NodeSuperBlock}"][data-sb-layout="col"]`,
  ) as HTMLDivElement[]

  const currentSet = new Set(superBlockListRef.value)

  if (
    currentSet.size === targetParagraphList.length
    && targetParagraphList.every((dom) => currentSet.has(dom))
  ) {
    return
  }

  const list = protyleList.value.filter(
    (item) => item.isEditorProtyle || item.isFlashCardProtyle || item.isInDialog,
  )
  superBlockListRef.value = targetParagraphList.filter((superBlock) => {
    const protyleOfSuperBlock = superBlock.closest('.protyle')
    return list.find((item) => item.protyleEl === protyleOfSuperBlock)
  })
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
  event.stopImmediatePropagation()
  event.preventDefault()
  bindEvent()
}

// 均分宽度
const handleClick = onCountClick((count, event) => {
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

</script>

<style lang="scss">
html {
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
        column-gap: unset;

        .enSuperBlockWidthResizerContainer {
          flex: unset;
          width: 8px;

          padding-left: 2px;
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
</style>

<style lang="scss" scoped>
.content {
  width: 100%;
  height: 100%;

  display: flex;
  align-items: center;
  justify-content: center;

  position: relative;

  .resizer {
    width: 3px;
    height: 100%;
    background-color: var(--b3-theme-primary);
    cursor: col-resize;
    opacity: 0;
  }

  &:hover,
  &.resizing {
    .resizer {
      opacity: 1;
    }
  }
}
</style>
