<template>
  <Teleport
    v-if="visible && tabContainerRef"
    :to="tabContainerRef"
  >
    <div class="EnSyTabContainer">
      <slot>叶归自定义页签</slot>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { usePlugin } from '@/main';
import { Custom, openTab, Tab } from 'siyuan';
import { computed, onBeforeUnmount, ref, watch } from 'vue';


const props = defineProps<{
  // 用于区分每一个 tab 的 id
  // 每一个打开的 tab，都需要一个自己单独的 id
  name: string
  // 页签的标题
  title: string
  // 页签的图标
  icon?: string
  // 页签的默认位置
  // 不传入时，默认当前区域打开
  // right，右侧分屏打开
  // bottom，底部分屏打开
  defaultPosition?: 'right' | 'bottom'
}>()

const emits = defineEmits<{
  // tab 被初始化时触发的事件
  // 一般不需要使用
  (e: 'init', custom: Custom): void
  // tab 被打开时触发的事件
  (e: 'opened'): void
  // tab 被 resize 时触发的事件
  (e: 'resize', custom: Custom): void
  // tab 被关闭前触发的事件
  (e: 'beforeClose'): void
  // tab 被关闭时触发的事件
  (e: 'closed'): void
}>()

const plugin = usePlugin()
const visible = defineModel<boolean>('visible')

const tabId = computed(() => {
  return `${plugin.name}_${props.name}`
})

const openedTabRef = ref<Tab>(null)
const tabContainerRef = ref<HTMLElement>()

const destroyTab = () => {
  // @ts-ignore
  delete plugin.models[tabId.value]
  tabContainerRef.value = null
  openedTabRef.value = null
  visible.value = false
  emits('closed')
}

const open = (options: {
  position?: 'right' | 'bottom'
} = {}) => {
  const {
    position = props.defaultPosition,
  } = options
  plugin.addTab({
    type: `_${props.name}`,
    init() {
      tabContainerRef.value = this.element as HTMLElement
      emits('init', this)
    },
    resize() {
      // console.log('resize')
      emits('resize', this)
    },
    // 在思源源码里，update 好像没看到有触发的地方
    update() {

    },
    beforeDestroy() {
      // console.log('beforeDestroy')
      emits('beforeClose')
    },
    destroy() {
      destroyTab()
    },
  })
  openTab({
    app: plugin.app,
    custom: {
      icon: props.icon,
      title: props.title || '叶归',
      data: {
      },
      id: tabId.value,
    },
    position,
    afterOpen: (...args) => {
      visible.value = true
      emits('opened', ...args)
    },
  }).then((tab) => {
    openedTabRef.value = tab
    visible.value = true
  })
}

const close = () => {
  openedTabRef.value?.close()
}

// 可在父组件手动调用 open 和 close 方法
defineExpose({
  open,
  close,
})


watch(visible, (newVal) => {
  if (newVal) {
    open()
  } else {
    close()
  }
})

onBeforeUnmount(() => {
  close()
})
</script>

<style scoped lang="scss">
.EnSyTabContainer {
  width: 100%;
  height: 100%;
  background-color: var(--b3-theme-background);
}
</style>