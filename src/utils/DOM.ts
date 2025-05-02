import {
  onBeforeUnmount,
  onMounted,
  Ref,
  ref,
} from 'vue'


/**
 * In order to convert query resutl into Array
 * @param dom
 * @param selector
 * @returns Array<HTMLElement>
 */
export function queryAllByDom(dom: HTMLElement, selector: string) {
  return dom ? [...dom.querySelectorAll(selector)] : []
}

export function querySelectorByBody(str) {
  return document.body.querySelector(str)
}

export function hideGutterOnTarget(target) {
  if (!target)
    return
  target.querySelectorAll(".protyle-gutters").forEach((item) => {
    item.classList.add("fn__none")
    item.innerHTML = ""
  })
}


export const onCountClick = (fn: (count: number, ...args: any[]) => void, options?: {
  delay?: number
  preventDefault?: boolean
  stopPropagation?: boolean
  stopImmediatePropagation?: boolean
}) => {
  const countTime = ref(0)
  const countTimeTimeoutFlag = ref()

  return (...args) => {
    clearTimeout(countTimeTimeoutFlag.value)
    countTime.value += 1
    countTimeTimeoutFlag.value = setTimeout(() => {
      fn(countTime.value, ...args)
      countTime.value = 0
    }, options?.delay || 300)
    if (options?.preventDefault) {
      args[0].preventDefault()
    }
    if (options?.stopPropagation) {
      args[0].stopPropagation()
    }
    if (options?.stopImmediatePropagation) {
      args[0].stopImmediatePropagation()
    }
  }
}

export function useRegisterStyle(id): Ref<HTMLStyleElement> {
  const styleDomRef = ref(null)
  const alreadyExist = document.getElementById(id)
  if (alreadyExist) {
    styleDomRef.value = alreadyExist
  } else {
    styleDomRef.value = document.createElement('style')
    styleDomRef.value.id = id
    document.head.appendChild(styleDomRef.value)
  }
  return styleDomRef
}

export function positionModalWithTranslate(targetElement, modalElement) {
  // 垂直方向增加偏移，水平方向上不偏移
  const offset = 8
  // 获取目标元素的位置
  const targetRect = targetElement.getBoundingClientRect()
  const modalRect = modalElement.getBoundingClientRect()

  // 计算 modal 初始的 translate 位置 (假设显示在目标元素的下方)
  let translateX = targetRect.left
  let translateY = targetRect.bottom + offset

  // 调整 modal 的位置，防止超出屏幕
  const windowWidth = window.innerWidth
  const windowHeight = window.innerHeight

  // 如果 modal 的右边超出了窗口宽度
  if (targetRect.left + modalRect.width > windowWidth) {
    translateX = targetRect.left - modalRect.width
  }

  // 如果 modal 的左边超出了窗口左边界
  if (translateX < 0) {
    translateX = offset
  }

  // 如果 modal 的底部超出了窗口高度
  if (targetRect.bottom + modalRect.height > windowHeight) {
    translateY = targetRect.top - modalRect.height - offset
  }

  // 如果 modal 的顶部超出了窗口顶部
  if (translateY < 0) {
    translateY = offset
  }

  return {
    translateX,
    translateY,
  }
}

export function targetIsInnerOf(target: HTMLElement, judge: (target: HTMLElement) => boolean) {
  let targetElement = target
  while (targetElement) {
    if (judge(targetElement)) {
      return true
    }
    targetElement = targetElement.parentElement
  }
  return false
}

export function targetIsOutsideOf(target: HTMLElement, judge: (target: HTMLElement) => boolean) {
  return !targetIsInnerOf(target, judge)
}

let observer = null
let observeCallbackList = []

export function unWatchDomChange(callback: () => void) {
  observeCallbackList = observeCallbackList.filter((i) => i !== callback)
  callback = null
}

export function watchDomChange(callback?: () => void) {
  if (callback) {
    const listener = observeCallbackList.find((i) => i === callback)
    if (!listener) {
      observeCallbackList.push(callback)
    }
  }
}

export function registerGlobalObserver() {
  observer = new MutationObserver(() => {
    observeCallbackList.forEach((i) => i())
  })
  const observe = () => {
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
    })
  }
  const unobserve = () => {
    observer.disconnect()
    observer = null
    observeCallbackList = []
  }
  onMounted(() => {
    observe()
  })

  onBeforeUnmount(() => {
    unobserve()
  })
  window.addEventListener('beforeunload', () => {
    unobserve()
  })
  enSuccess('Global MutationObserver registered')
}

