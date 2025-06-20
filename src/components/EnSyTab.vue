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
  name: string
  title: string
  icon?: string
}>()

const emits = defineEmits<{
  (e: 'init', custom: Custom): void
  (e: 'opened'): void
  (e: 'resize', custom: Custom): void
  (e: 'beforeClose'): void
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
    position,
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