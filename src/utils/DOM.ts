import { reactive, ref } from 'vue'
import { usePlugin } from '@/main';


/**
 * In order to convert query resutl into Array
 * @param dom
 * @param selector
 * @returns
 */
export function queryAllByDom(dom: HTMLElement, selector: string) {
  return [...dom.querySelectorAll(selector)]
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
        element.dataset.en_is_dailynote = 'true'
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
