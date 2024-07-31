<template>
  <div></div>
</template>

<script setup lang="ts">
import { usePlugin } from '@/main';
import { debounce, moduleEnableStatusSwitcher } from '@/utils';
import { IProtyle } from 'siyuan';
import { computed, onBeforeUnmount, onMounted, ref, watch, watchEffect } from 'vue';
import dayjs from 'dayjs'
import { log } from '@/utils/Log';

const INLINE_TYPE = [
  "block-ref",
  "kbd",
  "text",
  "file-annotation-ref",
  "a",
  "strong",
  "em",
  "u",
  "s",
  "mark",
  "sup",
  "sub",
  "tag",
  "code",
  "inline-math",
  "inline-memo",
  "clear",
]

const FONT_STYLE_INLINE_TYPE = [
  "text",
  "strong",
  "em",
  "u",
  "s",
  "mark",
  "sup",
  "sub",
]

const FONT_STYLE_KEYS = [
  'color',
  'fontSize',
  'backgroundColor',
  'webkitTextStroke',
  'webkitTextFillColor',
  'textShadow',
]

const SELECTION_KEYS = [
  'anchorNode',
  'anchorOffset',
  'baseNode',
  'baseOffset',
  'extentNode',
  'extentOffset',
  'focusNode',
  'focusOffset',
]

interface IStyle {
  style: object
  dataType: string[]
  selection: {
    anchorNode: HTMLElement
    anchorOffset: number
    baseNode: HTMLElement
    baseOffset: number
    extentNode: HTMLElement
    extentOffset: number
    focusNode: HTMLElement
    focusOffset: number
  }
}

const currentFontStyle = ref<IStyle>()
const cancelBrush = () => {
  currentFontStyle.value = null

  document.removeEventListener('keydown', escapeEvent)
  document.removeEventListener('mouseup', pasteStyleOnMouseUp)
  plugin.eventBus.off('click-editorcontent', recordCurrentProtyle)
}

const brushing = computed(() => !!currentFontStyle.value)

const escapeEvent = (event) => {
  if (event.code === 'Escape') {
    event.preventDefault()
    event.stopImmediatePropagation()
    cancelBrush()
  }
}

const pasteStyleOnMouseUp = (event) => {
  const selection = window.getSelection();

  if (selection.isCollapsed) {
    return
  }
  setTimeout(() => {
    pasteCurrentStyle()
  }, 30)
}

const switchEnableStatus = () => {
  moduleEnableStatusSwitcher('EnFormatBrush', brushing.value)
  if (brushing.value) {
    document.addEventListener('keydown', escapeEvent)

    document.addEventListener('mouseup', pasteStyleOnMouseUp)

    plugin.eventBus.on('click-editorcontent', recordCurrentProtyle)
  }
}

watch(brushing, () => {
  const btns = document.querySelectorAll('[data-type="EnFormatBrush"]')

  btns.forEach((eachBtn) => {
    const svg = eachBtn.querySelector('svg')
    eachBtn.setAttribute('aria-label', getAriaLabel())
    if (brushing.value) {
      // @ts-expect-error setAttribute
      svg.firstChild.setAttribute('xlink:href', '#EnIconFormatBrushActived')
    } else {
      // @ts-expect-error setAttribute
      svg.firstChild.setAttribute('xlink:href', '#EnIconFormatBrush')
    }
  })

  switchEnableStatus()
}, {
  immediate: true,
})

const convertStyleByRange = () => {
  const selection = window.getSelection();

  if (!selection.rangeCount) {
    return
  }
  // 获取选区的第一个范围
  const range = selection.getRangeAt(0);

  // 获取选区的开始容器
  const startContainer = range.startContainer;

  // 获取包含选区开始的元素
  const element = (startContainer.nodeType === Node.ELEMENT_NODE ? startContainer : startContainer.parentElement) as HTMLElement;

  // console.log('element is ', element)
  // const tagNames = [
  //   'strong',
  //   'span',
  // ]
  // if (!tagNames.includes(element.localName)) {
  //   console.log('[Enhance] - 首个元素没有设置样式')
  //   return
  // }

  const tempStyle = {} as any as IStyle
  tempStyle.style = {}
  FONT_STYLE_KEYS.forEach((key) => {
    if (element.style[key]) {
      tempStyle.style[key] = element.style[key]
    }
  })

  const elDataType = element.dataset.type || ''
  let validFontStyleDataType = elDataType.split(' ').filter(i => FONT_STYLE_INLINE_TYPE.includes(i))
  validFontStyleDataType = Array.from(new Set(validFontStyleDataType))
  tempStyle.dataType = validFontStyleDataType || []

  tempStyle.selection = {} as any;
  SELECTION_KEYS.forEach((key) => {
    tempStyle.selection[key] = selection[key]
  })

  return tempStyle
}

