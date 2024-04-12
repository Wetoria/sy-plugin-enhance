<template>
  <Teleport :to="settingRef" v-if="settingRef">
    <slot></slot>
  </Teleport>
</template>

<script setup lang="ts">
import { registerSettingRef } from './EnSettings.vue';

const props = defineProps<{
  name: string
}>()

const settingRef = registerSettingRef(props.name)
</script>

<style lang="scss" scoped>
.moduleHead {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
