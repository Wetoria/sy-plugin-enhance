<template>
  <div class="EnLifeLogSideGraph">
    <div class="PromptArea">
      <div
        v-for="index of 24"
        :key="index"
        class="PromptItem"
      >
        <div class="timeContainer">
          <span class="time">
            {{ String(index).padStart(2, '0') }}:00
          </span>
        </div>
        <div class="divider"></div>
      </div>

      <div
        class="PromptCurrent"
        :style="{
          top: `calc(${((currentSecondDiff / secondsOfADay) * 100)}% - 1px)`,
        }"
      >
        <div class="timeContainer">
          <span class="time">
            {{ current.format('HH:mm') }}
          </span>
        </div>
        <div class="divider"></div>
      </div>
    </div>

    <div class="GraphPlaceholderArea">
      <div class="GraphAreaPlaceholder">
        <slot name="placeholder"></slot>
      </div>
    </div>
    <div class="GraphArea">
      <div
        v-for="(date, index) of dateList"
        :key="`${date}-${index}`"
        :data-en_lifelog_date="date"
        class="EnLifeLogSideGraphItem"
      >
        <div
          class="GraphItemDateTitleArea"
        >
          {{ date }}
        </div>
        <div class="GraphItemMain">
          <slot
            :name="date"
            :secondsOfADay="secondsOfADay"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import dayjs from 'dayjs'
import {
  computed,
  onBeforeUnmount,
  onMounted,
  ref,
} from 'vue'

const props = defineProps<{
  dateList: Array<any>
}>()

const secondsOfADay = 60 * 60 * 24
const current = ref(dayjs())
let calcFlag = null
onMounted(() => {
  calcFlag = setInterval(() => {
    current.value = dayjs()
  }, 1000)
})
onBeforeUnmount(() => {
  clearInterval(calcFlag)
})
const currentSecondDiff = computed(() => {
  const startOfToday = current.value.startOf('day')
  const secondsUntilMidnight = current.value.diff(startOfToday, 'second')
  return secondsUntilMidnight
})

</script>

<style lang="scss" scoped>
.EnLifeLogSideGraph {
  --en-lifelog-graph-prompt-area-width: 37px;
  --en-lifelog-graph-date-title-area-height: 24px;

  display: flex;
  height: 100%;
  min-width: calc(var(--en-lifelog-graph-prompt-area-width) + 5px);
  width: 100%;
  background-color: var(--b3-theme-surface);
  flex-direction: column;

  .PromptArea {
    width: 100%;
    height: calc(100% - var(--en-lifelog-graph-date-title-area-height));
    position: absolute;
    z-index: 1;
    top: var(--en-lifelog-graph-date-title-area-height);
    left: 0;
    font-size: var(--en-lifelog-graph-font-size, 8px);
    display: flex;
    flex-direction: column;
    pointer-events: none;


    .PromptItem {
      width: 100%;
      height: calc(100% / 24);
      position: relative;
      display: flex;
      align-items: flex-end;

      .divider {
        flex: 1;
        border-top: 1px solid var(--b3-border-color);
      }

      .timeContainer {
        width: var(--en-lifelog-graph-prompt-area-width);
        box-sizing: border-box;
        height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: flex-end;
        font-variant-numeric: tabular-nums;
        background-color: var(--b3-theme-surface);
        border-right: 1px solid var(--b3-border-color);
        padding: 0 var(--en-gap);
      }
    }

    .PromptCurrent {
      position: absolute;
      left: 0px;
      z-index: 2;
      display: flex;

      width: 100%;

      font-size: var(--en-lifelog-graph-font-size, 8px);
      font-weight: bold;

      .divider {
        flex: 1;
        border-top: 1px solid red;
        opacity: 0.3;
      }

      .timeContainer {
        width: var(--en-lifelog-graph-prompt-area-width);
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        justify-content: flex-end;
        font-variant-numeric: tabular-nums;
        background-color: red;
        padding: 2px calc(var(--en-gap) - 1px);
        color: white;
        border-radius: var(--b3-border-radius);
        transform: translateY(-50%);
      }
    }
  }



  .GraphPlaceholderArea {
    width: var(--en-lifelog-graph-prompt-area-width);
    height: 100%;
    position: absolute;
    left: 0;
    top: 0;
    z-index: 1;

    .GraphAreaPlaceholder {
      box-sizing: border-box;
      width: var(--en-lifelog-graph-prompt-area-width);
      height: var(--en-lifelog-graph-date-title-area-height);
      border-right: 1px solid var(--b3-border-color);
      border-bottom: 1px solid var(--b3-border-color);
    }
  }

  .GraphArea {
    min-width: 5px;
    max-width: calc(100% - var(--en-lifelog-graph-prompt-area-width));
    height: 100%;
    z-index: 1;
    display: flex;
    flex-direction: row;
    margin-left: var(--en-lifelog-graph-prompt-area-width);
    overflow-x: auto;
    &::-webkit-scrollbar {
      display: none;
    }
    -ms-overflow-style: none;
    scrollbar-width: none;


    .EnLifeLogSideGraphItem {
      width: 150px;
      height: 100%;
      flex-shrink: 0;
      display: flex;
      flex-direction: column;
    }

    .EnLifeLogSideGraphItem + .EnLifeLogSideGraphItem {
      border-left: 1px solid var(--b3-border-color);
    }

    .GraphItemDateTitleArea {
      height: var(--en-lifelog-graph-date-title-area-height);
      border-bottom: 1px solid var(--b3-border-color);
      box-sizing: border-box;
      padding: 2px var(--en-gap);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .GraphItemDateTitleArea {
      position: sticky;
      top: 0;
    }

    .GraphItemMain {
      width: 100%;
      height: calc(100% - var(--en-lifelog-graph-date-title-area-height));
      display: flex;
      flex-direction: column;
    }
  }

}
</style>
