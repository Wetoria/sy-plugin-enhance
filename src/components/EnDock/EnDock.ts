import { usePlugin } from '@/main'
import { Custom } from 'siyuan'
import {
  ref,
} from 'vue'


export enum EnDockTypes {
  Common = 'Common',
  CommentHistory = 'CommentHistory',
}

export type EnDockType = keyof typeof EnDockTypes

export const EnDockMap: {
  [key in EnDockType]?: {
    custom: Custom
    element: HTMLElement
    open: boolean
  }
} = {}


const NeedRegisterDockTypes = [
  {
    type: EnDockTypes.CommentHistory,
    icon: 'iconEnComment',
    title: '叶归｜批注记录',
  },
]

export function getEnDockType(key: EnDockType) {
  const plugin = usePlugin()
  return `${plugin.name}_EnDock_${key}`
}

export const registerDock = () => {
  const plugin = usePlugin()

  if (plugin.isMobile) {
    return
  }

  const dockTypes = []
  NeedRegisterDockTypes.forEach((config) => {
    const key = getEnDockType(config.type)
    let item = EnDockMap[key]
    if (!item) {
      EnDockMap[key] = item = ref({
        custom: null,
        element: null,
        open: false,
      })
    }
    plugin.addDock({
      type: `_EnDock_${config.type}`,
      config: {
        position: 'RightTop',
        size: {
          width: 300,
          height: 0,
        },
        icon: config.icon,
        title: config.title,
      },
      data: {},
      init(custom) {
        item.value.custom = custom as any as Custom
        item.value.element = custom.element
        //
        item.value.open = true
      },
      resize() {

      },
      destroy() {
        item.value.custom = null
        item.value.element = null
        item.value.open = false
        delete EnDockMap[key]
      }
    })

    dockTypes.push(key)
  })


  document.addEventListener('click', (event) => {
    let target = event.target as HTMLElement

    let dockEntryKey = null
    while(target) {
      if (target.dataset.type && dockTypes.includes(target.dataset.type)) {
        dockEntryKey = target.dataset.type
        break
      }
      target = target.parentElement
    }

    if (!dockEntryKey) {
      return
    }

    const item = EnDockMap[dockEntryKey]
    // 采用 capture 的方式，切换 dock 的 open 状态
    // 这样可以通过后续触发的 init 事件，强制将 open 状态设置为 true
    // 后续点击切换时，一切状态都是正常的
    if (item) {
      item.value.open = !item.value.open
    }
  }, true)
}

