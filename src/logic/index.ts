import { usePlugin } from '@/main';
import { debounce } from '@/utils';
import { SyDomNodeTypes, onEditorUpdate } from '@/utils/Siyuan';
import { watchEffect } from 'vue';
import { useEnhancer } from './GlobalStatus';
import { queryAllByDom } from '@/utils/DOM';
import dayjs from 'dayjs';
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

export function insertBlockTime() {
  const insertBlockTime = () => {
    const paragraphList = queryAllByDom(document.body, `[data-type="${SyDomNodeTypes.NodeParagraph}"]`)
    paragraphList.forEach((dom: HTMLDivElement) => {
      const updateTimeStr = dom.getAttribute('updated')
      if (!updateTimeStr) {
        return
      }
      if (updateTimeStr == dom.dataset.enUpdatedBackup) {
        return
      }
      const updated = dayjs(updateTimeStr)

      dom.dataset.enUpdatedBackup = updateTimeStr
      dom.dataset.enUpdated = updated.format('YYYY/MM/DD HH:mm:ss')
      dom.dataset.enUpdatedFormat = '    /  /     :  :  '
    })
  }

  insertBlockTime()
  const observer = new MutationObserver(debounce(insertBlockTime, 100));
  observer.observe(document.documentElement, {
    childList: true, // 观察目标子节点的变化，是否有添加或者删除
    subtree: true, // 观察后代节点，默认为 false
    attributes: true,
  })
}
