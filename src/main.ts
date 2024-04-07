import VPlugin from '.';

import { clearAllVueComponents, loadComponentAppendToBody } from './utils';
import { registerProtyleBottomArea } from './utils/DOM';

import AppVue from './App.vue';
import { reactive } from 'vue';

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

export function init(plugin: VPlugin) {
  registerPlugin(plugin);
  loadVueApp()
  registerProtyleBottomArea()
}

export function destroy() {
  clearAllVueComponents()
}
