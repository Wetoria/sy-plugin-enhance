import { usePlugin } from '@/main';
import { onEditorUpdate } from '@/utils/Siyuan';
import { watchEffect } from 'vue';
import { useEnhancer } from './GlobalStatus';
import { useSettings } from './Settings';

export function autoSync() {
  return
  const settings = useSettings()

  const plugin = usePlugin()
  const state = useEnhancer()

  let needSync: HTMLDivElement = null
  watchEffect(() => {
    if (!state.value.isSync && needSync) {
      needSync.click()
      needSync = null
    }
  })
  const startSync = () => {
    const dom = document.body.querySelector(plugin.isMobile ? '#menuSyncNow' : '#barSync') as HTMLDivElement
    if (!dom) {
      console.warn('调用同步功能失败：未找到同步按钮。')
      return
    }

    if (!state.value.isSync) {
      dom.click();
    } else {
      needSync = dom
    }
  }

  let firedByEnter = false
  const enterPressListener = (event) => {
    if (event.key !== 'Enter') {
      return
    }
    firedByEnter = true
    startSync()
  }

  let registered = false

  let destroyEvent = null
  const init = () => {
    if (registered) {
      return
    }
    destroyEvent = onEditorUpdate(() => {
      if (firedByEnter) {
        firedByEnter = false
        return
      }
      startSync()
    }, 2000)

    document.body.addEventListener('keydown', enterPressListener, true)
    registered = true
  }
  const destroy = () => {
    if (destroyEvent) {
      destroyEvent()
    }
    document.body.removeEventListener('keydown', enterPressListener)
    registered = false
  }

  watchEffect(() => {
    if (settings.value.enableAutoSync) {
      init()
    } else {
      destroy()
    }
  })
}
