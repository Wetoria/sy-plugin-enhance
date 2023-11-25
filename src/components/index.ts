import { loadComponent } from '@/utils';

import FixedTools from './FixedTools/index.vue';

export function registerAllComponents() {
  const components = [
    FixedTools,
  ];

  components.forEach((item) => {
    loadComponent(item);
  })
}
