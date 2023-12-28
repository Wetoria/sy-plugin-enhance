import VPlugin from '.';

import { clearAllVueComponents, getDomByVueComponent, loadComponentAppendToBody, openSetting } from './utils';
import { registerProtyleBottomArea } from './utils/DOM';

import MobileNavVue from './components/MobileNav.vue';
import AppVue from './App.vue';


let plugin: VPlugin = null
export function usePlugin(pluginProps?) {
  if (pluginProps) {
    plugin = pluginProps
  }
  if (!plugin && !pluginProps) {
    console.error('need bind plugin')
  }
  return plugin;
}

function loadMobileNav() {
  const plugin = usePlugin()
  if (!plugin.isMobile) {
    return
  }
  const dom = getDomByVueComponent(MobileNavVue)
  const editor = document.querySelector('#editor')
  const observer = new MutationObserver(() => {
    const navDom = editor.querySelector('.MobileNavContainer')

    if (navDom) {
      return
    }

    if (editor) {
      editor.appendChild(dom)
    }
  });
  if (editor) {
    observer.observe(editor, {
      childList: true, // 观察目标子节点的变化，是否有添加或者删除
      subtree: true, // 观察后代节点，默认为 false
    })
  }
}

const loadVueApp = () => {
  loadComponentAppendToBody(AppVue)
}

export function init(plugin: VPlugin) {
  usePlugin(plugin);
  loadVueApp()
  registerProtyleBottomArea()
}

export function destroy() {
  clearAllVueComponents()
}
