import { DebouncedFunc } from 'lodash-es'
import {
  onBeforeUnmount,
} from 'vue'

export function useObserver(props: {
  target: HTMLElement
  callback: () => void | DebouncedFunc<() => void>
  options?: MutationObserverInit
}) {
  const {
    target = document.documentElement,
    callback,
    options = {
      childList: true,
      subtree: true,
      attributes: true,
    },
  } = (props || {})
  let observer: MutationObserver | null = null
  const observe = () => {
    if (!callback) {
      return
    }
    if (observer) {
      observer.disconnect()
      observer = null
    }
    observer = new MutationObserver(callback)
    observer.observe(target, options)
  }
  const unobserve = () => {
    // 防止是 debounce 的 callback，然后没有 cancel
    if (callback) {
      (callback as DebouncedFunc<() => void>).cancel?.()
    }
    if (observer) {
      observer?.disconnect()
      observer = null
    }
  }
  onBeforeUnmount(() => {
    unobserve()
  })
  return {
    observer,
    observe,
    unobserve,
  }
}
