import SettingsVue from '@/components/Settings.vue';
import { usePlugin } from '@/main';
import { Dialog } from 'siyuan';
import { App, createApp, onMounted, ref } from 'vue';
// import ArcoVue from '@arco-design/web-vue';
// import '@arco-design/web-vue/dist/arco.css';

export function loadComponent(component) {
  const div = document.createElement('div');
  const app = createApp(component);
  document.body.appendChild(div);
  app.mount(div);
}

const mountedVueMap = new WeakMap<HTMLDivElement, App>()

export function unmout(div: HTMLDivElement) {
  if (mountedVueMap.has(div)) {
    const temp = mountedVueMap.get(div)
    temp.unmount()
    mountedVueMap.delete(div)
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
  mountedVueMap.set(div, app)
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
    title: plugin.i18n.pluginName,
    content: `
      <div class="SyEnhancerSettingsContainer">
      </div>
    `,
    width: '80%',
    destroyCallback: () => {
      console.log('dd')
      unmout(div)
    }
  })
  const container = dialog.element.querySelector('.SyEnhancerSettingsContainer')
  container.innerHTML = ''
  container.append(div)
}

