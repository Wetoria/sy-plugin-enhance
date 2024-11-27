import VPlugin from '.';

import { clearAllVueComponents, loadComponentAppendToBody } from './utils';
import { registerProtyleBottomArea } from './utils/DOM';

import AppVue from './App.vue';
import { reactive } from 'vue';
import { loadSettings } from './modules/Settings/EnSettings.vue';
import { initWebsocket } from './utils/SyncData';
import { loadModuleData_EnVideoAndAudioBlockPlay } from './modules/VideoAndAudio/EnVideoAndAudioBlockPlay.vue';

let pluginRef: VPlugin = null
export function registerPlugin(plugin) {
  pluginRef = reactive(plugin)

  window.en_plugin = pluginRef
}
export function usePlugin() {
  return pluginRef;
}

const loadVueApp = () => {
  loadComponentAppendToBody(AppVue)
}

const loadModuleDataBeforeApp = async () => {
  await loadModuleData_EnVideoAndAudioBlockPlay()
}

export async function init(plugin: VPlugin) {
  registerPlugin(plugin);
  await initWebsocket()
  await loadSettings()
  await loadModuleDataBeforeApp()
  loadVueApp()
  registerProtyleBottomArea()
}

export function destroy() {
  clearAllVueComponents()
}
