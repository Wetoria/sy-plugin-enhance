import { reactive, ref } from 'vue'
import { usePlugin } from '@/main';


/**
 * In order to convert query resutl into Array
 * @param dom
 * @param selector
 * @returns
 */
export function queryAllByDom(dom: HTMLElement, selector: string) {
  return dom ? [...dom.querySelectorAll(selector)] : []
}

export function querySelectorByBody(str) {
  return document.body.querySelector(str)
}

export function hideGutterOnTarget(target) {
  if (!target) return
  target.querySelectorAll(".protyle-gutters").forEach(item => {
    item.classList.add("fn__none");
    item.innerHTML = "";
  });
}

export const protyleBottomMap = ref(new Map())
export function registerProtyleBottomArea() {
  const plugin = usePlugin()
  plugin.eventBus.on('loaded-protyle-static', (event) => {
    const {
      detail
    } = event
    const element = detail.protyle.contentElement;
    if (!element) {
      return
    }

    // 标记是不是日记文档
    const wysiwygEl: HTMLDivElement = element.querySelector('.protyle-wysiwyg')
    if (wysiwygEl) {
      const attrs = wysiwygEl.getAttributeNames()
      const containsDailyNoteAttr = attrs.find(i => i.startsWith('custom-dailynote'))
      if (containsDailyNoteAttr) {
        wysiwygEl.dataset.en_is_dailynote = 'true'
        wysiwygEl.dataset.en_dailynote_date = wysiwygEl.getAttribute(containsDailyNoteAttr)
        element.dataset.en_is_dailynote = 'true'
        element.dataset.en_dailynote_date = wysiwygEl.getAttribute(containsDailyNoteAttr)
      }
    }

    if (protyleBottomMap.value.has(element)) {
      const detailRef = protyleBottomMap.value.get(element)
      detailRef.detail = detail
      detailRef.element = element
      return
    }
    const div = document.createElement('div')
    protyleBottomMap.value.set(element, reactive({
      detail: detail,
      element,
      enArea: div,
    }))
    div.className = 'enhanceProtyleBottomContainer'
    element.appendChild(div)
  })

  plugin.eventBus.on("destroy-protyle", (event) => {
    const {
      detail
    } = event
    const element = detail.protyle.contentElement;
    if (protyleBottomMap.value.has(element)) {
      protyleBottomMap.value.delete(element)
    }
  })
}

export const onCountClick = (fn) => {
  const countTime = ref(0)
  const countTimeTimeoutFlag = ref()
  return (...args) => {
    clearTimeout(countTimeTimeoutFlag.value)
    countTime.value += 1
    countTimeTimeoutFlag.value = setTimeout(() => {
      fn(countTime.value, ...args)
      countTime.value = 0
    }, 300)
  }
}

export function useRegisterStyle(id) {
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
  const targetRect = targetElement.getBoundingClientRect();
  const modalRect = modalElement.getBoundingClientRect();

  // 计算 modal 初始的 translate 位置 (假设显示在目标元素的下方)
  let translateX = targetRect.left;
  let translateY = targetRect.bottom + offset;

  // 调整 modal 的位置，防止超出屏幕
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;

  // 如果 modal 的右边超出了窗口宽度
  if (targetRect.left + modalRect.width > windowWidth) {
    translateX = targetRect.left - modalRect.width;
  }

  // 如果 modal 的左边超出了窗口左边界
  if (targetRect.left < 0) {
    translateX = 0;
  }

  // 如果 modal 的底部超出了窗口高度
  if (targetRect.bottom + modalRect.height > windowHeight) {
    translateY = targetRect.top - modalRect.height - offset;
  }

  // 如果 modal 的顶部超出了窗口顶部
  if (targetRect.top < 0) {
    translateY = 0;
  }

  return {
    translateX,
    translateY,
  }
}