export enum SELECTION_KEYS {
  anchorNode = 'anchorNode',
  anchorOffset = 'anchorOffset',
  baseNode = 'baseNode',
  baseOffset = 'baseOffset',
  extentNode = 'extentNode',
  extentOffset = 'extentOffset',
  focusNode = 'focusNode',
  focusOffset = 'focusOffset',
  isCollapsed = 'isCollapsed',
}

export function getSelectionCopy() {
  const selection = window.getSelection()
  const selectionResult = {}
  Object.values(SELECTION_KEYS).forEach((key) => {
    selectionResult[key] = selection[key]
  })
  return selectionResult
}


export enum AppendDomClassOrder {
  Test = 'Test',
}
const appendDomClassOrder = Object.values(AppendDomClassOrder)

export function appendTargetDomAsClassOrder(className: AppendDomClassOrder | string, targetDom: HTMLElement) {
  if (!className) {
    enWarn('Append Target need a className')
    return
  }
  if (!targetDom) {
    enWarn('Append Target need a targetDom')
    return
  }
  const indexInOrder = appendDomClassOrder.findIndex((i) => i === className)


  // 如果 className 不在 appendDomClassOrder 中，则认为它在最后
  const finalIndex = indexInOrder > -1 ? indexInOrder : 999
  const children = targetDom.children
  let existDomInTargetDom

  // 从后往前查找已存在的同类元素
  for (let i = children.length - 1; i >= 0; i--) {
    if (children[i].classList.contains(className)) {
      existDomInTargetDom = children[i]
      break
    }
  }

  let result = existDomInTargetDom

  if (result) {
    return result
  }

  result = document.createElement('div')
  result.classList.add(className)

  if (finalIndex < children.length) {
    targetDom.insertBefore(result, children[finalIndex])
  } else {
    targetDom.appendChild(result)
  }
  return result
}


export const highlightText = (text: string, keyword: string) => {
  if (!keyword) return text

  // 将搜索关键词转换为字符数组
  const searchChars = Array.from(keyword.toLowerCase())
  const textChars = Array.from(text)

  // 记录每个字符是否需要高亮
  const highlights = Array.from({ length: textChars.length }).fill(false)

  // 查找所有匹配的字符位置
  let textIdx = 0
  for (const char of searchChars) {
    while (textIdx < textChars.length) {
      if (textChars[textIdx].toLowerCase() === char) {
        highlights[textIdx] = true
        textIdx++
        break
      }
      textIdx++
    }
  }

  // 生成高亮HTML，将相邻的高亮字符合并
  let result = ''
  let isInHighlight = false

  for (let i = 0; i < textChars.length; i++) {
    if (highlights[i] && !isInHighlight) {
      result += '<mark class="en-search-highlight">'
      isInHighlight = true
    } else if (!highlights[i] && isInHighlight) {
      result += '</mark>'
      isInHighlight = false
    }
    result += textChars[i]
  }

  if (isInHighlight) {
    result += '</mark>'
  }

  return result
}

export function handleWith(judge: () => boolean, callback: () => void) {
  let timer = null
  return new Promise<void>((resolve) => {
    timer = setInterval(() => {
      if (judge()) {
        clearInterval(timer)
        callback()
        resolve()
      }
    }, 0)
  })
}

export function getLastCharPositionFromTextNode(textNode) {
  try {
    // 检查参数是否为文本节点
    if (!textNode || textNode.nodeType !== Node.TEXT_NODE) {
      return null
    }

    const text = textNode.textContent

    if (!text || text.length === 0) {
      return null
    }

    // 创建 Range 对象
    const range = document.createRange()

    // 设置 Range 为最后一个字符
    range.setStart(textNode, text.length - 1)
    range.setEnd(textNode, text.length)

    // 获取位置信息
    const rects = range.getClientRects()

    if (rects.length === 0) {
      return null
    }

    // 获取最后一个 rect
    const lastRect = rects[rects.length - 1]

    // 如果需要相对于文档的位置，使用 getBoundingClientRect
    // const lastRect = range.getBoundingClientRect();

    return {
      left: lastRect.left,
      top: lastRect.top,
      right: lastRect.right,
      bottom: lastRect.bottom,
      width: lastRect.width,
      height: lastRect.height,
    }
  } catch (e) {
    return null
  }
}


const EnProtyleUtilAreaRef = ref(null)
export function useEnProtyleUtilAreaRef() {
  return EnProtyleUtilAreaRef
}

