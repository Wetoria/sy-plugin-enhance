<template>
  <Teleport
    :to="entryRef"
    v-if="entryRef"
  >
    <svg>
      <use :xlink:href="`#${!settings.isPro ? 'iconHeart' : 'iconVIP'}`"></use>
    </svg>
  </Teleport>
</template>

<script setup lang="ts">
import { usePlugin } from '@/main';
import { openSettings, switchProStatus, useSettings } from '@/modules/Settings/EnSettings.vue';
import { onCountClick } from '@/utils/DOM';
import { onMounted, ref } from 'vue';

const settings = useSettings()

const entryRef = ref<HTMLDivElement>()

const registerTopBar = () => {
  const plugin = usePlugin()
  const el = plugin.addTopBar({
    icon: "iconHeart",
    title: plugin.i18n.pluginName,
    position: "right",
    callback: onCountClick((time) => {
      if (time >= 11) {
        switchProStatus()
      } else {
        openSettings()
      }
    }),
  }) as HTMLDivElement;
  el.innerHTML = ''
  entryRef.value = el
}
onMounted(() => {
  registerTopBar()
})

</script>

<style lang="scss" scoped>

</style>
