<template>
  <div class="SyEnhancerApp">
    <FixedTools />
  </div>
</template>

<script setup>
import { watch } from 'vue';
import FixedTools from './components/FixedTools.vue';
import { useSettings } from './logic';

const settings = useSettings()

watch(() => settings.value.useVip, () => {
  document.documentElement.dataset.enhancer = `${settings.value.useVip}`
})

</script>

<style lang="scss">

</style>
