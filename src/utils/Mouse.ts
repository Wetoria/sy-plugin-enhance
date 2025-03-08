import {
  onBeforeUnmount,
  onMounted,
  ref,
} from 'vue'
import { debounce } from '.'

const currentMousePosition = ref({
  clientX: 0,
  clientY: 0,
  screenX: 0,
  screenY: 0,
})
const lastMouseClickPosition = ref({
  clientX: 0,
  clientY: 0,
  screenX: 0,
  screenY: 0,
})
const recordMousePositionByMouseUp = (event: Event) => {
  const {
    clientX,
    clientY,
    screenX,
    screenY,
  } = event as MouseEvent
  currentMousePosition.value = {
    clientX,
    clientY,
    screenX,
    screenY,
  }
  lastMouseClickPosition.value = {
    clientX,
    clientY,
    screenX,
    screenY,
  }
}
const recordMouseCurrentPositionByMouseMove = (event: Event) => {
  const {
    clientX,
    clientY,
    screenX,
    screenY,
  } = event as MouseEvent
  currentMousePosition.value = {
    clientX,
    clientY,
    screenX,
    screenY,
  }
}

function getCurrentMousePosition() {
  return currentMousePosition.value
}
function getLastMouseClickPosition() {
  return lastMouseClickPosition.value
}

export function useMousePostion(props: {
  immediate?: boolean
  wait?: number
  onMouseMoveStart?: (event: MouseEvent) => void
  onMouseMove?: (event: MouseEvent) => void
  onMouseMoveEnd?: (event: MouseEvent) => void
  onMouseUp?: (event: MouseEvent) => void
  onMouseDown?: (event: MouseEvent) => void
}) {
  const {
    immediate = true,
    wait = 500,
    onMouseMove,
    onMouseUp,
    onMouseDown,
    onMouseMoveStart,
    onMouseMoveEnd,
  } = props
  let mouseMoveFlag = false
  const eventBinded = ref(false)

  // 停止移动鼠标500ms后，触发结束事件
  const mouseMoveEndInner = debounce((event: MouseEvent) => {
    mouseMoveFlag = false
    onMouseMoveEnd?.(event)
  }, wait)

  const onMouseMoveInner = (event: MouseEvent) => {
    if (!mouseMoveFlag) {
      onMouseMoveStart?.(event)
      mouseMoveFlag = true
    }
    recordMouseCurrentPositionByMouseMove(event)
    onMouseMove?.(event)

    mouseMoveEndInner(event)
  }
  const onMouseUpInner = (event: MouseEvent) => {
    recordMousePositionByMouseUp(event)
    onMouseUp?.(event)
  }
  const onMouseDownInner = (event: MouseEvent) => {
    onMouseDown?.(event)
  }
  const bindEvent = () => {
    document.addEventListener('mousemove', onMouseMoveInner)
    document.addEventListener('mouseup', onMouseUpInner)
    document.addEventListener('mousedown', onMouseDownInner)
    eventBinded.value = true
  }

  const unbindEvent = () => {
    document.removeEventListener('mousemove', onMouseMoveInner)
    document.removeEventListener('mouseup', onMouseUpInner)
    document.removeEventListener('mousedown', onMouseDownInner)
    eventBinded.value = false
  }
  if (immediate) {
    onMounted(bindEvent)
    onBeforeUnmount(unbindEvent)
  }
  return {
    bindEvent,
    unbindEvent,
    eventBinded,
    currentMousePosition,
    lastMouseClickPosition,
    getCurrentMousePosition,
    getLastMouseClickPosition,
  }
}
