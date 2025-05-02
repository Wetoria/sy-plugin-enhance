<template>
  <a-tooltip :content="`切换至 ${promptText}`">
    <a-button @click="toggleViewMode">
      <SyIcon :name="viewModeIcon" />
    </a-button>
  </a-tooltip>
</template>

<script setup lang="ts">
import SyIcon from '@/components/SiyuanTheme/SyIcon.vue'
import { computed } from 'vue'

type ViewMode = 'whiteboard' | 'lineage'

const emits = defineEmits<{
  (e: 'viewModeChange', mode: ViewMode): void
}>()

const viewMode = defineModel<ViewMode>('viewMode', { required: true, default: 'whiteboard' })
const viewModeIcon = computed(() => viewMode.value === 'whiteboard' ? 'iconGraph' : 'iconMindmap')
const promptText = computed<ViewMode>(() => viewMode.value === 'lineage' ? 'whiteboard' : 'lineage')

const toggleViewMode = () => {
  viewMode.value = viewMode.value === 'whiteboard' ? 'lineage' : 'whiteboard'

  emits('viewModeChange', viewMode.value)
}
</script>

<style lang="scss" scoped>

</style>