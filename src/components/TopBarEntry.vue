<template>

</template>

<script setup lang="ts">
import { usePlugin } from '@/main';
import { openSetting } from '@/utils';
import { onMounted } from 'vue';

const registerTopBar = () => {
  const plugin = usePlugin()
  plugin.addTopBar({
    icon: "iconSuper",
    title: plugin.i18n.pluginName,
    position: "right",
    callback: () => {
      openSetting()
    },
  });
}
onMounted(() => {
  registerTopBar()
})

</script>

<style lang="scss" scoped>

</style>
