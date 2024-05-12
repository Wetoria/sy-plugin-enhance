<template>
  <Teleport
    :to="entryRef"
    v-if="entryRef"
  >
    <use :xlink:href="`#${['iconHeart', 'iconVIP', 'iconSuper'][settings.v]}`"></use>
  </Teleport>
</template>

<script setup lang="ts">
import { usePlugin } from '@/main';
import { entryOpenSettings, useSettings } from '@/modules/Settings/EnSettings.vue';
import { onMounted, ref } from 'vue';

const settings = useSettings()

const entryRef = ref<HTMLOrSVGElement>()

const registerTopBar = () => {
  const plugin = usePlugin()
  const el = plugin.addTopBar({
    icon: "iconHeart",
    title: plugin.i18n.pluginName,
    position: "right",
    callback: entryOpenSettings,
  }) as HTMLDivElement;
  const svgEl = el.querySelector('svg')
  if (!svgEl) {
    return
  }
  svgEl.innerHTML = ''
  entryRef.value = svgEl
}
onMounted(() => {
  registerTopBar()
})

</script>

<style lang="scss" scoped>

</style>
