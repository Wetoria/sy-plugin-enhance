<template>
  <Teleport
    v-if="entryRef"
    :to="entryRef"
  >
    <EnIconLeaf2 v-if="!settings.v" />
    <EnIconDragon v-else-if="settings.v === 1" />
    <svg v-else>
      <use xlink:href="#iconSuper"></use>
    </svg>
  </Teleport>
</template>

<script setup lang="ts">
import EnIconDragon from '@/components/EnIconDragon.vue'
import EnIconLeaf2 from '@/components/EnIconLeaf2.vue'
import { usePlugin } from '@/main'
import { injectSettings } from '@/modules/EnModuleControl/ModuleProvide'
import {
  onMounted,
  ref,
} from 'vue'

const settings = injectSettings()

const entryRef = ref<HTMLElement>(window.SEP_GLOBAL.topBarEntryRef)

const registerTopBar = () => {
  if (entryRef.value) {
    return
  }
  const plugin = usePlugin()
  const el = plugin.addTopBar({
    icon: "iconEnLeaf",
    title: plugin.i18n.pluginName,
    position: "right",
    callback: () => {
      window.SEP_GLOBAL.functions.entryOpenSettings?.()
    },
  }) as HTMLDivElement
  window.SEP_GLOBAL.topBarEntryRef = entryRef.value = el
}
onMounted(() => {
  registerTopBar()
})
</script>

<style lang="scss">
html[data-en_enabled_module~="En_Plugin_Enabled"] {

  .toolbar__item[aria-label="叶归"] {

    & svg:first-child {
      display: none;
    }
  }
}
</style>
