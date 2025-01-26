import { Plugin } from 'siyuan'
import { createApp } from 'vue'
import EnDockVue from './EnLeafPanel.vue'

const DOCK_TYPE = 'sy_plugin_enhance_dock'

export function initDock(plugin: Plugin) {
  // 添加叶归侧边栏
  plugin.addDock({
    type: DOCK_TYPE,
    config: {
      position: 'RightTop',
      size: {
        width: 200,
        height: 200,
      },
      icon: 'iconEnLeaf',
      title: '叶归',
    },
    data: {
      plugin,
    },
    resize() {
      console.log(`${DOCK_TYPE} resize`)
    },
    init() {
      const app = createApp(EnDockVue)
      const container = document.createElement('div')
      this.element.appendChild(container)
      app.mount(container)
    },
    destroy() {
      console.log("destroy dock:", DOCK_TYPE)
    },
  })
}
