import { registerAllComponents } from '@/components';
import { createApp } from 'vue';

export function loadComponent(component) {
  const div = document.createElement('div');
  const app = createApp(component);
  document.body.appendChild(div);
  app.mount(div);
}

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
