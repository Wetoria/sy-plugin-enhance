<template>
  <EnDrawer
    v-if="plugin.isMobile"
    v-model:visible="open"
    class="EnDockMobile"
    :class="dockType"
    :scrollTarget="drawerContainerRef"
    @cancel="close"
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
    v-if="open && (drawerContainerRef || dockAreaElementRef)"
    :to="plugin.isMobile ? drawerContainerRef : dockAreaElementRef"
  >
    <div
      class="en_dock_container"
    >
      <div class="EnDockHeader" v-if="!plugin.isMobile">
        <EnSettingsItemAreaHeading>
          {{ title }}
        </EnSettingsItemAreaHeading>
      </div>
      <div class="EnDockContent">
        <slot></slot>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import EnDrawer from '@/components/EnDrawer.vue'
import { usePlugin } from '@/main'
import EnSettingsItemAreaHeading from '@/modules/Settings/EnSettingsItemAreaHeading.vue'
import { generateShortUUID } from '@/utils'
import { useStorage } from '@vueuse/core'
import { Custom } from 'siyuan'
import { computed, onMounted, ref, watch } from 'vue'

const props = defineProps<{
  type?: string
  icon?: string
  title?: string
  autoOpen?: boolean
}>()


const open = defineModel<boolean>('open', { required: false })
watch(open, (newValue, oldValue) => {
  if (props.autoOpen && newValue && !oldValue) {
    openDock()
  }
})
const close = () => {
  open.value = false
}

const openDock = () => {
  // 移动端不打开 dock
  if (plugin.isMobile) {
    return
  }
  const name = `${plugin.name}_${dockType.value}`
  const dockItem = document.querySelector(`.dock__item[data-type="${name}"]`) as HTMLElement
  if (!dockItem) {
    return
  }
  dockItem.click()
}

const emits = defineEmits<{
  (e: 'init', dock: Custom): void
  (e: 'resize', dock: Custom): void
  (e: 'destroy', dock: Custom): void
  (e: 'update', dock: Custom): void
}>()


const plugin = usePlugin()

const dockAreaElementRef = ref<HTMLElement>()

const syDockRef = ref<Custom>(null)
const dockType = computed(() => {
  return props.type ? `EnDock_${props.type}` : `EnDock_${generateShortUUID()}`
})

const drawerContainerRef = ref<HTMLDivElement>()
const dockTypeStorage = props.type ? useStorage(dockType.value, {
  width: 300,
}) : ref({
  width: 300
})

onMounted(() => {
  if (!plugin.isMobile) {
    // 添加叶归侧边栏
    plugin.addDock({
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
      init() {
        syDockRef.value = this as any as Custom
        dockAreaElementRef.value = this.element
        emits('init', this as any as Custom)
      },
      resize() {
        syDockRef.value = this as any as Custom
        const rect = this.element.getBoundingClientRect()
        const isOpened = rect.width > 0
        open.value = isOpened
        if (isOpened) {
          dockTypeStorage.value.width = rect.width
        }
        emits('resize', this as any as Custom)
      },
      update() {
        syDockRef.value = this as any as Custom
        emits('update', this as any as Custom)
      },
      destroy() {
        emits('destroy', this as any as Custom)
        syDockRef.value = null
      },
    })
  }
})
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
}
</style>

<style lang="scss">
.EnDockMobile {

  .arco-drawer {
    background-color: var(--b3-theme-background);
  }
}
</style>
