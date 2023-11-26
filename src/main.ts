import { registerAllComponents } from '@/components';

let plugin = null
export function usePlugin(pluginProps?) {
  if (!plugin && pluginProps) {
    plugin = pluginProps
  }
  return plugin;
}


export function init(plugin) {
  usePlugin(plugin);
  registerAllComponents();
}
