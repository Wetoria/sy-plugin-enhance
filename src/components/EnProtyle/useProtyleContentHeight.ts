import { getBlockDOM } from '@/api'
import { debounce } from '@/utils'
import { useResizeObserver } from '@vueuse/core'
import {
  onMounted,
  Ref,
  ref,
  watch,
} from 'vue'

export function useProtyleContentHeight(props: {
  blockId: string
  // 用于设置最小高度的容器，宽度可能不会变化
  containerRef: Ref<HTMLElement>
  // 用于渲染 protyle 的区域，宽度会随着是否显示、内容是否折叠而变化
  renderAreaRef: Ref<HTMLElement>
  onResize?: (size: {
    width: number
    height: number
  }) => void
}) {
  const contentHeight = ref(0)

  const getBlockDomForBlockId = async () => {
    const blockDomRes = await getBlockDOM(props.blockId)
    updateProtyleMinHeight(blockDomRes.dom)
  }
  const updateProtyleMinHeight = debounce((protyleContentDom: string) => {
    const div = document.createElement('div')
    div.innerHTML = `
      <div class="protyle">
        <div class="protyle-content">
          <div class="protyle-wysiwyg">
            ${protyleContentDom}
          </div>
        </div>
      </div>
    `
    div.style.opacity = '0'
    const protyleDom = div.firstElementChild as HTMLDivElement

    // 插入并获取 protyle 内容的高度
    props.containerRef.value?.appendChild(div)
    contentHeight.value = protyleDom.clientHeight

    // 计算完成，移除 protyle 的 html
    props.containerRef.value?.removeChild(div)
  })

  onMounted(() => {
    getBlockDomForBlockId()
  })

  watch(props, () => {
    getBlockDomForBlockId()
  }, {
    deep: true,
  })

  const debouncedEmit = debounce((size: {
    width: number
    height: number
  }) => {
    props.onResize?.(size)
  })

  let stopFunc = null
  const startResizeObserver = () => {
    const { stop } = useResizeObserver(props.renderAreaRef, (entries) => {
      const entry = entries[0]
      const {
        width,
        height,
      } = entry.contentRect
      debouncedEmit({
        width,
        height,
      })
    })
    stopFunc = stop
  }
  const stopResizeObserver = () => {
    stopFunc?.()
  }

  return {
    contentHeight,
    startResizeObserver,
    stopResizeObserver,
  }
}