const isSameStyle = (style1: IStyle, style2: IStyle) => {
  if (!style1 || !style2) {
    return false
  }

  const style1Keys = Object.keys(style1.style)
  const style2Keys = Object.keys(style2.style)
  if (style1Keys.length !== style2Keys.length || style1.dataType.length !== style2.dataType.length) {
    return false
  }

  // 检查 style 对象的键和值是否一致
  for (const key of style1Keys) {
    if (!style2Keys.includes(key) || style1.style[key] !== style2.style[key]) {
      return false;
    }
  }

  // 检查 dataType 数组的元素是否一致
  for (const type of style1.dataType) {
    if (!style2.dataType.includes(type)) {
      return false;
    }
  }

  return true
}

const copyCurrentStyle = () => {
  const tempStyle = convertStyleByRange()
  currentFontStyle.value = tempStyle
}

const pasteCurrentStyle = (protyle: IProtyle = currentProtyle.value) => {
  if (!currentFontStyle.value) {
    return
  }

  if (!currentProtyle.value) {
    log('未选中 protyle')
    return
  }

  // if (!Object.keys(currentFontStyle.value.style).length && !currentFontStyle.value.dataType.length) {
  //   return
  // }
  let range = protyle?.toolbar?.range

  let startContainer = range.startContainer;
  let element = (startContainer.nodeType === Node.ELEMENT_NODE ? startContainer : startContainer.parentElement) as HTMLElement;

  let siyuanNode = element
  while(siyuanNode != null && !siyuanNode.dataset.nodeId) {
    siyuanNode = siyuanNode.parentElement
  }

  const oldElement = siyuanNode.outerHTML

  protyle?.toolbar?.setInlineMark(protyle, 'clear', "range");
  protyle?.toolbar?.setInlineMark(protyle, 'clear', "range");

  currentFontStyle.value.dataType.forEach((item) => {
    protyle?.toolbar?.setInlineMark(protyle, item, "range");
  })

  range = protyle?.toolbar?.range
  startContainer = range.startContainer;
  element = (startContainer.nodeType === Node.ELEMENT_NODE ? startContainer : startContainer.parentElement) as HTMLElement;
  element.setAttribute('style', '')

  Object.keys(currentFontStyle.value.style).forEach((key) => {
    element.style[key] = currentFontStyle.value.style[key]
  })

  siyuanNode.setAttribute("updated", dayjs().format("YYYYMMDDHHmmss"));

  const protyleIns = protyle.getInstance()
  protyleIns.updateTransaction(siyuanNode.getAttribute("data-node-id"), siyuanNode.outerHTML, oldElement);
}

const plugin = usePlugin()

