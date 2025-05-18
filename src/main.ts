
import SyIcon from '@/components/SiyuanTheme/SyIcon.vue'
import { useSiyuanEvent } from '@/utils/EventBusHooks'

import { registerDock } from '@/components/EnDock/EnDock'
import {
  createApp,
  reactive,
} from 'vue'
import VPlugin from '.'
import AppVue from './App.vue'

export function usePlugin(): VPlugin {
  return window.SEP_GLOBAL.pluginRef
}

let app = null
function loadVueApp() {
  const div = document.createElement('div')
  div.id = 'enApp'
  app = createApp(AppVue)
  app.component('SyIcon', SyIcon)
  app.mount(div)
  document.body.appendChild(div)
}

export async function init(plugin: VPlugin) {
  window.SEP_GLOBAL.pluginRef = reactive(plugin)
  registerDock()
  loadVueApp()
  useSiyuanEvent('lock-screen', () => {
    destroy()
  })
}

export function destroy() {
  app?.unmount()
}
