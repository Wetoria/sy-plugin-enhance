<template>
  <EnProtyleCustomArea
    :getTargetBlockDom="data.getDom"
  >
    <template #customArea>
      <a-resize-box
        :directions="['bottom']"
        style="min-height: 200px;"
      >
        <div class="EnWhiteBoardCustomAreaPlaceholder">
        </div>
      </a-resize-box>
    </template>
    <div class="EnWhiteBoardRenderContainer">
      {{ data.whiteBoardId }} - {{ data.nodeId }}
    </div>
  </EnProtyleCustomArea>
</template>

<script setup lang="ts">
import { EnWhiteBoardBlockDomTarget } from './EnModuleWhiteBoard.vue';
import EnProtyleCustomArea from '@/components/EnProtyleCustomArea.vue';

const props = defineProps<{
  data: EnWhiteBoardBlockDomTarget
}>()
</script>

<style lang="scss" scoped>
.EnWhiteBoardRenderContainer {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}
</style>
