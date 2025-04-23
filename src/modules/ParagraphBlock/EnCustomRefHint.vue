<template>
  <Teleport
    v-if="currentHintData?.preElement"
    :to="currentHintData?.preElement"
  >
    <div class="flexColumn" style="max-width: 100%;">
      <slot></slot>
      <div>
        当前关键字：{{ currentHintData.value }}
      </div>
      <div>
        <a-button
          status="warning"
          @click="clearText"
        >
          清除文本
        </a-button>
      </div>
      <div class="flexRow">
        已选择的引用：
        <div v-for="item in selectedItemValue" :key="item.id">
          {{ item.value }}
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { usePlugin } from '@/main'
import { onCountClick, useRegisterStyle } from '@/utils/DOM'
import { useSiyuanEventLoadedProtyleStatic } from '@/utils/EventBusHooks'

import {
  IHintData,
  IProtyle,
} from 'siyuan'
import { ref, watchEffect } from 'vue'

const plugin = usePlugin()

const hintItems = [
  {
    id: 'testHint',
    value: `plugin\u200B${plugin.name}\u200BValue1`,
    html: `
      <div
        class="b3-list-item__first en-custom-ref-hint-item"
        data-en_ref_id="${'1'}"
        data-en_ref_value="${'Tag1'}"
      >
        Tag1
      </div>
    `,
  },
  {
    id: 'testHint',
    value: `plugin\u200B${plugin.name}\u200BValue2`,
    html: `
      <div
        class="b3-list-item__first en-custom-ref-hint-item"
        data-en_ref_id="${'2'}"
        data-en_ref_value="${'Tag2'}"
      >
        Tag2
      </div>
    `,
  },
  {
    id: 'testHint',
    value: `plugin\u200B${plugin.name}\u200BValue3`,
    html: `
      <div
        class="b3-list-item__first en-custom-ref-hint-item"
        data-en_ref_id="${'3'}"
        data-en_ref_value="${'Tag3'}"
      >
        Tag3
      </div>
    `,
  },
  {
    id: 'testHint',
    value: `plugin\u200B${plugin.name}\u200BValue4`,
    html: `
      <div
        class="b3-list-item__first en-custom-ref-hint-item"
        data-en_ref_id="${'4'}"
        data-en_ref_value="${'Tag4'}"
      >
        Tag4
      </div>
    `,
  },
  {
    id: 'testHint',
    value: `plugin\u200B${plugin.name}\u200BValue5`,
    html: `
      <div
        class="b3-list-item__first en-custom-ref-hint-item"
        data-en_ref_id="${'5'}"
        data-en_ref_value="${'Tag5'}"
      >
        Tag5
      </div>
    `,
  },
  {
    id: 'testHint',
    value: `plugin\u200B${plugin.name}\u200BValue6`,
    html: `
      <div
        class="b3-list-item__first en-custom-ref-hint-item"
        data-en_ref_id="${'6'}"
        data-en_ref_value="${'Tag6'}"
      >
        Tag6
      </div>
    `,
  },
]

const triggerChar = '@'
const subBlockSplitChar = `|`
const textSplitChar = `=`
const currentHintData = ref<{
  value: string
  protyle: IProtyle
  containerDom?: HTMLElement
  preElement?: HTMLDivElement
}>()

const selectedItemValue = ref<Array<{
  id: string
  value: string
}>>([])

const styleDomRef = useRegisterStyle('en-custom-ref-hint-style')
watchEffect(() => {
  const styles = selectedItemValue.value.map((item) => {
    return `
      [data-en_ref_id="${item.id}"] {
        background-color: var(--b3-theme-primary-light);
        border-radius: var(--b3-border-radius);
      }
    `
  })
  styleDomRef.value.textContent = `
    .en-hint-container {
      ${styles.join('\n')}
    }
  `
})

const updateRangeAndClearSearch = () => {
  const protyle = currentHintData.value?.protyle
  if (!protyle) {
    return
  }
  const range = protyle.toolbar.range

  let textNode = range.endContainer
  let triggerCharIndex = range.endOffset
  while (textNode) {
    const index = textNode.textContent.lastIndexOf(triggerChar)
    if (index != -1) {
      triggerCharIndex = index
      break
    }
    textNode = textNode.previousSibling
  }
  if (triggerCharIndex !== range.endOffset && triggerCharIndex !== -1) {
    range.setStart(textNode, triggerCharIndex)
  }
  range.deleteContents()
}

