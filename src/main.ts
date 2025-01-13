
import SyIcon from '@/components/SiyuanTheme/SyIcon.vue'
import {
  createApp,
  reactive,
} from 'vue'

import VPlugin from '.'
import AppVue from './App.vue'

export function usePlugin() {
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
  loadVueApp()
}

export function destroy() {
  app?.unmount()
}
