import {
  jumpToNextDailyNote,
  jumpToPrevDailyNote,
} from "./utils/DailyNoteHelper";
import VPlugin from '.';

import { clearAllVueComponents, getDomByVueComponent, loadComponent, openSetting } from './utils';
import { registerProtyleBottomArea } from './utils/DOM';

import MobileNavVue from './components/MobileNav.vue';
import AppVue from './App.vue';
import { useEnhancer } from './logic/GlobalStatus';


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


const addCommand = () => {
  const plugin = usePlugin()
  plugin.addCommand({
    langKey: "goPrevDailyNote",
    hotkey: "⌥⌘↑",
    callback: () => {
      jumpToPrevDailyNote();
    },
  });
  plugin.addCommand({
    langKey: "goNextDailyNote",
    hotkey: "⌥⌘↓",
    callback: () => {
      jumpToNextDailyNote();
    },
  });
}

const addTopBar = () => {
  const plugin = usePlugin()
  plugin.addTopBar({
    icon: "iconSuper",
    title: plugin.i18n.pluginName,
    position: "right",
    callback: () => {
      openSetting()
    },
  });
}

const loadVueApp = () => {
  loadComponent(AppVue)
}

export function init(plugin: VPlugin) {
  usePlugin(plugin);
  loadVueApp()
  addCommand();
  loadMobileNav();
  registerProtyleBottomArea()
  addTopBar()

  const state = useEnhancer()
  plugin.eventBus.on('sync-start', () => {
    state.value.isSync = true
  })
  plugin.eventBus.on('sync-end', () => {
    state.value.isSync = false
  })
  plugin.eventBus.on('sync-fail', () => {
    state.value.isSync = false
  })
}

export function destroy() {
  clearAllVueComponents()
}
