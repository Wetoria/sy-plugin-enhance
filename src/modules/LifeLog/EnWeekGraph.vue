<template>
  <div
    ref="EnWeekGraphRef"
    class="EnWeekGraph"
  >
    <div class="DateRow">
      <div class="Column PromptColumn Cell LeftTop">
        <slot name="topLeftCell"></slot>
      </div>
      <div
        v-for="(date, index) in dateList"
        :key="`${date}-${index}`"
        class="Column DateColumn"
        :data-date="date"
      >
        <div class="Cell">
          <slot :name="`dateRowDateColumnCell-${date}`">
            <div
              v-if="dayjs(date).isSame(dayjs(), 'day')"
              class="Today"
            >
              今
            </div>
            <div>
              {{ date }}
            </div>
          </slot>
        </div>
      </div>
    </div>
    <div class="DailyRow">
      <div class="Column PromptColumn Cell">

      </div>
      <div
        v-for="(date, index) in dateList"
        :key="`${date}-${index}`"
        class="Column DateColumn"
        :data-date="date"
      >

      </div>
    </div>
    <div
      class="TimelineArea"
    >
      <div
        class="Column PromptColumn"
        style="height: var(--en-week-graph-timeline-area-height);"
      >
        <div class="PromptArea">
          <div
            v-for="timeIndex of 24"
            :key="timeIndex"
            class="PromptItem"
          >
            <div class="timeContainer">
              <span class="time">
                {{ String(timeIndex).padStart(2, '0') }}:00
              </span>
            </div>
          </div>
        </div>
      </div>
      <div
        v-for="(date, index) in dateList"
        :key="`${date}-${index}`"
        class="Column DateColumn"
        style="height: var(--en-week-graph-timeline-area-height);"
        :data-date="date"
      >
        <div class="PromptArea">
          <div
            v-for="timeIndex of 24"
            :key="timeIndex"
            class="PromptItem"
          >
            <div class="divider"></div>
          </div>
        </div>
        <slot
          :name="`timelineAreaDateColumn-${date}`"
        ></slot>
      </div>


      <div
        class="PromptCurrentArea"
        style="
          height: var(--en-week-graph-timeline-area-height);
          width: 100%;
        "
      >
        <div
          class="PromptCurrent"
          :style="{
            top: `calc(${((currentSecondDiff / secondsOfADay) * 100)}%)`,
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
    </div>
  </div>
</template>

<script setup lang="ts">
import { watchConfigChanged } from '@/modules/EnModuleControl/ModuleProvide'
import dayjs from 'dayjs'
import {
  computed,
  onBeforeUnmount,
  onMounted,
  ref,
  watchEffect,
} from 'vue'

