import { registerAllComponents } from '@/components';
import {
  jumpToNextDailyNote,
  jumpToPrevDailyNote,
} from "./utils/DailyNoteHelper";
import VPlugin from '.';
import 'vconsole/dist/vconsole.min.js';
import vConsole from 'vconsole'

import MobileNavVue from './components/MobileNav.vue';
import { getDomByVueComponent } from './utils';
import { registerProtyleBottomArea } from './utils/DOM';

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


export function init(plugin: VPlugin) {
  usePlugin(plugin);
  registerAllComponents();
  addCommand();
  loadMobileNav();
  registerProtyleBottomArea()
  if (plugin.isMobile) {
    // new vConsole()
  }
}
