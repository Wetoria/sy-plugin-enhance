<template>
  <slot />
</template>

<script lang="ts">
</script>


<script setup lang="ts">
import { useSettings } from '@/modules/Settings/EnSettings.vue'
import { provide } from 'vue'

const settings = useSettings()
provide('settings', settings)
</script>

<style lang="scss" scoped>

</style>
