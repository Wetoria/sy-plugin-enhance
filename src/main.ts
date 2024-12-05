import { reactive } from 'vue'

import VPlugin from '.'
import AppVue from './App.vue'

import { loadSettings } from './modules/Settings/EnSettings.vue'
import {
  loadModuleData_EnVideoAndAudioBlockPlay,
} from './modules/VideoAndAudio/EnVideoAndAudioBlockPlay.vue'
import {
  clearAllVueComponents,
  loadComponentAppendToBody,
} from './utils'
import { registerProtyleBottomArea } from './utils/DOM'
import { initWebsocket } from './utils/SyncData'

let pluginRef: VPlugin = null
export function registerPlugin(plugin) {
  pluginRef = reactive(plugin)

  window.en_plugin = pluginRef
}
export function usePlugin() {
  return pluginRef
}

function loadVueApp() {
  loadComponentAppendToBody(AppVue)
}

async function loadModuleDataBeforeApp() {
  await loadModuleData_EnVideoAndAudioBlockPlay()
}

export async function init(plugin: VPlugin) {
  registerPlugin(plugin)
  await initWebsocket()
  await loadSettings()
  await loadModuleDataBeforeApp()
  loadVueApp()
  registerProtyleBottomArea()
}

export function destroy() {
  clearAllVueComponents()
}
