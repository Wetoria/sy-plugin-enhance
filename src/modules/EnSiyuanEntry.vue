<template>

</template>

<script setup lang="ts">
import { usePlugin } from '@/main';
import { openSettings } from '@/modules/Settings/EnSettings.vue';
import { openSetting } from '@/utils';
import { onMounted } from 'vue';

const registerTopBar = () => {
  const plugin = usePlugin()
  plugin.addTopBar({
    icon: "iconSuper",
    title: plugin.i18n.pluginName,
    position: "right",
    callback: () => {
      openSettings()
    },
  });
}
onMounted(() => {
  registerTopBar()
})

</script>

<style lang="scss" scoped>

</style>
