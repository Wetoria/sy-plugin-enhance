import SettingsVue from '@/components/Settings/index.vue';
import { usePlugin } from '@/main';
import { Dialog } from 'siyuan';
import { App, createApp, onMounted, ref } from 'vue';
import ArcoVue from '@arco-design/web-vue';

let mountedVueDoms = []

export let mountedVueMap = new WeakMap<HTMLDivElement, App>()
function saveDom(div, app) {
  mountedVueMap.set(div, app)
  mountedVueDoms.push(div)
}

export function clearAllVueComponents() {
  const list = [...mountedVueDoms]
  list.forEach((div) => {
    unmout(div)
  })
  mountedVueMap = new WeakMap()
}

export function loadComponentAppendToBody(component) {
  const div = document.createElement('div');
  const app = createApp(component);
  document.body.appendChild(div);
  app.use(ArcoVue);
  app.mount(div);
  saveDom(div, app)
  return div
}


export function unmout(div: HTMLDivElement) {
  if (mountedVueMap.has(div)) {
    const temp = mountedVueMap.get(div)
    temp.unmount()
    mountedVueMap.delete(div)
    mountedVueDoms = mountedVueDoms.filter(i => i != div)
  }
}

export function getDomByVueComponent(component, options = {
  props: {}
}) {
  const div = document.createElement('div');
  const {
    // useArco
    props = {}
  } = options
  const app = createApp(component, props);
  // if (useArco) {
  //   app.use(ArcoVue);
  // }
  app.mount(div);
  saveDom(div, app)
  return div;
}

let flag
let registered = false
let keyboardShown = ref(false)
export function useMobileKeyBoardShown() {
  onMounted(() => {
    const ob = new MutationObserver(() => {
      if (flag) {
        clearTimeout(flag)
      }
      setTimeout(() => {
        const keyboardToolbar = document.querySelector('#keyboardToolbar')
        if (keyboardToolbar) {
          if (!registered) {
            const ob1 = new MutationObserver(() => {
              keyboardShown.value = !keyboardToolbar.classList.contains('fn__none')
            })
            ob1.observe(keyboardToolbar, {
              attributes: true,
            })
            registered = true
          }
        } else {
          console.log('no keyboard tool bar')
        }
      }, 100)
    })
    ob.observe(document.body, {
      childList: true, // 观察目标子节点的变化，是否有添加或者删除
      subtree: true, // 观察后代节点，默认为 false
    })
  })
  return keyboardShown;
}

export function recursionTree(tree, parent, callback: (curNode, parentNode?) => void) {
  if (!tree || !tree.length) {
    return
  }
  tree.forEach((node) => {
    callback(node, parent)
    recursionTree(node.children, node, callback)
  })
}

export function recursionTreeCanBreakChildren(tree, parent, callback: (curNode, parentNode?) => boolean) {
  if (!tree || !tree.length) {
    return
  }
  tree.forEach((node) => {
    const breakChildren = callback(node, parent)
    if (breakChildren) {
      return
    }
    recursionTree(node.children, node, callback)
  })
}

export function reomveDuplicated(list, compare = (cur, itemInResult) => (cur.id === itemInResult.id)) {
  const result = []
  list.forEach((item) => {
    const exist = result.find(i => compare(i, item))
    if (!exist) {
      result.push(item)
    }
  })
  return result
}

export const openSetting = () => {
  const plugin = usePlugin()
  const div = getDomByVueComponent(SettingsVue)
  const dialog = new Dialog({
    title: `
      <div class="SyEnhancerDialogTitle">
        ${plugin.i18n.pluginName}
      </div>
    `,
    content: `
      <div class="SyEnhancerSettingsContainer">
      </div>
    `,
    width: '80%',
    destroyCallback: () => {
      unmout(div)
    }
  })
  const container = dialog.element.querySelector('.SyEnhancerSettingsContainer')
  container.innerHTML = ''
  container.append(div)
}

export function debounce(fn, time = 500) {
  let flag
  return (...args) => {
    if (flag) {
      clearTimeout(flag)
    }
    flag = setTimeout(() => {
      fn(...args)
    }, time)
  }
}

export function jumpToProtyleBottom(docId) {
  if (!docId) {
    return
  }

  const plugin = usePlugin()
  let docTargetDom = null
  if (plugin.isMobile) {
    docTargetDom = document.querySelector(`.enhanceHackUi`)
  } else {
    docTargetDom = document.querySelector(`.protyle-title[data-node-id="${docId}"]`)
  }
  if (!docTargetDom) {
    return
  }

  const protyleContent = docTargetDom.parentNode
  const indicator: HTMLElement = protyleContent.querySelector('.ProtyleBottomContainer .enhanceToBottomIndicator')
  if (!indicator) {
    return
  }

  indicator.scrollIntoView(false)

  const enhanceProtyleBottomContainer = docTargetDom.querySelector('.enhanceProtyleBottomContainer')
  if (enhanceProtyleBottomContainer) {
    console.log('enhanceProtyleBottomContainer.parentElement is ', enhanceProtyleBottomContainer.parentElement)
    enhanceProtyleBottomContainer.parentElement.scrollTop += 30
  }
}
