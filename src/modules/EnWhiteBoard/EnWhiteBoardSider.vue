<template>
  <div
    ref="EnWhiteBoardSiderRef"
    class="EnWhiteBoardSider"
    :class="{
      shown: embedBlockOptions[`Sider${pos}Show`],
      needSider,
      [pos]: true,
    }"
  >
    <div
      class="ToolbarArea Top"
      :class="{
        showAngle: showAngle.top,
      }"
    >
      <a-button-group
        class="ButtonGroup"
      >
        <slot name="SiderTopButtonGroupBefore" />
        <slot name="SiderTopButtonGroupAfter" />
      </a-button-group>
    </div>


    <div
      class="folderArea"
    >
      <a-resize-box
        v-show="needSider"
        v-model:width="embedBlockOptions[`Sider${pos}Width`]"
        :directions="[resizePost]"
        :style="{
          height: '100%',
          maxWidth: embedBlockOptions[`Sider${pos}Width`] > 0 ? '100%' : '0',
        }"
        @moving="calcWidthEnough"
      >
        <div>
          <slot></slot>
        </div>
      </a-resize-box>
    </div>


    <div
      class="ToolbarArea Bottom"
      :class="{
        showAngle: showAngle.bottom,
      }"
    >
      <a-button-group
        class="ButtonGroup"
      >
        <slot name="SiderBottomButtonGroupBefore" />
        <a-button
          v-if="needSider"
          @click="changeSiderShown()"
        >
          <SyIcon :name="folderIconName" />
        </a-button>
        <slot name="SiderBottomButtonGroupAfter" />
      </a-button-group>
    </div>
  </div>
</template>

<script setup lang="ts">
import SyIcon from '@/components/SiyuanTheme/SyIcon.vue'
import { EnWhiteBoardConfig } from '@/modules/EnWhiteBoard/EnWhiteBoard'
import {
  computed,
  onMounted,
  onUnmounted,
  ref,
} from 'vue'

const props = defineProps<{
  needSider: boolean
  pos: 'Left' | 'Right'
  embedBlockOptions: EnWhiteBoardConfig['embedOptions']['id']
}>()

const isLeft = computed(() => props.pos === 'Left')


const showAngle = ref({
  top: false,
  bottom: false,
})
const EnWhiteBoardSiderRef = ref<HTMLDivElement | null>(null)
let resizeObserver: ResizeObserver | null = null

const calcWidthEnough = () => {
  const calc = () => {
    const siderWidth = EnWhiteBoardSiderRef.value?.clientWidth

    const topButtonGroup = EnWhiteBoardSiderRef.value?.querySelector('.ToolbarArea.Top .ButtonGroup')
    const topButtonGroupWidth = topButtonGroup?.clientWidth
    const topButtonGroupHeight = topButtonGroup?.clientHeight

    const bottomButtonGroup = EnWhiteBoardSiderRef.value?.querySelector('.ToolbarArea.Bottom .ButtonGroup')
    const bottomButtonGroupWidth = bottomButtonGroup?.clientWidth
    const bottomButtonGroupHeight = bottomButtonGroup?.clientHeight

    showAngle.value.top =
      siderWidth < topButtonGroupWidth - 7 && !!topButtonGroupHeight
    showAngle.value.bottom =
      siderWidth < bottomButtonGroupWidth - 7 && !!bottomButtonGroupHeight
  }
  calc()

}

onMounted(() => {
  resizeObserver = new ResizeObserver(() => {
    calcWidthEnough()
  })

  if (EnWhiteBoardSiderRef.value) {
    resizeObserver.observe(EnWhiteBoardSiderRef.value)
  }
})

onUnmounted(() => {
  resizeObserver?.disconnect()
  resizeObserver = null
})

const changeSiderShown = () => {
  const newShown = !props.embedBlockOptions[`Sider${props.pos}Show`]
  if (newShown) {
    props.embedBlockOptions[`Sider${props.pos}Width`] = props.embedBlockOptions[`Sider${props.pos}WidthLast`]
    props.embedBlockOptions[`Sider${props.pos}Show`] = newShown
  } else {
    props.embedBlockOptions[`Sider${props.pos}WidthLast`] = props.embedBlockOptions[`Sider${props.pos}Width`]
    props.embedBlockOptions[`Sider${props.pos}Width`] = 0
    props.embedBlockOptions[`Sider${props.pos}Show`] = newShown
  }
}

const resizePost = computed(() => {
  const map = {
    Right: 'left',
    Left: 'right',
  }
  return map[props.pos]
})
const folderIconName = computed(() => {
  const map = ['iconOutdent', 'iconIndent']
  if (!isLeft.value) {
    map.reverse()
  }

  return map[
    props.embedBlockOptions[`Sider${props.pos}Show`] ? 0 : 1
  ]
})

</script>

<style lang="scss" scoped>

