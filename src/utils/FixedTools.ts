import { createApp } from 'vue';
import App from '../App.vue';

export function newDailyNoteQuicker(plugin) {
  const div = document.createElement('div');
  const app = createApp(App);
  div.classList.toggle('v-ewDailyNoteQuicker', true);

  document.body.appendChild(div);
  app.mount(div);
}