const insertIntoBlock = (protyle: IProtyle, value: string) => {
  if (!protyle) {
    return
  }
  protyle.getInstance().insert(value, false, false)
}


// 根据选中的元素，获取引用数据
const getRefItemValueBySelectedItem = (selectedItem: HTMLElement) => {
  const itemDom = selectedItem.querySelector('.en-custom-ref-hint-item') as HTMLElement
  if (!itemDom) {
    return null
  }

  return {
    id: itemDom.dataset.en_ref_id,
    value: itemDom.dataset.en_ref_value,
  }
}


// 获取 hint 面板中，选中的元素
const getSelectedItem = (hintElement: HTMLElement) => {
  const targetItem = hintElement?.querySelector('.b3-list-item--focus')
  if (!targetItem) {
    return null
  }
  return targetItem
}


const getRefItemValueByHintElement = (hintElement: HTMLElement) => {
  const targetItem = getSelectedItem(hintElement) as HTMLElement
  if (!targetItem) {
    return null
  }
  return getRefItemValueBySelectedItem(targetItem)
}


// 根据选择的内容，创建引用关系
function setWithItem(hintElement: HTMLElement) {
  const {
    value,
    protyle,
  } = currentHintData.value

  let readyToWirteValue = ''

  if (!selectedItemValue.value.length) {
    const targetItem = getRefItemValueByHintElement(hintElement)
    if (!targetItem) {
      clear()
      return
    }
    readyToWirteValue = targetItem.value
  } else {
    readyToWirteValue = selectedItemValue.value.map((item) => item.value).join(' ')
  }

  protyle.toolbar.range.deleteContents()
  clear()
  setTimeout(() => {
    insertIntoBlock(protyle, readyToWirteValue)
  }, 100)
}


// 多选要引用的内容
function selectItem(filterExist = true) {
  const targetItem = getSelectedItem(currentHintData.value.protyle.hint.element) as HTMLElement
  if (!targetItem) {
    return
  }
  const refItemValue = getRefItemValueBySelectedItem(targetItem)
  if (!refItemValue) {
    return
  }

  const isExist = selectedItemValue.value.find((item) => item.id === refItemValue.id && item.value === refItemValue.value)
  if (isExist) {
    if (filterExist) {
      selectedItemValue.value = selectedItemValue.value.filter((item) => item.id !== refItemValue.id && item.value !== refItemValue.value)
    }
    return
  }
  selectedItemValue.value.push(refItemValue)

}



// 标记当前 focus 的元素
function markItem(hint: any, item: HTMLElement) {
  hint.element.querySelector('.b3-list-item--focus')?.classList.remove('b3-list-item--focus')
  item.classList.add('b3-list-item--focus')
}



const onDocumentClick = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  const hintTarget = target.closest('.protyle-hint')
  if (!hintTarget || !hintTarget.contains(currentHintData.value.containerDom)) {
    clear()
  }
}


// #region 👇 监听键盘事件


const onKeyDown = (event: KeyboardEvent) => {
  const {
    value,
    protyle,
  } = currentHintData.value


  if (['ArrowLeft', 'ArrowRight'].includes(event.key)) {
    event.stopPropagation()
    event.preventDefault()
    return
  }
  if (['ArrowUp', 'ArrowDown'].includes(event.key)) {
    if (event.shiftKey || event.ctrlKey || event.metaKey || event.altKey) {
      event.stopPropagation()
      event.preventDefault()
      return
    }
  }



  if (event.key === 'Tab') {
    event.stopPropagation()
    event.preventDefault()

    // INFO 添加查询子块的分隔符
    const isEndWith = value.endsWith(subBlockSplitChar)
    if (!isEndWith) {
      // INFO 如果未插入 subBlockSplitChar
      // 则插入 subBlockSplitChar
      insertIntoBlock(protyle, subBlockSplitChar)
    } else {
      // INFO 如果是 subBlockSplitChar 结尾
      // 证明输入后未进行搜索。再次使用 Tab 键，则清掉所有搜索内容，重新添加 trigger
      clearText()
    }
    return
  }



  if (event.key === 'Enter') {

    // INFO shift + 回车，多选引用
    if (event.shiftKey) {
      event.preventDefault()
      event.stopPropagation()
      event.stopImmediatePropagation()

      selectItem()
      return
    }

    // INFO 回车选中并插入引用
    selectItem(false)
    setWithItem(currentHintData.value.protyle.hint.element)
  }

  if (event.key === 'Escape') {
    clear()
  }
}

