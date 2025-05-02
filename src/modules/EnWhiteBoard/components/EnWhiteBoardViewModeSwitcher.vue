<template>
  <a-button @click="toggleViewMode">
    <SyIcon :name="viewModeIcon" />
  </a-button>
</template>

<script setup lang="ts">
import SyIcon from '@/components/SiyuanTheme/SyIcon.vue'
import { computed } from 'vue'

const emits = defineEmits<{
  (e: 'viewModeChange', mode: 'whiteboard' | 'lineage'): void
}>()

const viewMode = defineModel< 'whiteboard' | 'lineage'>('viewMode', { required: true, default: 'whiteboard' })
const viewModeIcon = computed(() => viewMode.value === 'whiteboard' ? 'iconGraph' : 'iconMindmap')

const toggleViewMode = () => {
  viewMode.value = viewMode.value === 'whiteboard' ? 'lineage' : 'whiteboard'

  emits('viewModeChange', viewMode.value)
}
</script>

<style lang="scss" scoped>

</style>