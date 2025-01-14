<template>
  <Teleport
    v-if="settingRef"
    :to="settingRef"
  >
    <slot></slot>
  </Teleport>
</template>

<script setup lang="ts">
import {
  registerSettingRef,
  unregisterSettingRef,
} from '@/modules/Settings/SettingsModuleControl'
import { onUnmounted } from 'vue'

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
