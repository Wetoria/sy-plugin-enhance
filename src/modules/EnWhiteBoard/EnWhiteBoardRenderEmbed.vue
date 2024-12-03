<template>
  <EnProtyleCustomArea
    :getTargetBlockDom="data.getDom"
  >
    <div class="EnWhiteBoardRenderContainer">
      <a-resize-box
        :directions="['bottom']"
        :style="{
          minHeight: `${module.embedBlockMinHeight}px`
        }"
        v-model:height="whiteBoardConfig.embedOptions[data.nodeId].height"
      >
        {{ data.whiteBoardId }} - {{ data.nodeId }}
      </a-resize-box>
    </div>
  </EnProtyleCustomArea>
</template>

<script lang="ts">
</script>

<script setup lang="ts">
import { useSettingModuleData } from '../Settings/EnSettings.vue';
import { EnWhiteBoard, EnWhiteBoardBlockDomTarget, EnWhiteBoardSetting, whiteBoardConfigList } from './EnModuleWhiteBoard.vue';
import EnProtyleCustomArea from '@/components/EnProtyleCustomArea.vue';
import { computed, watchEffect } from 'vue';

const props = defineProps<{
  data: EnWhiteBoardBlockDomTarget
}>()

const module = useSettingModuleData<EnWhiteBoardSetting>(EnWhiteBoard)

const whiteBoardConfig = computed(() => {
  return whiteBoardConfigList.value.data[props.data.whiteBoardId]
})
watchEffect(() => {
  if (!whiteBoardConfig.value.embedOptions[props.data.nodeId]) {
    whiteBoardConfig.value.embedOptions[props.data.nodeId] = {
      height: 0,
    }
  }
})
</script>

<style lang="scss" scoped>
.EnWhiteBoardRenderContainer {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  border: 1px solid red;
}
</style>
