import dayjs from 'dayjs'
import {
  DebounceSettings,
  debounce as lodashDebounce,
} from 'lodash-es'
import {
  onMounted,
  ref,
} from 'vue'


let flag
let registered = false
const keyboardShown = ref(false)
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
              keyboardShown.value =
                !keyboardToolbar.classList.contains('fn__none')
            })
            ob1.observe(keyboardToolbar, {
              attributes: true,
            })
            registered = true
          }
        } else {
          enLog('no keyboard tool bar')
        }
      }, 100)
    })
    ob.observe(document.body, {
      childList: true, // 观察目标子节点的变化，是否有添加或者删除
      subtree: true, // 观察后代节点，默认为 false
    })
  })
  return keyboardShown
}

export function recursionTree(
  tree,
  parent,
  callback: (curNode, parentNode?) => void,
) {
  if (!tree || !tree.length) {
    return
  }
  tree.forEach((node) => {
    callback(node, parent)
    recursionTree(node.children, node, callback)
  })
}

export function recursionTreeCanBreakChildren(
  tree,
  parent,
  callback: (curNode, parentNode?) => boolean,
) {
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

export function debounce(fn, time = 500, options?: DebounceSettings) {
  return lodashDebounce(fn, time, options)
}

export function moduleEnableStatusSwitcher(
  moduleName: string,
  enabled: boolean,
) {
  const moduleStr = document.documentElement.dataset.en_enabled_module || ''
  let enabledModules = moduleStr.split(/\s+/)
  if (enabled) {
    if (!enabledModules.includes(moduleName)) {
      enabledModules.push(moduleName)
    }
  } else {
    enabledModules = enabledModules.filter((i) => i != moduleName)
  }
  const newModuleStr = enabledModules.filter(Boolean).join(' ')
  document.documentElement.dataset.en_enabled_module = newModuleStr
}

export function generateShortUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  }).slice(0, 8) // 取前8个字符
}

export function generateUUIDWithTimestamp() {
  const shortUUID = generateShortUUID()
  const time = dayjs().format('YYYYMMDDHHmmss')
  return `${time}-${shortUUID}`
}
