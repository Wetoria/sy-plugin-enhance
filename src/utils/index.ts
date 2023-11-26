import { createApp } from 'vue';

export function loadComponent(component) {
  const div = document.createElement('div');
  const app = createApp(component);
  document.body.appendChild(div);
  app.mount(div);
}