.EnWhiteBoardSider {
  height: 100%;
  box-sizing: border-box;
  max-width: 95%;

  display: flex;
  flex-direction: column;

  position: relative;

  background-color: var(--b3-theme-surface);

  // 用于控制相关内容的计算
  --en-is-sider-left: 0;
  --en-is-sider-right: 0;

  --en-is-toolbar-top: 0;
  --en-is-toolbar-bottom: 0;

  &.Left {
    --en-is-sider-left: 1;
  }
  &.Right {
    --en-is-sider-right: 1;
  }

  .ToolbarArea.Top {
    --en-is-toolbar-top: 1;
  }
  .ToolbarArea.Bottom {
    --en-is-toolbar-bottom: 1;
  }

  .folderArea {
    flex: 1;
  }

  .ToolbarArea {
    height: calc(var(--en-gap) * 2 + 24px);
    box-sizing: border-box;
    display: flex;
    position: relative;

    &::after {
      content: '';
      position: absolute;
      width: var(--en-gap);
      height: var(--en-gap);
      transition: opacity 0.1s cubic-bezier(0.4, 0, 0.2, 1);
      opacity: 1;
    }

    .ButtonGroup {
      position: absolute;
      background-color: var(--b3-theme-surface);
      padding: var(--en-gap);
      box-sizing: border-box;
      z-index: 3;

      min-width: fit-content;

      // 使用 max 函数确保只有一个值生效
      --top-value: calc(var(--en-is-toolbar-top) * 0px);
      --bottom-value: calc(var(--en-is-toolbar-bottom) * 0px);

      top: var(--top-value);
      bottom: var(--bottom-value);

      // 当 --en-is-toolbar-top 为 1 时，移除 bottom 值
      bottom: calc(var(--bottom-value) * (1 - var(--en-is-toolbar-top)));
      // 当 --en-is-toolbar-bottom 为 1 时，移除 top 值
      top: calc(var(--top-value) * (1 - var(--en-is-toolbar-bottom)));

      &:empty {
        display: none;
      }
    }
  }

  &.Left {
    .ButtonGroup {
      padding-left: var(--en-arco-resizebox-trigger-default-width);

      border-top-right-radius: var(--b3-border-radius);
      border-bottom-right-radius: var(--b3-border-radius);
    }

    &:not(.shown) {
      .ButtonGroup {
        right: 0;
        transform: translateX(calc(100% - var(--en-arco-resizebox-trigger-default-width)));
      }
    }
    &.shown {
      .ButtonGroup {
        left: 0;
        right: unset;

        width: 100%;
        justify-content: flex-start;
      }
    }

    &:not(.needSider) {
      .ButtonGroup {
        left: unset;
        right: 0;
        transform: translateX(calc(100%));
      }
    }


    // #region 控制倒圆角
    .ToolbarArea {
      &.Top::after {
        background: radial-gradient(circle at bottom right,
          transparent var(--en-gap),
          var(--b3-theme-surface) 0);
      }
      &.Bottom::after {
        background: radial-gradient(circle at top right,
          transparent var(--en-gap),
          var(--b3-theme-surface) 0);
      }
    }
    .ToolbarArea {
      &.Top::after {
        bottom: calc(var(--en-gap) * -1);
        right: calc(var(--en-arco-resizebox-trigger-default-width) * -1);
      }
      &.Bottom::after {
        top: calc(var(--en-gap) * -1);
        right: calc(var(--en-arco-resizebox-trigger-default-width) * -1);
      }
    }

    &:not(.needSider) {
      .ToolbarArea {
        &.Top::after {
          bottom: calc(var(--en-gap) * -1);
          right: calc(var(--en-gap) * -1);
        }
        &.Bottom::after {
          top: calc(var(--en-gap) * -1);
          right: calc(var(--en-gap) * -1);
        }
      }
    }
    // #endregion 控制倒圆角
  }


  &.Right {
    .ButtonGroup {
      padding-right: var(--en-arco-resizebox-trigger-default-width);

      border-top-left-radius: var(--b3-border-radius);
      border-bottom-left-radius: var(--b3-border-radius);
    }

    &:not(.shown) {
      .ButtonGroup {
        left: 0;
        right: unset;
        transform: translateX(calc(-100% + var(--en-arco-resizebox-trigger-default-width)));
      }
    }
    &.shown {
      .ButtonGroup {
        left: unset;
        right: 0;

        width: 100%;
        justify-content: flex-end;
      }
    }

    &:not(.needSider) {
      .ButtonGroup {
        left: 0;
        right: unset;
        transform: translateX(calc(-100%));
      }
    }

    // #region 控制倒圆角
    .ToolbarArea {
      &.Top::after {
        background: radial-gradient(circle at bottom left,
          transparent var(--en-gap),
          var(--b3-theme-surface) 0);
      }
      &.Bottom::after {
        background: radial-gradient(circle at top left,
          transparent var(--en-gap),
          var(--b3-theme-surface) 0);
      }
    }
    .ToolbarArea {
      &.Top::after {
        bottom: calc(var(--en-gap) * -1);
        left: calc(var(--en-arco-resizebox-trigger-default-width) * -1);
      }
      &.Bottom::after {
        top: calc(var(--en-gap) * -1);
        left: calc(var(--en-arco-resizebox-trigger-default-width) * -1);
      }
    }

    &:not(.needSider) {
      .ToolbarArea {
        &.Top::after {
          bottom: calc(var(--en-gap) * -1);
          left: calc(var(--en-gap) * -1);
        }
        &.Bottom::after {
          top: calc(var(--en-gap) * -1);
          left: calc(var(--en-gap) * -1);
        }
      }
    }
    // #endregion 控制倒圆角
  }

  .ToolbarArea:not(.showAngle)::after {
    opacity: 0;
  }
}
</style>
