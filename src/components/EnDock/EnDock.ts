import { usePlugin } from '@/main'
import { Custom } from 'siyuan'
import { ref, Ref } from 'vue'

const docks: {
  [key: string]: Ref<{
    dockRef: Custom,
    open: boolean,
    width: number,
  }>
} = {}

export const addDock = (options) => {
  const plugin = usePlugin()
  const key = `${plugin.name}_${options.type}`

  const exist = docks[key]
  if (exist) {
    return exist.value
  }

  const result = ref({
    open: false,
    dockRef: null,
    width: 0,
  })

  plugin.addDock({
    ...options,
    init(custom) {
      result.value.dockRef = custom as any as Custom
    },
    resize() {
      result.value.dockRef = this as any as Custom

      const rect = this.element.getBoundingClientRect()
      const isOpened = rect.width > 0
      result.value.open = isOpened
      result.value.width = rect.width
    },
  })

  docks[key] = result
  return result.value
}

