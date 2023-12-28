import { ref } from 'vue'

const ViewportInfo = ref({
  top: 0,
  left: 0,
  width: 0,
  height: 0,
  scale: 1,
})
export function useViewportInfo() {
  return ViewportInfo
}

function updateViewportInfo(target: VisualViewport) {
  ViewportInfo.value = {
    top: target.offsetTop,
    left: target.offsetLeft,
    width: target.width,
    height: target.height,
    scale: target.height,
  }
}

export function listenerViewport() {
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', (event) => {
      const target = event.target as VisualViewport
      updateViewportInfo(target)
    })
    window.visualViewport.addEventListener('scroll', (event) => {
      const target = event.target as VisualViewport
      updateViewportInfo(target)
    })
  }
}
