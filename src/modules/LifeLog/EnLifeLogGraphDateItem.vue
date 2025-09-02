<template>
  <div
    v-for="record of data"
    :key="record.block_id"
    class="EnLifeLogGraphItem"
    :data-en_lifelog_date="record.date"
    :data-en_lifelog_type="record.type"
    :data-en_lifelog_content="record.content"
    :data-en_lifelog_diff="record.diff"
    :data-en_lifelog_diff_format="record.diffFormatted"
    :data-en_lifelog_highlight="record.highlight"

    :style="{
      height: `${(record.diff / secondsOfADay) * 100}%`,
    }"
  >
    <div
      class="EnLifeLogItemBg"
      :class="{
        highlight: record.highlight,
      }"
      :style="{
        backgroundColor: `var(--en-lifelog-color-type-${record.type})`,
      }"
    >

    </div>
    <div class="infos">
      <div
        class="info"
      >
        持续：{{ record.totalDiffFormatted }}
      </div>
      <div class="info">
        {{
          [
            record.type,
            moduleOptions.enablePrivacyMode ? '' : record.content,
          ].filter(Boolean).join('：')
        }}
      </div>
      <div
        v-if="(record.diff / secondsOfADay) > 0.01"
        class="time info"
      >
        {{ record.endTime.format(lifelogKeyMap.HH_mm_ss) }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useModule } from '@/modules/EnModuleControl/ModuleProvide'
import { lifelogKeyMap } from '@/modules/LifeLog/LifeLog'
import { EN_MODULE_LIST } from '@/utils/Constants'


const props = defineProps<{
  data: Array<ILifeLogRecord>
}>()

const {
  moduleOptions,
} = useModule<LifeLogModule>(EN_MODULE_LIST.LIFELOG)

const secondsOfADay = 60 * 60 * 24
</script>

<style lang="scss" scoped>
.EnLifeLogGraphItem {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  font-size: var(--en-lifelog-graph-font-size, 8px);
  color: var(--b3-theme-on-background);
  width: 100%;
  position: relative;
  justify-content: flex-end;
  box-sizing: border-box;
  border-radius: 4px;

  .EnLifeLogItemBg {
    width: 100%;
    height: calc(100% - 1px);
    position: absolute;
    top: 0;
    left: 0;
    z-index: 0;
    opacity: 0.2;
    transition: opacity 0.2s ease-in-out;

    &.highlight {
      opacity: 0.5;
    }
  }

  .infos {
    display: inline-block;
    width: 100%;
    padding: 4px;
    box-sizing: border-box;
    z-index: 1;
  }

  .info {
    overflow: hidden;
    text-overflow: ellipsis;
    width: 100%;
    white-space: nowrap;
  }
}
</style>
