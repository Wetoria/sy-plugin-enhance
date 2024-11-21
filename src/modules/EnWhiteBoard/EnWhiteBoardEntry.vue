<template>
  <div></div>
</template>

<script setup lang="ts">
import { usePlugin } from '@/main';
import { getClosetSiyuanNodeByDom } from '@/utils/Siyuan';
import { upDownHint } from '@/utils/Siyuan/utils';
import { Protyle } from 'siyuan';

const plugin = usePlugin()

const slashId = 'EnWhiteBoard'
const cbValue = `plugin\u200b${plugin.name}\u200b${slashId}`

function getWhiteBoardListBySearchValue(searchValue: string) {
  const testData = [
  ]

  for (let i = 1; i < 21; i++) {
    testData.push({
      value: cbValue,
      id: `whiteboard-${i}`,
      html: `
        <div
          class="b3-list-item__text en-whiteboard-selector-item"
          data-en-whiteboard-id="whiteboard-${i}"
          data-en-whiteboard-name="白板 ${i}"
        >
          白板 ${i}
        </div>
      `,
    })
  }

  return testData.filter(item => {
    const included = item.id.includes(searchValue)
    return included
  })
}

function markItem(hint: any, item: HTMLElement) {
  hint.element.querySelector('.b3-list-item--focus')?.classList.remove('b3-list-item--focus')
  item.classList.add('b3-list-item--focus')
  hint.enWhiteboardFinished = true
}

async function renderWhiteBoardListIntoProtyleHint(protyle: Protyle, searchValue: string = '') {
  const hint = protyle.protyle.hint

  const result = await getWhiteBoardListBySearchValue(searchValue)
  result.unshift({
    value: cbValue,
    id: 'new',
    html: `
      <div
        class="b3-list-item__text en-whiteboard-selector-item"
        data-en-whiteboard-id="new"
        data-en-whiteboard-name="${searchValue}"
      >
        新增白板${searchValue ? ` ${searchValue}` : ''}
      </div>
    `,
  })
  hint.genHTML(result, protyle.protyle, true, "hint");

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
      return;
    }
    event.stopPropagation();
    renderWhiteBoardListIntoProtyleHint(protyle, currentValue)
    // this.genSearchHTML(protyle, searchElement, nodeElement, oldValue, source);
  })
  newHintInputDom.addEventListener("compositionend", (event: InputEvent) => {
    event.stopPropagation();
    const currentValue = (event.target as HTMLInputElement).value
    // this.genSearchHTML(protyle, searchElement, nodeElement, oldValue, source);
    renderWhiteBoardListIntoProtyleHint(protyle, currentValue)
  });

  newHintInputDom.addEventListener('keydown', (event) => {
    if (event.key !== "Meta" && event.key !== "Control") {
      // 需要冒泡以满足光标在块标位置时 ctrl 弹出悬浮层
      event.stopPropagation();
    }
    if (event.isComposing) {
      return;
    }
    upDownHint(hint.element.lastElementChild, event);
    if (event.key === "Enter") {
      event.preventDefault();
      clearTimeout(hint.timeId);
      hint.element.classList.add("fn__none");
      createOrInsertWhiteBoard(protyle)
    }
  })

  newHintInputWrapperDom.appendChild(newHintInputDom)

  hint.element.firstElementChild?.insertAdjacentElement('afterbegin', newHintInputWrapperDom)
  hint.element.firstElementChild?.addEventListener('click', (event) => {
    if (event.target?.classList.contains('b3-list-item')) {
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
}

function createOrInsertWhiteBoard(protyle: Protyle) {
  const hint = protyle.protyle.hint

  const selectedWhiteBoard = hint.element.querySelector('.b3-list-item--focus')
  const whiteBoardItem = selectedWhiteBoard?.querySelector('.en-whiteboard-selector-item')
  const whiteBoardId = whiteBoardItem?.dataset.enWhiteboardId

  const range = protyle.protyle.toolbar.range as Range
  const siyuanNode = getClosetSiyuanNodeByDom(range.startContainer as HTMLElement)
  const nodeId = siyuanNode?.dataset.nodeId
  console.log('siyuanNode is ', siyuanNode, nodeId, whiteBoardItem, whiteBoardId)
  hint.enCreatingOrSelectingWhiteBoard = false
  hint.enWhiteboardFinished = true
}

plugin.protyleSlash.push({
  filter: [
    'en whiteboard',
    'whiteboard',
    'enwhiteboard',
    '白板',
  ],
  html: `<div class="b3-list-item__first"><span class="b3-list-item__text">EN｜白板</span></div>`,
  id: slashId,
  callback(protyle: Protyle) {
    const hint = protyle.protyle.hint
    console.log('hint flag is ', hint.enWhiteboardFinished, hint.enCreatingOrSelectingWhiteBoard)

    if (!hint.enCreatingOrSelectingWhiteBoard) {
      hint.enCreatingOrSelectingWhiteBoard = true
      hint.enWhiteboardFinished = false
      renderWhiteBoardListIntoProtyleHint(protyle)
    } else {
      // 如果以外中断（点击隐藏了），则重新渲染
      if (!hint.enWhiteboardFinished) {
        renderWhiteBoardListIntoProtyleHint(protyle)
      } else {
        createOrInsertWhiteBoard(protyle)
      }
    }
  }
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
