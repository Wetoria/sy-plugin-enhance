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
          <slot name="title">
            {{ title || '叶归' }}
          </slot>
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
          <slot name="title">
            {{ title || '叶归' }}
          </slot>
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
import { EnDockMap, EnDockType, getEnDockType } from '@/components/EnDock/EnDock'
import EnDrawer from '@/components/EnDrawer.vue'
import { usePlugin } from '@/main'
import EnSettingsItemAreaHeading from '@/modules/Settings/EnSettingsItemAreaHeading.vue'
import {
  computed,
  ref,
  watch
} from 'vue'

const props = defineProps<{
  type: EnDockType
  title?: string
}>()


const emits = defineEmits<{
  scroll: [event: Event]
}>()

const plugin = usePlugin()


const drawerContainerRef = ref<HTMLDivElement>()



const handleScroll = (event) => {
  emits('scroll', event)
}



const dockType = computed(() => {
  return `EnDock_${props.type}`
})

// #region 👇 从 DockManger 里取出相关对象

const dock = EnDockMap[getEnDockType(props.type)]
const dockOpen = computed(() => {
  return dock.value?.open
})
const dockElement = computed(() => {
  return dock.value?.custom?.element
})

// #endregion 👆 从 DockManger 里取出相关对象


const open = defineModel<boolean>('open', { required: false })

let updateByModelValue = false
let updateByDockManager = false
// 绑定 open 状态
watch(dockOpen, () => {
  console.log('dock.value?.open, is ', dockOpen.value)
  if (updateByModelValue) {
    updateByModelValue = false
    return
  }

  updateByDockManager = true
  open.value = dockOpen.value
})


watch(open, () => {
  console.log('open', open.value)
  if (updateByDockManager) {
    updateByDockManager = false
    return
  }
  if (open.value) {
    updateByModelValue = true
    openDock()
  }
}, {
  immediate: true,
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
