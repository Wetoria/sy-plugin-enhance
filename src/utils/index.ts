import { createApp, onMounted, ref } from 'vue';
// import ArcoVue from '@arco-design/web-vue';
// import '@arco-design/web-vue/dist/arco.css';

export function loadComponent(component) {
  const div = document.createElement('div');
  const app = createApp(component);
  document.body.appendChild(div);
  app.mount(div);
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

export function isInTreeChain(chain: any[], target) {
  return chain.find((n) => {
    if (n._type == 'doc') {
      return target.id == n.id
    }
    return false
      || target.id == n.id
      || (n.blockRefs && n.blockRefs.find((b) => b.id == target.id))
      || n.treePath.includes(target.id)
  })
}
