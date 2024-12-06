import { reactive } from 'vue'

import VPlugin from '.'
import AppVue from './App.vue'

import {
  loadModuleData_EnVideoAndAudioBlockPlay,
} from './modules/VideoAndAudio/EnVideoAndAudioBlockPlay.vue'
import {
  clearAllVueComponents,
  loadComponentAppendToBody,
} from './utils'
import { registerProtyleBottomArea } from './utils/DOM'

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
  await loadModuleDataBeforeApp()
  loadVueApp()
  registerProtyleBottomArea()
}

export function destroy() {
  clearAllVueComponents()
}
