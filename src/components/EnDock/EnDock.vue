<template>
  <EnDrawer
    v-if="plugin.isMobile"
    v-model:visible="open"
    class="EnDockMobile"
    :class="dockType"
    :scrollTarget="drawerContainerRef"
    @cancel="closeDrawer"
  >
    <template #title>
      <div>
        <EnSettingsItemAreaHeading>
          {{ title }}
        </EnSettingsItemAreaHeading>
      </div>
    </template>
    <div
      ref="drawerContainerRef"
      class="en_dock_container"
    >
    </div>
  </EnDrawer>
  <Teleport
    v-if="open && (drawerContainerRef || dockElement)"
    :to="plugin.isMobile ? drawerContainerRef : dockElement"
  >
    <div
      class="en_dock_container"
      :class="dockType"
    >
      <div
        v-if="!plugin.isMobile"
        class="EnDockHeader"
      >
        <EnSettingsItemAreaHeading>
          {{ title }}
        </EnSettingsItemAreaHeading>
      </div>
      <div
        class="EnDockContent"
        @scroll="handleScroll"
      >
        <slot></slot>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { addDock } from '@/components/EnDock/EnDock'
import EnDrawer from '@/components/EnDrawer.vue'
import { usePlugin } from '@/main'
import EnSettingsItemAreaHeading from '@/modules/Settings/EnSettingsItemAreaHeading.vue'
import { targetIsInnerOf } from '@/utils/DOM'
import { useStorage } from '@vueuse/core'
import { Custom } from 'siyuan'
import {
  computed,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
  watchEffect,
} from 'vue'

const props = defineProps<{
  type: string
  icon?: string
  title?: string
  autoOpen?: boolean
}>()


const emits = defineEmits<{
  scroll: [event: Event]
}>()

const plugin = usePlugin()

let clicked = false
const open = defineModel<boolean>('open', { required: false })
watch(open, (newValue) => {
  if (props.autoOpen && newValue && !clicked) {
    openDock()
  }
})
const closeDrawer = () => {
  open.value = false
}

const clickDockItem = () => {
  // 移动端不打开 dock
  if (plugin.isMobile) {
    return
  }
  const key = `${plugin.name}_${dockType.value}`
  const dockItem = document.querySelector(`.dock__item[data-type="${key}"]`) as HTMLElement
  if (!dockItem) {
    return
  }
  dockItem.click()
}

const openDock = () => {
  clickDockItem()
}

// 卸载时如果打开了 dock，则点击一次，关闭 dock
onBeforeUnmount(() => {
  if (open.value) {
    clickDockItem()
  }
})

const recordClickDockItem = (event) => {
  const target = event.target as HTMLElement
  const key = `${plugin.name}_${dockType.value}`
  const clickedId = targetIsInnerOf(target, (target) => {
    return target.dataset.type === key
  })
  if (clickedId) {
    clicked = true
    setTimeout(() => {
      clicked = false
    }, 1000)
  }
}

onMounted(() => {
  document.addEventListener('click', recordClickDockItem)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', recordClickDockItem)
})




const dock = ref<{
  dockRef: Custom
  open: boolean
  width: number
}>({
  dockRef: null,
  open: false,
  width: 0,
})
const dockElement = computed(() => {
  return dock.value?.dockRef?.element
})

const dockType = computed(() => {
  return `EnDock_${props.type}`
})

const drawerContainerRef = ref<HTMLDivElement>()
const dockTypeStorage = useStorage(dockType.value, {
  width: 300,
})
watchEffect(() => {
  if (dock.value.open) {
    dockTypeStorage.value.width = dock.value.width
  }
  open.value = dock.value.open
})

onMounted(() => {
  if (!plugin.isMobile && props.type) {

    dock.value = addDock({
      type: `_${dockType.value}`,
      config: {
        position: 'RightTop',
        size: {
          width: dockTypeStorage.value.width,
          height: 0,
        },
        icon: props.icon || 'iconEnLeaf2',
        title: props.title || '叶归',
      },
      data: {},
    })
  }
})


const handleScroll = (event) => {
  emits('scroll', event)
}
</script>

<style lang="scss" scoped>

.en_dock_container {
  width: 100%;
  height: 100%;
  overflow: hidden;
  background-color: var(--b3-theme-background);

  display: flex;
  flex-direction: column;

  .EnDockContent {
    flex: 1;
    overflow-x: hidden;
    overflow-y: auto;
  }
}

.EnDockHeader {
  padding: 6px 12px;
  display: flex;
  align-items: center;
  border-bottom: 1px solid var(--b3-border-color);
  min-height: 30px;
}
</style>

<style lang="scss">
.EnDockMobile {

  .arco-drawer {
    background-color: var(--b3-theme-background);
  }
}
</style>
