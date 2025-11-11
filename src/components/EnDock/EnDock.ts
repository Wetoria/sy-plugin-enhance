import { usePlugin } from '@/main'
import { Custom } from 'siyuan'
import {
  Ref,
  ref,
} from 'vue'


export enum EnDockTypes {
  Common = 'Common',
  CommentHistory = 'CommentHistory',
  LifeLogDailyNoteFlow = 'LifeLogDailyNoteFlow',
}

export type EnDockType = keyof typeof EnDockTypes

export const EnDockMap: {
  [key in EnDockType]?: Ref<{
    custom: Custom
    element: HTMLElement
    open: boolean
    resized: () => void
  }>
} = {}


const NeedRegisterDockTypes = [
  {
    type: EnDockTypes.CommentHistory,
    icon: 'iconEnComment',
    title: '叶归｜批注记录',
  },
  {
    type: EnDockTypes.LifeLogDailyNoteFlow,
    icon: 'iconEnLifeLog',
    title: '叶归｜LifeLog',
  },
]

export function getEnDockType(key: EnDockType) {
  const plugin = usePlugin()
  return `${plugin.name}_EnDock_${key}`
}


function updateCurrentDockOpen(dockEntryKey: string, newValue?: boolean) {
  const item = EnDockMap[dockEntryKey]
  // 采用 capture 的方式，切换 dock 的 open 状态
  // 这样可以通过后续触发的 init 事件，强制将 open 状态设置为 true
  // 后续点击切换时，一切状态都是正常的
  if (item) {
    const newOpenValue = newValue !== undefined ? newValue : !item.value.open
    item.value.open = newOpenValue

    // 如果新值是 true，将同一侧的兄弟节点的 open 都设置为 false
    if (newOpenValue && item.value.element) {
      const currentElement = item.value.element
      const parentElement = currentElement.parentElement

      if (parentElement) {
        // 通过 prevSibling 和 nextSibling 查找所有兄弟节点
        let sibling = parentElement.firstElementChild as HTMLElement
        while (sibling) {
          if (sibling !== currentElement) {
            // 查找这个兄弟节点对应的 EnDock
            Object.keys(EnDockMap).forEach((key) => {
              if (key !== dockEntryKey && EnDockMap[key]?.value.element === sibling) {
                EnDockMap[key].value.open = false
              }
            })
          }
          sibling = sibling.nextElementSibling as HTMLElement
        }
      }
    }
  }
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
        resized: () => {},
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

        updateCurrentDockOpen(key, true)
      },
      resize(...args) {
        item.value.resized?.(...args)
      },
      destroy() {
        item.value.custom = null
        item.value.element = null
        updateCurrentDockOpen(key, false)
      },
    })

    dockTypes.push(key)
  })


  document.addEventListener('click', (event) => {
    let target = event.target as HTMLElement

    let dockEntryKey = null
    while (target) {
      if (target.dataset.type && dockTypes.includes(target.dataset.type)) {
        dockEntryKey = target.dataset.type
        break
      }
      target = target.parentElement
    }

    if (!dockEntryKey) {
      return
    }

    updateCurrentDockOpen(dockEntryKey)
  }, true)
}

