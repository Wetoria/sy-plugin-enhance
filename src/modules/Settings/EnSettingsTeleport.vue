<template>
  <Teleport :to="settingRef" v-if="settingRef">
    <slot></slot>
  </Teleport>
</template>

<script setup lang="ts">
import { onUnmounted } from 'vue';
import { registerSettingRef, unregisterSettingRef } from '@/modules/Settings/EnSettings.vue';

const props = defineProps<{
  name: string
}>()

const settingRef = registerSettingRef(props.name)

onUnmounted(() => {
  unregisterSettingRef(props.name)
})
</script>

<style lang="scss" scoped>
.moduleHead {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
