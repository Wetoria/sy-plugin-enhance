import VPlugin from '.';

import { clearAllVueComponents, loadComponentAppendToBody } from './utils';
import { registerProtyleBottomArea } from './utils/DOM';

import AppVue from './App.vue';

let pluginRef: VPlugin = null
export function registerPlugin(plugin) {
  pluginRef = plugin
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
