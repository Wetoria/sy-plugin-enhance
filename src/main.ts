import { registerAllComponents } from '@/components';
import {
  jumpToNextDailyNote,
  jumpToPrevDailyNote,
} from "./utils/DailyNoteHelper";

let plugin = null
export function usePlugin(pluginProps?) {
  if (pluginProps) {
    plugin = pluginProps
  }
  if (!plugin && !pluginProps) {
    console.error('need bind plugin')
  }
  return plugin;
}


const addCommand = (plugin) => {
  plugin.addCommand({
    langKey: "goPrevDailyNote",
    hotkey: "⌥⌘↓",
    callback: () => {
      jumpToPrevDailyNote();
    },
  });
  plugin.addCommand({
    langKey: "goNextDailyNote",
    hotkey: "⌥⌘↑",
    callback: () => {
      jumpToNextDailyNote();
    },
  });
}


export function init(plugin) {
  usePlugin(plugin);
  registerAllComponents();
  addCommand(plugin);
}
