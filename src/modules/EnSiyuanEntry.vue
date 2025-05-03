<template>

</template>

<script setup lang="ts">
import { usePlugin } from '@/main'
import { injectSettings } from '@/modules/EnModuleControl/ModuleProvide'
import { EN_EVENT_BUS_KEYS } from '@/utils/Constants'
import { enEventBus } from '@/utils/EnEventBus'
import {
  onBeforeUnmount,
  onMounted,
  ref,
  watchEffect,
} from 'vue'

const settings = injectSettings()

const plugin = usePlugin()

const entryRef = ref<HTMLElement>(window.SEP_GLOBAL.topBarEntryRef)

watchEffect(() => {
  if (entryRef.value) {
    const target = entryRef.value.querySelector('use')
    if (!target) {
      return
    }

    const iconName = !settings.value.v ? 'iconEnLeaf2' : (
      settings.value.v === 1 ? 'iconEnDragon' : 'iconSuper'
    )
    target.setAttribute('xlink:href', `#${iconName}`)
  }
})

onBeforeUnmount(() => {
  const target = entryRef.value.querySelector('use')
  if (!target) {
    return
  }

  target.setAttribute('xlink:href', `#iconEnLeaf`)
})

const registerTopBar = () => {
  if (entryRef.value) {
    return
  }
  const el = plugin.addTopBar({
    icon: "iconEnLeaf",
    title: plugin.i18n.pluginName,
    position: "right",
    callback: () => {
      enEventBus.emit(EN_EVENT_BUS_KEYS.SETTINGS_OPEN_ON_ENTRY)
    },
  }) as HTMLDivElement
  window.SEP_GLOBAL.topBarEntryRef = entryRef.value = el
}
onMounted(() => {
  registerTopBar()
})
</script>

<style lang="scss">

</style>
