<template>
  <div></div>
</template>

<script setup lang="ts">
import type { Protyle } from 'siyuan'
import { updateBlock } from '@/api'
import { usePlugin } from '@/main'
import {
  embedWhiteBoard,
  generateWhiteBoardId,
  getWhiteBoardListBySearchValue,
} from '@/modules/EnWhiteBoard/EnWhiteBoard'
import { highlightText } from '@/utils/DOM'
import { getClosetSiyuanNodeByDom } from '@/utils/Siyuan'
import {
  setPosition,
  upDownHint,
} from '@/utils/Siyuan/utils'
import {
  onBeforeUnmount,
  onMounted,
} from 'vue'

const plugin = usePlugin()

const slashId_WhiteBoard = 'EnWhiteBoard'
const cbValue = `plugin\u200B${plugin.name}\u200B${slashId_WhiteBoard}`

function markItem(hint: any, item: HTMLElement) {
  hint.element.querySelector('.b3-list-item--focus')?.classList.remove('b3-list-item--focus')
  item.classList.add('b3-list-item--focus')
  hint.enWhiteboardFinished = true
}

async function renderWhiteBoardListIntoProtyleHint(protyle: Protyle, searchValue: string = '') {
  const hint: any = protyle.protyle.hint

  const result = await getWhiteBoardListBySearchValue(searchValue)

  const hintItems = []
  hintItems.push({
    value: cbValue,
    id: 'new',
    html: `
      <div
        class="b3-list-item__text en-whiteboard-selector-item"
        data-en-whiteboard-id="new"
        data-en-whiteboard-name="${searchValue || '新白板'}"
      >
        新增白板${searchValue ? ` ${searchValue}` : ''}
      </div>
    `,
  })
  result.forEach((item) => {
    hintItems.push({
      value: cbValue,
      id: item.whiteBoardId,
      html: `
        <div
          class="b3-list-item__first en-whiteboard-selector-item"
          data-en-whiteboard-id="${item.whiteBoardId}"
          data-en-whiteboard-name="${item.whiteBoardName}"
        >
          <span class="b3-list-item__text">
            ${highlightText(item.whiteBoardName, searchValue)}
          </span>
        </div>
        <div class="b3-list-item__meta b3-list-item__showall">
          ${highlightText(item.whiteBoardId, searchValue)}
        </div>
      `,
    })
  })
  hint.genHTML(hintItems, protyle.protyle, true, 'hint')

  const newHintInputWrapperDom = document.createElement('div') as HTMLDivElement
  newHintInputWrapperDom.classList.add('en-whiteboard-hint-input-wrapper')

  const newHintInputDom = document.createElement('input') as HTMLInputElement
  newHintInputDom.classList.add('en-whiteboard-hint-input')
  newHintInputDom.classList.add('b3-text-field')
  newHintInputDom.classList.add('fn__flex-center')
  newHintInputDom.placeholder = '输入白板名称'
  newHintInputDom.style.width = '100%'
  newHintInputDom.value = searchValue

  newHintInputDom.addEventListener('input', (event: InputEvent) => {
    const currentValue = (event.target as HTMLInputElement).value
    if (event.isComposing) {
      return
    }
    event.stopPropagation()
    renderWhiteBoardListIntoProtyleHint(protyle, currentValue)
    // this.genSearchHTML(protyle, searchElement, nodeElement, oldValue, source);
  })
  newHintInputDom.addEventListener('compositionend', (event: InputEvent) => {
    event.stopPropagation()
    const currentValue = (event.target as HTMLInputElement).value
    // this.genSearchHTML(protyle, searchElement, nodeElement, oldValue, source);
    renderWhiteBoardListIntoProtyleHint(protyle, currentValue)
  })

  newHintInputDom.addEventListener('keydown', (event) => {
    if (event.key !== 'Meta' && event.key !== 'Control') {
      // 需要冒泡以满足光标在块标位置时 ctrl 弹出悬浮层
      event.stopPropagation()
    }
    if (event.isComposing) {
      return
    }
    upDownHint(hint.element.lastElementChild, event)
    if (event.key === 'Enter') {
      event.preventDefault()
      clearTimeout(hint.timeId)
      hint.element.classList.add('fn__none')
      createOrInsertWhiteBoard(protyle)
    }
    if (event.key === 'Escape') {
      event.preventDefault()
      clearTimeout(hint.timeId)
      hint.element.classList.add('fn__none')
    }
  })

  newHintInputWrapperDom.appendChild(newHintInputDom)

  hint.element.firstElementChild?.insertAdjacentElement('afterbegin', newHintInputWrapperDom)
  hint.element.firstElementChild?.addEventListener('click', (event) => {
    if ((event.target as HTMLElement)?.classList.contains('b3-list-item')) {
      markItem(hint, event.target as HTMLElement)
    } else {
      let target = event.target as HTMLElement
      while (target && !target.classList.contains('b3-list-item')) {
        target = target.parentElement as HTMLElement
      }
      const isTarget = target?.classList.contains('b3-list-item')
      if (isTarget) {
        markItem(hint, target)
      }
    }
  })
  newHintInputDom.focus()
  const siyuanNode = hint.siyuanNode
  const siyuanNodeRect = siyuanNode?.getBoundingClientRect()
  setPosition(hint.element, siyuanNodeRect?.left, siyuanNodeRect?.bottom)
}