plugin.addIcons(`
  <symbol id="EnIconFormatBrushActived" viewBox="0 0 32 32">
    <path fill="#3d7bfc" style="fill: var(--color1, #3d7bfc)" d="M10.816 9.008l11.328 12.928 6.016-5.728-10.896-13.040-6.448 5.84zM31.952 5.408l-3.152-3.6-7.456 4.736 5.312 6.016 5.296-7.152z"></path>
    <path fill="#e1f0ff" style="fill: var(--color2, #e1f0ff)" d="M10.608 10.512s-6.304 3.008-9.6 1.792l13.68 17.344s4.944-7.088 5.952-7.168l-10.032-11.968z"></path>
    <path fill="#3d7bfc" style="fill: var(--color1, #3d7bfc)" d="M19.824 23.52c0.368-0.432 0.752-0.88 1.088-1.232l-10.224-12.176-0.224 0.112c-0.064 0.032-6.224 2.944-9.344 1.776l-1.072-0.4 14.672 18.592 0.256-0.352c0.016-0.016 1.216-1.744 2.544-3.472 0.736-0.96 1.312-1.664 1.744-2.176 0.208-0.288 0.4-0.496 0.56-0.672zM17.024 25.904c-0.992 1.296-1.92 2.608-2.352 3.216l-12.832-16.272c3.12 0.464 7.6-1.456 8.672-1.936l9.616 11.456c-0.24 0.176-0.576 0.48-1.072 1.040-0.56 0.608-1.232 1.456-2.032 2.496z"></path>
  </symbol>
`)
plugin.addIcons(`
  <symbol id="EnIconFormatBrush" viewBox="0 0 32 32">
  <path fill="#8a8a8a" style="fill: var(--color1, #8a8a8a)" d="M10.816 9.008l11.328 12.928 6.016-5.728-10.896-13.040-6.448 5.84zM31.952 5.408l-3.152-3.6-7.456 4.736 5.312 6.016 5.296-7.152z"></path>
  <path fill="#8a8a8a" style="fill: var(--color1, #8a8a8a)" d="M10.608 10.512s-6.304 3.008-9.6 1.792l13.68 17.344s4.944-7.088 5.952-7.168l-10.032-11.968z"></path>
  <path fill="#8a8a8a" style="fill: var(--color1, #8a8a8a)" d="M19.824 23.52c0.368-0.432 0.752-0.88 1.088-1.232l-10.224-12.176-0.224 0.112c-0.064 0.032-6.224 2.944-9.344 1.776l-1.072-0.4 14.672 18.592 0.256-0.352c0.016-0.016 1.216-1.744 2.544-3.472 0.736-0.96 1.312-1.664 1.744-2.176 0.208-0.288 0.4-0.496 0.56-0.672zM17.024 25.904c-0.992 1.296-1.92 2.608-2.352 3.216l-12.832-16.272c3.12 0.464 7.6-1.456 8.672-1.936l9.616 11.456c-0.24 0.176-0.576 0.48-1.072 1.040-0.56 0.608-1.232 1.456-2.032 2.496z"></path>
  </symbol>
`)

const getAriaLabel = () => {
  const cmd = plugin.commands.find(i => i.langKey === 'EnFormatBrushEnable')
  const enableLabels = [`开启格式刷`]
  if (cmd) {
    enableLabels.push(`(${cmd.customHotkey || cmd.hotkey})`)
  }
  return `${!brushing.value ? enableLabels.join('') : `关闭格式刷(Esc 取消)`}`
}

const commands = [
  {
    langKey: "EnFormatBrushEnable",
    langText: "开启格式刷",
    hotkey: "",
    editorCallback: () => {
      copyCurrentStyle()
    },
  },
  {
    langKey: "EnFormatBrush",
    langText: "格式刷（粘贴当前格式）",
    hotkey: "",
    editorCallback: (protyle) => {
      pasteCurrentStyle(protyle)
    },
  },
]

// 不想写清除的逻辑了 - -
const handler = () => {
  const domList = document.querySelectorAll('.protyle-toolbar')

  if (!domList.length) {
    return
  }

  domList.forEach((dom) => {
    let exist = false
    Array.prototype.find.call(dom.childNodes, (node: HTMLElement) => {
      if (node.dataset.type === 'EnFormatBrush') {
        exist = true
      }
    })
    if (exist) {
      return
    }

    const fragment = document.createDocumentFragment()

    const divider = document.createElement('div')
    divider.className = 'protyle-toolbar__divider'

    const btn = document.createElement('button')
    btn.className = 'protyle-toolbar__item b3-tooltips b3-tooltips__n'
    btn.setAttribute('data-type', 'EnFormatBrush')
    btn.setAttribute('aria-label', getAriaLabel())
    btn.innerHTML = `<svg><use xlink:href="${brushing.value ? '#EnIconFormatBrushActived' : '#EnIconFormatBrush'}"></use></svg>`
    btn.addEventListener('click', () => {
      if (brushing.value) {
        cancelBrush()
      } else {
        copyCurrentStyle()
      }
    })
    fragment.appendChild(divider)
    fragment.appendChild(btn)

    dom.appendChild(fragment)
  })
}

const observer = new MutationObserver(debounce(handler, 300));

const currentProtyle = ref<IProtyle>()
const recordCurrentProtyle = ({ detail }) => {
  currentProtyle.value = detail?.protyle
}

onMounted(() => {
  commands.forEach((command) => {
    plugin.addCommand(command);
  })
  observer.observe(document.body, {
    childList: true, // 观察目标子节点的变化，是否有添加或者删除
    subtree: true,
    attributes: true,
  })
});
onBeforeUnmount(() => {
  plugin.commands = plugin.commands.filter((i) => !commands.find(cmd => cmd.langKey === i.langKey));
  observer.disconnect()
});
</script>

<style lang="scss">
html[data-en_enabled_module~="EnFormatBrush"] {

  .protyle * {
    cursor: url('./FormatBrush.png'), default;
  }
}
</style>
