import VPlugin from '.';

import { clearAllVueComponents, loadComponentAppendToBody } from './utils';
import { registerProtyleBottomArea } from './utils/DOM';

import AppVue from './App.vue';
import { reactive } from 'vue';
import { loadSettings } from './logic/Settings';

let pluginRef: VPlugin = null
export function registerPlugin(plugin) {
  pluginRef = reactive(plugin)
}
export function usePlugin() {
  return pluginRef;
}

const loadVueApp = () => {
  loadComponentAppendToBody(AppVue)
}

export async function init(plugin: VPlugin) {
  registerPlugin(plugin);
  await loadSettings()
  loadVueApp()
  registerProtyleBottomArea()
}

export function destroy() {
  clearAllVueComponents()
}
