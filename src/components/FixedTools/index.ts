import { createApp } from 'vue';
import App from './component.vue';
import { loadComponent } from '@/utils';

export function newDailyNoteQuicker(plugin) {
  loadComponent(App);
}
