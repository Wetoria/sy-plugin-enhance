import { onMounted, ref } from 'vue'
import { getDomByVueComponent } from '.';
import ProtyleBottomContainerVue from '@/components/ProtyleBottomContainer.vue';
import { usePlugin } from '@/main';

export function useBodyObserver(props) {
  const {
    onBodyChange = () => {},
  } = props;
  onMounted(() => {
    const ob = new MutationObserver(() => {
      onBodyChange()
    })
    ob.observe(document.body, {
      childList: true, // 观察目标子节点的变化，是否有添加或者删除
      subtree: true, // 观察后代节点，默认为 false
    })
  })
}

export function useMobileEditorObserver(props) {
  const lastEditShownStatus = ref(false)
  const {
    onEditorShownChange = () => {},
    onEditorShown = () => {},
    onEditorHidden = () => {},
  } = props;
  const flag = ref(null)
  const onBodyChange = () => {
    if (flag.value) {
      clearTimeout(flag.value)
    }
    flag.value = setTimeout(() => {
      const dom = document.querySelector('#editor')
      if (dom) {
        const editorIsHidden = dom.classList.contains('fn__none')
        if (lastEditShownStatus.value !== editorIsHidden) {
          onEditorShownChange(editorIsHidden, lastEditShownStatus.value)
          if (editorIsHidden) {
            onEditorHidden()
          } else {
            onEditorShown()
          }
        }
        lastEditShownStatus.value = editorIsHidden;
      }
    }, 100)
  }

  useBodyObserver({
    onBodyChange,
  })
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
        div.style.paddingLeft = wysiwyg.style.paddingLeft
        div.style.paddingRight = wysiwyg.style.paddingRight
      }
      bindPadding()
      let flag = null
      const ob = new MutationObserver(() => {
        if (flag) {
          clearTimeout(flag)
        }
        flag = setTimeout(() => {
          bindPadding()
        }, 100)
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
