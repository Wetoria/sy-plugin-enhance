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
