import { Plugin } from 'siyuan'
import { createApp } from 'vue'
import EnDockVue from './EnLeafPanel.vue'

const DOCK_TYPE = 'sy_plugin_enhance_dock'

export function initDock(plugin: Plugin) {
  // 注册叶子图标
  plugin.addIcons(`
    <symbol id="iconEnLeaf2" viewBox="0 0 1024 1024">
      <path d="M265.344 790.016s291.2 22.016 392.896-101.632c101.632-123.648 68.672-258.24 112.64-392.896 43.968-134.592 156.608-214.272 167.616-214.272 10.944 0-439.616-43.968-629.12 90.624-82.496 57.728-148.416 115.392-164.864 255.552-16.512 140.096 52.16 296.704 27.456 409.344C147.2 949.376 128 971.328 128 971.328l54.976 11.008s43.904-68.672 43.904-156.608c0-87.872 11.008-258.24 167.616-414.848s269.248-178.56 269.248-178.56-145.6 54.912-258.24 203.264c-112.64 148.416-140.16 354.432-140.16 354.432z"></path>
    </symbol>
  `)

  // 添加叶归侧边栏
  plugin.addDock({
    type: DOCK_TYPE,
    config: {
      position: 'RightTop',
      size: {
        width: 200,
        height: 200,
      },
      icon: 'iconEnLeaf2',
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
