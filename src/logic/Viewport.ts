import {
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from 'vue'

let listened = false
export enum viewportKeys {
  height = 'height',
  offsetLeft = 'offsetLeft',
  offsetTop = 'offsetTop',
  onresize = 'onresize',
  onscroll = 'onscroll',
  pageLeft = 'pageLeft',
  pageTop = 'pageTop',
  scale = 'scale',
  width = 'width',
}

const viewportRef = ref<{
  [key in viewportKeys]: any;
}>({} as any)
export function useViewport() {
  let pendingUpdate = false
  let latestViewportData: any = null

  function viewportHandler() {
    // 总是获取最新的视口数据
    latestViewportData = {}
    Object.values(viewportKeys).forEach((key) => {
      latestViewportData[key] = window.visualViewport[key]
    })

    if (pendingUpdate) return
    pendingUpdate = true

    requestAnimationFrame(() => {
      pendingUpdate = false
      // 使用最新获取的数据更新响应式引用
      Object.assign(viewportRef.value, latestViewportData)
    })
  }
  onMounted(() => {
    if (!listened) {
      window.visualViewport.addEventListener('scroll', viewportHandler)
      window.visualViewport.addEventListener('resize', viewportHandler)
      listened = true
    }
  })
  onBeforeUnmount(() => {
    if (listened) {
      window.visualViewport.removeEventListener('scroll', viewportHandler)
      window.visualViewport.removeEventListener('resize', viewportHandler)
    }
  })
  viewportHandler()
  return viewportRef
}
export function onViewportChange(cb: (newViewport: any, oldViewport: any) => void) {
  useViewport()
  return watch(viewportRef, (newVal, oldVal) => {
    cb(newVal, oldVal)
  }, {
    deep: true,
    immediate: true,
  })
}
