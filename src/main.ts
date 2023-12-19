import { registerAllComponents } from '@/components';
import {
  jumpToNextDailyNote,
  jumpToPrevDailyNote,
} from "./utils/DailyNoteHelper";
import VPlugin from '.';

import {
  Menu,
} from "siyuan";

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

const addMenu = (rect?: DOMRect) => {
  const plugin = usePlugin()
  const menu = new Menu("SyEnhance", () => {
  });
  menu.addItem({
    label: "Open Doc Window(open help first)",
    click: () => {},
  });
  if (plugin.isMobile) {
    menu.fullscreen();
  } else {
    menu.open({
      x: rect.right,
      y: rect.bottom,
      isLeft: true,
    });
  }
}

const addTopBar = () => {
  const plugin = usePlugin()
  const topBarElement = plugin.addTopBar({
    icon: "iconVIP",
    title: plugin.i18n.addTopBarIcon,
    position: "right",
    callback: () => {
      if (plugin.isMobile) {
        addMenu();
      } else {
        let rect = topBarElement.getBoundingClientRect();
        // 如果被隐藏，则使用更多按钮
        if (rect.width === 0) {
          rect = document.querySelector("#barMore").getBoundingClientRect();
        }
        if (rect.width === 0) {
          rect = document
            .querySelector("#barPlugins")
            .getBoundingClientRect();
        }
        addMenu(rect);
      }
    },
  });
}


export function init(plugin: VPlugin) {
  usePlugin(plugin);
  registerAllComponents();
  addCommand();
  loadMobileNav();
  registerProtyleBottomArea()
  addTopBar()
}