const props = defineProps<{
  dateList: string[]
  columnWidth?: number
  timelineHeight?: number
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

const EnWeekGraphRef = ref<HTMLElement>()
const timelineAreaHeight = ref(props.timelineHeight || 2000)
watchEffect(() => {
  timelineAreaHeight.value = props.timelineHeight || 2000
})
onMounted(() => {
  watchConfigChanged(
    () => timelineAreaHeight.value,
    () => {
      EnWeekGraphRef.value.style.setProperty('--en-week-graph-timeline-area-height', `${timelineAreaHeight.value}px`)
      return () => {
        EnWeekGraphRef.value.style.removeProperty('--en-week-graph-timeline-area-height')
      }
    },
  )
})

const dateColumnWidth = computed(() => {
  return props.columnWidth || 150
})
onMounted(() => {
  watchConfigChanged(
    () => dateColumnWidth.value,
    () => {
      EnWeekGraphRef.value.style.setProperty('--en-week-graph-column-width', `${dateColumnWidth.value}px`)
      return () => {
        EnWeekGraphRef.value.style.removeProperty('--en-week-graph-column-width')
      }
    },
  )
})
</script>

<style lang="scss" scoped>
.EnWeekGraph {
  --en-week-graph-prompt-column-width: 48px;
  --en-week-graph-font-size: 12px;
  --en-week-graph-border: 1px solid var(--b3-border-color);
  // --en-week-graph-timeline-area-height: 2000px;

  --en-week-graph-daterow-height: 30px;
  --en-week-graph-dailyrow-height: 0px;

  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: auto;
  background-color: var(--b3-theme-surface);
  color: var(--b3-theme-on-background);

  &::-webkit-scrollbar {
    display: none;
  }
  -ms-overflow-style: none;
  scrollbar-width: none;

  font-size: var(--en-week-graph-font-size);

  div {
    box-sizing: border-box;
  }

  .DateRow,
  .DailyRow,
  .TimelineArea {
    display: flex;
    width: max-content;

    position: relative;
  }



  // #region 👇 统一列宽度
  .Column {
    width: var(--en-week-graph-column-width);
    flex-shrink: 0;
  }


  .PromptColumn {
    width: var(--en-week-graph-prompt-column-width);
    flex-shrink: 0;
  }
  // #endregion 👆 统一列宽度




  // #region 👇 处理吸顶

  .DateRow,
  .DailyRow {
    position: sticky;
    top: 0;
    z-index: 3;
    flex-shrink: 0;

    .Cell {
      height: 100%;
    }
  }

  .DateRow {
    height: var(--en-week-graph-daterow-height);
  }

  .PromptColumn {
    position: sticky;
    left: 0;
    z-index: 2;
  }
  // #endregion 👆 处理吸顶



  .Cell {
    background-color: var(--b3-theme-surface);
  }



  // #region 👇 处理边框
  .Cell.LeftTop {
    border: var(--en-week-graph-border);
  }

  .DateRow .DateColumn .Cell {
    border-top: var(--en-week-graph-border);
    border-right: var(--en-week-graph-border);
    border-bottom: var(--en-week-graph-border);
  }

  .PromptColumn {
    border-left: var(--en-week-graph-border);
    border-right: var(--en-week-graph-border);
  }


  .TimelineArea .DateColumn {
    border-right: var(--en-week-graph-border);
  }
  // #endregion 👆 处理边框



  // #region 👇 居中顶部日期

  .DateRow .DateColumn .Cell {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 2px;
  }

  .DateRow .DateColumn .Cell .Today {
    background-color: red;
    color: white;
    border-radius: 100%;
    width: 18px;
    height: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  // #endregion 👆 居中顶部日期


  // #region 👇 处理时间提示
  .TimelineArea .DateColumn {
    position: relative;
  }

  .PromptArea {
    width: 100%;
    height: 100%;
    position: absolute;
    top: 0;
    pointer-events: none;

    .PromptItem {
      width: 100%;
      height: calc(100% / 24);
      display: flex;
      align-items: flex-end;

      .divider {
        flex: 1;
        border-top: var(--en-week-graph-border);
      }

      .timeContainer {
        width: var(--en-week-graph-prompt-column-width);
        box-sizing: border-box;
        height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: flex-end;
        font-variant-numeric: tabular-nums;
        background-color: var(--b3-theme-surface);
        padding: 0 var(--en-gap);
      }
    }
  }


  .TimelineArea .PromptColumn {
    background-color: var(--b3-theme-surface);
    .PromptItem:not(:last-child) {
      .timeContainer {
        transform: translateY(9px);
      }
    }
  }
  // #endregion 👆 处理时间提示


  .PromptCurrentArea {
    position: absolute;
    top: 0;
    left: 0;
    z-index: 2;
    width: 100%;

    .PromptCurrent {
      position: absolute;
      left: 0;

      width: 100%;

      font-size: calc(var(--en-week-graph-font-size) * 0.8);
      font-weight: bold;
      display: flex;


      .timeContainer {
        width: var(--en-week-graph-prompt-column-width);
        box-sizing: border-box;
        display: flex;
        justify-content: center;
        align-items: center;
        font-variant-numeric: tabular-nums;
        background-color: red;
        padding: 1px calc(var(--en-gap) - 1px);
        color: white;
        border-radius: 100vw;
        transform: translateY(-50%);
        position: sticky;
        left: 0px;
        z-index: 1;
      }

      .divider {
        display: flex;
        width: calc(100% - (var(--en-week-graph-prompt-column-width) - 6px) - 3px);
        border-top: 1px solid red;
        opacity: 0.4;
        position: sticky;
        left: calc(var(--en-week-graph-prompt-column-width) - 6px + 3px);
      }
    }
  }


  .TimelineArea {
    min-height: calc(100% - var(--en-week-graph-daterow-height) - var(--en-week-graph-dailyrow-height));

    .PromptCurrentArea,
    .Column {
      min-height: 100%;
    }
  }
}
</style>
