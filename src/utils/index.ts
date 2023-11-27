import { createApp } from 'vue';
import ArcoVue from '@arco-design/web-vue';
import '@arco-design/web-vue/dist/arco.css';

export function loadComponent(component) {
  const div = document.createElement('div');
  const app = createApp(component);
  document.body.appendChild(div);
  app.mount(div);
}

export function getDomByVueComponent(component, useArco?: boolean) {
  const div = document.createElement('div');
  const app = createApp(component);
  if (useArco) {
    app.use(ArcoVue);
  }
  app.mount(div);
  return div;
}
