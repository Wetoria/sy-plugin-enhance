import { createApp } from 'vue';

export function loadComponent(component) {
  const div = document.createElement('div');
  const app = createApp(component);

  // div.style.width = '100px';
  // div.style.height = '100px';
  // div.style.position = 'fixed';
  // div.style.top = '50%';
  // div.style.left = '50%';
  // div.style.backgroundColor = 'red';

  document.body.appendChild(div);
  app.mount(div);
}
