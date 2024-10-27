import { onBeforeUnmount, onMounted, ref } from 'vue';
import { debounce } from '.';

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
  onMouseMoveStart?: (event: Event) => void
  onMouseMove?: (event: Event) => void
  onMouseMoveEnd?: (event: Event) => void
  onMouseUp?: (event: Event) => void
  onMouseDown?: (event: Event) => void
}) {
  const {
    onMouseMove,
    onMouseUp,
    onMouseDown,
    onMouseMoveStart,
    onMouseMoveEnd,
  } = props
  let mouseMoveFlag = false

  // 停止移动鼠标500ms后，触发结束事件
  const mouseMoveEndInner = debounce((event: Event) => {
    mouseMoveFlag = false
    onMouseMoveEnd?.(event)
  }, 500)

  const onMouseMoveInner = (event: Event) => {
    if (!mouseMoveFlag) {
      onMouseMoveStart?.(event)
      mouseMoveFlag = true
    }
    recordMouseCurrentPositionByMouseMove(event)
    onMouseMove?.(event)

    mouseMoveEndInner(event)
  }
  const onMouseUpInner = (event: Event) => {
    recordMousePositionByMouseUp(event)
    onMouseUp?.(event)
  }
  const onMouseDownInner = (event: Event) => {
    onMouseDown?.(event)
  }
  onMounted(() => {
    document.addEventListener('mousemove', onMouseMoveInner)
    document.addEventListener('mouseup', onMouseUpInner)
    document.addEventListener('mousedown', onMouseDownInner)
  })
  onBeforeUnmount(() => {
    document.removeEventListener('mousemove', onMouseMoveInner)
    document.removeEventListener('mouseup', onMouseUpInner)
    document.removeEventListener('mousedown', onMouseDownInner)
  })
  return {
    currentMousePosition,
    lastMouseClickPosition,
    getCurrentMousePosition,
    getLastMouseClickPosition,
  }
}