function createOrInsertWhiteBoard(protyle: Protyle) {
  const hint: any = protyle.protyle.hint

  const selectedWhiteBoard = hint.element.querySelector('.b3-list-item--focus')
  const whiteBoardItem: HTMLElement = selectedWhiteBoard?.querySelector('.en-whiteboard-selector-item')
  let whiteBoardId = whiteBoardItem?.dataset.enWhiteboardId
  const whiteBoardName = whiteBoardItem?.dataset.enWhiteboardName

  const isCreateNew = whiteBoardId === 'new'
  if (isCreateNew) {
    whiteBoardId = generateWhiteBoardId()
  }

  const result = `Enhance 白板嵌入区域<br />选择的白板id：${whiteBoardId}<br/>选择的白板名称：${whiteBoardName ? ` ${whiteBoardName}` : '[后续应该自动生成白板的名称]'}<br/>用于渲染的的块id：${hint.enBlockId}`
  const testHtml =
`<div>
  <style>
    .en-whiteboard-placeholder {
      display: var(--en-whiteboard-placeholder-display);
    }
  </style>
  <div class="en-whiteboard-placeholder">
    ${result}
  </div>
</div>

{: custom-en-ref-whiteboard-id="${whiteBoardId}" alias="en-wb-${whiteBoardName}" }
`
  embedWhiteBoard({
    whiteBoardId,
    whiteBoardName,
    embedNodeId: hint.enBlockId,
    isNew: isCreateNew,
  })
  updateBlock('markdown', testHtml, hint.enBlockId)
  hint.enCreatingOrSelectingWhiteBoard = false
  hint.enWhiteboardFinished = true
  hint.enBlockId = ''
}

const switchPlaceholderDisplay = (enable: boolean) => {
  const key = '--en-whiteboard-placeholder-display'
  if (enable) {
    document.documentElement.style.setProperty(
      key,
      'none',
    )
  } else {
    document.documentElement.style.removeProperty(
      key,
    )
  }
}
onMounted(() => {
  plugin.protyleSlash.push({
    filter: [
      'en whiteboard',
      'whiteboard',
      'enwhiteboard',
      'enwb',
      'wb',
      'baiban',
      'enbaiban',
      'huaban',
      '画板',
      '白板',
    ],
    html: `<div class="b3-list-item__first"><span class="b3-list-item__text">EN｜白板</span></div>`,
    id: slashId_WhiteBoard,
    callback(protyle: Protyle) {
      const hint: any = protyle.protyle.hint

      if (!hint.enCreatingOrSelectingWhiteBoard) {
        hint.enCreatingOrSelectingWhiteBoard = true
        hint.enWhiteboardFinished = false
        const range = protyle.protyle.toolbar.range as Range
        const siyuanNode = getClosetSiyuanNodeByDom(range.startContainer as HTMLElement)
        const nodeId = siyuanNode?.dataset.nodeId

        hint.siyuanNode = siyuanNode
        hint.enBlockId = nodeId
        renderWhiteBoardListIntoProtyleHint(protyle)
      } else {
        // 如果以外中断（点击隐藏了），则重新渲染
        if (!hint.enWhiteboardFinished) {
          renderWhiteBoardListIntoProtyleHint(protyle)
        } else {
          createOrInsertWhiteBoard(protyle)
        }
      }
    },
  })
  switchPlaceholderDisplay(true)
})

onBeforeUnmount(() => {
  plugin.protyleSlash = plugin.protyleSlash.filter((item) => item.id !== slashId_WhiteBoard)
  switchPlaceholderDisplay(false)
})
</script>

<style lang="scss" scoped>

</style>

<style lang="scss">
.en-whiteboard-hint-input-wrapper {
  margin: 0px 8px;
  margin-bottom: 4px;
  border-radius: var(--b3-border-radius);
  line-height: 28px;
  min-height: 28px;
  color: var(--b3-theme-on-background);
  position: sticky;
  top: 0;
  z-index: 1;
  background: var(--b3-menu-background);
}
</style>
