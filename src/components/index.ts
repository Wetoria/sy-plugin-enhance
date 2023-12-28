import { loadComponentAppendToBody } from '@/utils';

import FixedTools from './FixedTools.vue';

export function registerAllComponents() {
  const components = [
    FixedTools,
  ];

  components.forEach((item) => {
    loadComponentAppendToBody(item);
  })
}