// #endregion 👆 监听键盘事件



const clear = () => {
  document.removeEventListener('click', onDocumentClick, true)
  document.removeEventListener('keydown', onKeyDown, true)
  currentHintData.value.protyle = null
  currentHintData.value.containerDom = null
  currentHintData.value.preElement = null
  currentHintData.value = null
}


// 清掉所有搜索内容，重新添加 trigger
// 方便维护第二条引用
const clearText = () => {
  const protyle = currentHintData.value?.protyle
  if (!protyle) {
    return
  }
  updateRangeAndClearSearch()
  insertIntoBlock(protyle, triggerChar)
}


// #region 👇 点击 hint 面板

const onClickHintPanel = onCountClick((count, event) => {

  const protyleHint = currentHintData.value?.protyle?.hint

  if (!protyleHint) {
    return
  }

  if ((event.target as HTMLElement)?.classList.contains('b3-list-item')) {
    markItem(protyleHint, event.target as HTMLElement)
    return
  }
  let target = event.target as HTMLElement
  while (target && !target.classList.contains('b3-list-item')) {
    target = target.parentElement as HTMLElement
  }
  const isTarget = target?.classList.contains('b3-list-item')
  if (!isTarget) {
    return
  }
  markItem(protyleHint, target)

  currentHintData.value?.protyle?.getInstance().focus()

  // 单击选择引用
  if (count === 1) {

    if (!event.shiftKey) {
      // INFO 单击，选中并插入引用

      updateRangeAndClearSearch()

      selectItem(false)
      setWithItem(protyleHint.element)
    } else {

      // INFO shift + 单击，多选引用
      selectItem()
    }
    return
  }

  // 双击多选
  if (count === 2) {
    // INFO 双击，多选引用
    selectItem()
    return
  }
}, {
  preventDefault: true,
  stopPropagation: true,
  stopImmediatePropagation: true,
})

// #endregion 👆 点击 hint 面板


const renderWaitingListWithData = (hintItems: IHintData[]) => {
  const protyle = currentHintData.value?.protyle
  if (!protyle) {
    return
  }
  const protyleHint = protyle.hint
  if (!protyleHint) {
    return
  }
  protyleHint.genHTML(hintItems, protyle, false, 'hint')

  const containerDom = protyleHint.element.firstElementChild as HTMLElement
  containerDom.classList.add('en-hint-container')
  currentHintData.value.containerDom?.removeEventListener('click', onClickHintPanel)

  const preDom = document.createElement('div')
  preDom.classList.add('en-custom-hint-pre')
  containerDom.insertAdjacentElement('afterbegin', preDom)

  currentHintData.value.preElement = preDom
  currentHintData.value.containerDom = containerDom
  containerDom.addEventListener('click', onClickHintPanel)

  // TODO 查询并渲染目标引用列表
  // 过滤最近使用的
  // 根据输入的关键字，用sql查询

  protyleHint.element.classList.remove('fn__none')
}


// #region 👇 注册自定义 hint trigger

useSiyuanEventLoadedProtyleStatic(({ detail }) => {
  const hintOptions = detail.protyle?.options?.hint
  if (hintOptions) {
    hintOptions.extend.unshift({
      key: triggerChar,
      hint(value: string, protyle: IProtyle) {
        const isFirst = !currentHintData.value

        if (isFirst) {
          document.addEventListener('click', onDocumentClick, true)
          document.addEventListener('keydown', onKeyDown, true)
          currentHintData.value = {
            value,
            protyle,
          }

          selectedItemValue.value = []
        }
        currentHintData.value.value = value
        currentHintData.value.protyle = protyle


        // TODO 根据search渲染的逻辑
        setTimeout(() => {
          renderWaitingListWithData(hintItems)
        }, 0)

        return []
      },
    })

    detail.protyle.wysiwyg.element.addEventListener('input', (event) => {
      if ([triggerChar].includes(event.data)) {
        detail.protyle.hint.enableExtend = true
      }
    }, true)
  }
})

// #endregion 👆 注册自定义 hint trigger
</script>

<style lang="scss">
.en-custom-hint-pre {
  padding: 0 4px;
  margin: 1px 8px;
}

.en-hint-container {
  .b3-list-item {
    padding: unset;

    [data-en_ref_id] {
      padding: 0 4px;
    }
  }
}
</style>

<style lang="scss" scoped>

</style>
