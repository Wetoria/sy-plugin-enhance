import { ref } from 'vue'
import { getDomByVueComponent } from '.';
import ProtyleBottomContainerVue from '@/components/ProtyleBottomContainer.vue';
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

const registeredMap = new WeakMap()
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
    if (registeredMap.has(element)) {
      const detailRef = registeredMap.get(element)
      detailRef.value = detail
      return
    }
    const detailRef = ref(detail)
    registeredMap.set(element, detailRef)
    const div = getDomByVueComponent(ProtyleBottomContainerVue, {
      props: {
        detail: detailRef,
        element,
      }
    })
    div.className = 'enhanceProtyleBottomContainer'
    const wysiwyg: HTMLDivElement = element.querySelector('.protyle-wysiwyg')
    if (wysiwyg) {
      const bindPadding = () => {
        const leftPadding = Number(wysiwyg.style.paddingLeft.replace('px', ''))
        const rightPadding = Number(wysiwyg.style.paddingRight.replace('px', ''))
        div.style.paddingLeft = (leftPadding - 8) + 'px'
        div.style.paddingRight = (rightPadding - 8) + 'px'
        // IMP 改成可以配置的
        wysiwyg.style.paddingBottom = '68px'
      }
      bindPadding()
      let flag = null
      const ob = new MutationObserver(() => {
        if (flag) {
          clearTimeout(flag)
        }
        flag = setTimeout(() => {
          bindPadding()
        }, 0)
      })
      ob.observe(wysiwyg, {
        childList: true, // 观察目标子节点的变化，是否有添加或者删除
        subtree: true,
        attributes: true,
      })
    }
    element.appendChild(div)
  })

  plugin.eventBus.on("destroy-protyle", (event) => {
    const {
      detail
    } = event
    const element = detail.protyle.contentElement;
    if (registeredMap.has(element)) {
      registeredMap.delete(element)
    }
  })
}
